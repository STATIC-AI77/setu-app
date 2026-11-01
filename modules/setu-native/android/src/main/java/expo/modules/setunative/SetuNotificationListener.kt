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
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class SetuNotificationListener : NotificationListenerService() {
    companion object {
        private var lastProcessedText = ""
        private var lastProcessedTime = 0L
        private const val ALERT_CHANNEL_ID = "setu_scam_alerts"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val pkg = sbn.packageName ?: ""
        val isWhatsApp = pkg == "com.whatsapp" || pkg == "com.whatsapp.w4b"
        val isSms = pkg == "com.google.android.apps.messaging" || pkg.contains("mms") || pkg.contains("sms")

        if (!isWhatsApp && !isSms) return
        if (!SetuConfig.isProtectionEnabled(this)) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        if (text.isBlank() || (text == lastProcessedText && System.currentTimeMillis() - lastProcessedTime < 4000)) {
            return
        }
        lastProcessedText = text
        lastProcessedTime = System.currentTimeMillis()

        val channel = if (isWhatsApp) "whatsapp" else "sms"
        val sender = title.ifBlank { "Unknown" }

        Thread {
            SetuApiClient.sendEvent(this, "notification_read", JSONObject().apply {
                put("channel", channel)
                put("sender", sender)
            })

            val result = SetuApiClient.detect(this, channel, text, sender)
            if (result == null) {
                SetuConfig.addLog(this, channel.uppercase(), "Msg from $sender: checked (safe)")
                return@Thread
            }

            if (result.isScam) {
                val verdictLog = "Msg from $sender → SCAM (${result.scamType}, ${result.riskScore}%)"
                SetuConfig.addLog(this, channel.uppercase(), verdictLog)

                if (result.action == "arm_interlock") {
                    // 1. Activate payment app interlock
                    SetuOverlayService.arm(this, result.scamType, result.riskScore)
                    // 2. Show prominent red scam alert banner in notification tray
                    showScamAlertNotification(sender, result.scamType, text)
                    // 3. Per spec: Do NOT reply to scammer on arm_interlock
                } else if (SetuConfig.isAutoReplyEnabled(this)) {
                    val replyAction = findQuickReplyAction(sbn.notification)
                    if (replyAction != null) {
                        val reply = SetuApiClient.getDecoyReply(this, sender, text, result.scamType)
                        if (!reply.isNullOrBlank()) {
                            sendQuickReply(replyAction.first, replyAction.second, reply)
                            SetuConfig.addLog(this, "SAROJ", "Replied: \"$reply\"")
                            SetuApiClient.sendEvent(this, "auto_reply_sent", JSONObject().apply {
                                put("sender", sender)
                                put("reply", reply)
                            })
                        }
                    }
                }
            } else {
                SetuConfig.addLog(this, channel.uppercase(), "Msg from $sender: Safe (${result.action})")
            }
        }.start()
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
            }
            nm.createNotificationChannel(channel)
        }

        val notif = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Fraud Alert: $scamType")
            .setContentText("Sender $sender sent suspected fraud. Do not pay or click links.")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Sender $sender sent suspected fraud.\nMessage: \"$messageSnippet\"\n\nFinancial apps are temporarily locked to protect savings."))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setColor(Color.RED)
            .setAutoCancel(true)
            .build()

        nm.notify(8001, notif)
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
