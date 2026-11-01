package expo.modules.setunative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.regex.Pattern

class SetuNotificationListener : NotificationListenerService() {
    companion object {
        private const val ALERT_CHANNEL_ID = "setu_scam_alerts"
        // Cache to deduplicate repeated notification broadcasts (new arrivals only)
        private val processedMessageHashes = ConcurrentHashMap<String, Long>()
        // Sender conversation history for multi-turn adversarial decoy chat
        private val conversationHistories = ConcurrentHashMap<String, MutableList<JSONObject>>()

        private val UPI_PATTERN = Pattern.compile("[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}")
        private val PHONE_PATTERN = Pattern.compile("(?:\\+?91[\\s-]?)?[6-9]\\d{9}")
        private val ACC_PATTERN = Pattern.compile("\\b\\d{9,18}\\b")
        private val URL_PATTERN = Pattern.compile("https?://[^\\s]+")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val pkg = sbn.packageName ?: ""
        val isWhatsApp = pkg == "com.whatsapp" || pkg == "com.whatsapp.w4b"
        val isSms = pkg == "com.google.android.apps.messaging" || pkg.contains("mms") || pkg.contains("sms")

        // 1. Only monitor WhatsApp and SMS
        if (!isWhatsApp && !isSms) return

        // 2. Only proceed if protection is enabled
        if (!SetuConfig.isProtectionEnabled(this)) return

        // 3. Skip group summaries (e.g. "2 new messages from 2 chats")
        val notification = sbn.notification ?: return
        if ((notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) {
            return
        }

        val extras = notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim() ?: ""
        var text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
            ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString()?.trim() ?: ""

        // Android 14/15 MessagingStyle support if text is empty
        if (text.isBlank()) {
            val messages = extras.getParcelableArray(Notification.EXTRA_MESSAGES)
            if (messages != null && messages.isNotEmpty()) {
                val lastMsg = messages.lastOrNull()
                if (lastMsg is Bundle) {
                    text = lastMsg.getCharSequence("text")?.toString()?.trim() ?: ""
                }
            }
        }

        // 4. Ignore empty messages, self-replies, or WhatsApp system notifications
        if (text.isBlank() || title.isBlank()) return
        if (title.equals("WhatsApp", ignoreCase = true) ||
            title.startsWith("WhatsApp Web", ignoreCase = true) ||
            title.contains("Checking for new messages", ignoreCase = true) ||
            title.contains("Backup in progress", ignoreCase = true) ||
            title.equals("You", ignoreCase = true)) {
            return
        }

        // 5. Deduplicate: Ensure NEW ARRIVALS ONLY (ignore repeat posts within 15 seconds)
        val now = System.currentTimeMillis()
        val msgKey = "$pkg:$title:$text"
        val lastSeen = processedMessageHashes[msgKey]
        if (lastSeen != null && (now - lastSeen) < 15000L) {
            return
        }
        processedMessageHashes[msgKey] = now

        // Purge old cache entries (older than 2 minutes)
        if (processedMessageHashes.size > 200) {
            val cutoff = now - 120000L
            processedMessageHashes.entries.removeIf { it.value < cutoff }
        }

        val channel = if (isWhatsApp) "whatsapp" else "sms"
        val sender = title

        Log.i("SetuGuardian", "📥 Intercepted $channel message from: '$sender' | Body: \"$text\"")

        Thread {
            try {
                // Log notification event to telemetry
                SetuApiClient.sendEvent(this, "notification_read", JSONObject().apply {
                    put("channel", channel)
                    put("sender", sender)
                    put("length", text.length)
                })

                Log.i("SetuGuardian", "🤖 Sending to AI Backend /detect: sender='$sender'...")

                // Run message through AI Classifier Service
                val result = SetuApiClient.detect(this, channel, text, sender)
                if (result == null) {
                    Log.w("SetuGuardian", "Backend unreachable for $sender, logged safe.")
                    SetuConfig.addLog(this, channel.uppercase(), "Msg from $sender: checked (safe)")
                    return@Thread
                }

                Log.i("SetuGuardian", "🔍 AI Verdict for '$sender': isScam=${result.isScam}, type=${result.scamType}, score=${result.riskScore}")

                if (result.isScam) {
                    // =====================================================================
                    // DEFENSIVE AGENT SYSTEM: GUARDIAN INTERCEPTION & DECOY TAKEOVER
                    // =====================================================================
                    val verdictLog = "🚨 Msg from $sender → SCAM (${result.scamType}, ${result.riskScore}%)"
                    SetuConfig.addLog(this, channel.uppercase(), verdictLog)
                    Log.w("SetuGuardian", "🚨 SCAM INTERCEPTED: Locking payments and initiating decoy response...")

                    // 1. Arm payment safety interlock quietly to protect bank/UPI apps
                    SetuConfig.setInterlockStatus(this, "armed")

                    // 2. Display prominent RED system notification banner in Android tray
                    showScamAlertNotification(sender, result.scamType, text)

                    // 3. Extract structured intelligence (Mule accounts, UPI IDs, Phones, URLs)
                    val extractedIntel = extractStructuredIntel(text)
                    SetuApiClient.sendEvent(this, "intel_extracted", JSONObject().apply {
                        put("sender", sender)
                        put("scam_type", result.scamType)
                        put("intel", extractedIntel)
                    })

                    // 4. Decoy Agent (Saroj Aunty) takes over the conversation if autoReply is enabled
                    if (SetuConfig.isAutoReplyEnabled(this)) {
                        val replyAction = findQuickReplyAction(notification)
                        if (replyAction != null) {
                            val convId = "wa_${sender.replace(Regex("[^0-9a-zA-Z]"), "")}"
                            val historyList = conversationHistories.getOrPut(sender) { mutableListOf() }

                            // Format history for multi-turn LLM agent
                            val historyArray = JSONArray()
                            for (turn in historyList.takeLast(6)) {
                                historyArray.put(turn)
                            }

                            val decoyReply = SetuApiClient.getDecoyReply(
                                this,
                                sender,
                                text,
                                result.scamType,
                                convId,
                                historyArray
                            )

                            if (!decoyReply.isNullOrBlank()) {
                                // Send quick reply directly into WhatsApp
                                sendQuickReply(replyAction.first, replyAction.second, decoyReply)

                                // Append turns to conversation history for ongoing engagement
                                historyList.add(JSONObject().apply {
                                    put("role", "scammer")
                                    put("text", text)
                                })
                                historyList.add(JSONObject().apply {
                                    put("role", "saroj")
                                    put("text", decoyReply)
                                })

                                SetuConfig.addLog(this, "SAROJ", "Decoy Replied to $sender: \"$decoyReply\"")
                                SetuApiClient.sendEvent(this, "auto_reply_sent", JSONObject().apply {
                                    put("sender", sender)
                                    put("reply", decoyReply)
                                    put("turns", historyList.size / 2)
                                })
                            }
                        }
                    }
                } else {
                    // ETHICAL SAFEGUARD: Legitimate messages are left completely untouched
                    Log.i("SetuGuardian", "🛡️ Ethical Safeguard: Safe message from '$sender' (${result.scamType ?: "clean"}). No action taken.")
                    SetuConfig.addLog(this, channel.uppercase(), "Msg from $sender: Safe (${result.scamType})")
                }
            } catch (e: Exception) {
                SetuConfig.addLog(this, "ERROR", "Notification processing error: ${e.message}")
            }
        }.start()
    }

    private fun extractStructuredIntel(message: String): JSONObject {
        val intel = JSONObject()

        val upis = JSONArray()
        val upiMatcher = UPI_PATTERN.matcher(message)
        while (upiMatcher.find()) upis.put(upiMatcher.group())
        intel.put("upi_ids", upis)

        val phones = JSONArray()
        val phoneMatcher = PHONE_PATTERN.matcher(message)
        while (phoneMatcher.find()) phones.put(phoneMatcher.group())
        intel.put("phone_numbers", phones)

        val accounts = JSONArray()
        val accMatcher = ACC_PATTERN.matcher(message)
        while (accMatcher.find()) accounts.put(accMatcher.group())
        intel.put("bank_accounts", accounts)

        val urls = JSONArray()
        val urlMatcher = URL_PATTERN.matcher(message)
        while (urlMatcher.find()) urls.put(urlMatcher.group())
        intel.put("phishing_urls", urls)

        return intel
    }

    private fun showScamAlertNotification(sender: String, scamType: String, messageSnippet: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "Setu Fraud & Scam Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical alert banners when elder scam is intercepted"
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            nm.createNotificationChannel(channel)
        }

        // Unique notification ID per fraud message so each scam gets exactly one alert
        val notifId = ("scam:$sender:$messageSnippet").hashCode() and 0x7FFFFFFF

        val notif = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle("🚨 Scam Intercepted: $scamType")
            .setContentText("From $sender — Saroj AI protecting your savings.")
            .setStyle(NotificationCompat.BigTextStyle().bigText("⚠️ Fraud from: $sender\nThreat: $scamType\nMessage: \"$messageSnippet\"\n\n🛡️ Saroj AI Decoy is engaging the scammer. Payment apps locked."))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setColor(Color.RED)
            .setColorized(true)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .build()

        Log.i("SetuGuardian", "📢 Posting scam warning notification #$notifId for sender: $sender")
        nm.notify(notifId, notif)
    }

    private fun findQuickReplyAction(notification: Notification): Pair<Notification.Action, RemoteInput>? {
        val actions = notification.actions ?: return null
        for (action in actions) {
            val remoteInputs = action.remoteInputs ?: continue
            for (ri in remoteInputs) {
                if (ri.allowFreeFormInput) {
                    return Pair(action, ri)
                }
            }
        }
        return null
    }

    private fun sendQuickReply(action: Notification.Action, remoteInput: RemoteInput, replyText: String) {
        try {
            val intent = Intent()
            val bundle = Bundle()
            bundle.putCharSequence(remoteInput.resultKey, replyText)
            RemoteInput.addResultsToIntent(arrayOf(remoteInput), intent, bundle)
            action.actionIntent.send(this, 0, intent)
        } catch (_: Exception) {}
    }
}
