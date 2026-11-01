package expo.modules.setunative

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

class SetuBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        val action = intent.action ?: return

        if (action == Intent.ACTION_BOOT_COMPLETED) {
            SetuConfig.addLog(context, "SYSTEM", "Device rebooted — Setu Guardian restored")
            return
        }

        if (action == "expo.modules.setunative.SIMULATE_WHATSAPP") {
            val sender = intent.getStringExtra("sender") ?: "+91 98765 43210"
            val text = intent.getStringExtra("text") ?: "Simulated test scam"
            Log.i("SetuGuardian", "🧪 SIMULATE_WHATSAPP broadcast received from: $sender | Text: \"$text\"")

            Thread {
                try {
                    SetuConfig.addLog(context, "WHATSAPP", "Msg from $sender: \"$text\"")
                    val result = SetuApiClient.detect(context, "whatsapp", text, sender)
                    if (result != null && result.isScam) {
                        Log.w("SetuGuardian", "🚨 SCAM INTERCEPTED: ${result.scamType} (${result.riskScore}%)")
                        SetuConfig.addLog(context, "WHATSAPP", "🚨 SCAM DETECTED (${result.scamType}, ${result.riskScore}%)")
                        SetuConfig.setInterlockStatus(context, "armed")

                        // Show red warning banner
                        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                        val channelId = "setu_scam_alerts"
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            val channel = NotificationChannel(
                                channelId,
                                "Setu Fraud & Scam Alerts",
                                NotificationManager.IMPORTANCE_HIGH
                            ).apply {
                                enableLights(true)
                                lightColor = Color.RED
                                enableVibration(true)
                            }
                            nm.createNotificationChannel(channel)
                        }

                        val notif = NotificationCompat.Builder(context, channelId)
                            .setSmallIcon(android.R.drawable.stat_sys_warning)
                            .setContentTitle("🚨 Scam WhatsApp Intercepted: ${result.scamType}")
                            .setContentText("Sender $sender sent suspected fraud. Interlock armed.")
                            .setStyle(NotificationCompat.BigTextStyle().bigText("Sender: $sender\nThreat: ${result.scamType}\nMessage: \"$text\"\n\n🛡️ Saroj AI Decoy engaging scammer. Financial apps secured."))
                            .setPriority(NotificationCompat.PRIORITY_MAX)
                            .setColor(Color.RED)
                            .setColorized(true)
                            .setAutoCancel(true)
                            .build()
                        nm.notify(8001, notif)

                        if (SetuConfig.isAutoReplyEnabled(context)) {
                            val reply = SetuApiClient.getDecoyReply(context, sender, text, result.scamType)
                            if (!reply.isNullOrBlank()) {
                                SetuConfig.addLog(context, "SAROJ", "Decoy Replied to $sender: \"$reply\"")
                                Log.i("SetuGuardian", "👵 Saroj Decoy Reply: \"$reply\"")
                            }
                        }
                    } else {
                        val verdict = result?.scamType ?: "clean"
                        Log.i("SetuGuardian", "🛡️ Ethical Safeguard: Safe message from $sender ($verdict)")
                        SetuConfig.addLog(context, "WHATSAPP", "Msg from $sender: Safe ($verdict)")
                    }
                } catch (e: Exception) {
                    Log.e("SetuGuardian", "Simulation error: ${e.message}")
                }
            }.start()
        }
    }
}
