package expo.modules.setunative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

class SetuOverlayService : Service() {
    companion object {
        private const val CHANNEL_ID = "setu_overlay_channel"
        private const val NOTIF_ID = 9001
        var isArmed = false
            private set

        fun arm(context: Context, scamType: String, riskScore: Int) {
            val intent = Intent(context, SetuOverlayService::class.java).apply {
                action = "ARM"
                putExtra("scam_type", scamType)
                putExtra("risk_score", riskScore)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun release(context: Context) {
            val intent = Intent(context, SetuOverlayService::class.java).apply {
                action = "RELEASE"
            }
            context.startService(intent)
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: "ARM"
        val scamType = intent?.getStringExtra("scam_type") ?: "Digital Arrest / Scam"
        val riskScore = intent?.getIntExtra("risk_score", 95) ?: 95

        startForeground(NOTIF_ID, buildNotification())

        if (action == "RELEASE") {
            removeOverlay()
            isArmed = false
            SetuConfig.setInterlockStatus(this, "released")
            SetuConfig.addLog(this, "INTERLOCK", "Interlock Released")
            SetuApiClient.sendEvent(this, "interlock_released", JSONObject().put("status", "released"))
            stopSelf()
        } else {
            isArmed = true
            SetuConfig.setInterlockStatus(this, "armed")
            showOverlay(scamType, riskScore)
            SetuConfig.addLog(this, "INTERLOCK", "Interlock ARMED ($scamType, $riskScore)")
            SetuApiClient.sendEvent(this, "interlock_shown", JSONObject().apply {
                put("scam_type", scamType)
                put("risk_score", riskScore)
            })
        }
        return START_STICKY
    }

    private fun showOverlay(scamType: String, riskScore: Int) {
        // Full screen blocking overlay disabled per user request.
        // Warnings are delivered exclusively through system notification banners.
        removeOverlay()
        return
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Setu Guardian Interlock",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION") Notification.Builder(this)
        }
        return builder
            .setContentTitle("Setu Guardian Interlock Active")
            .setContentText("Payment apps are locked for elder safety")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .build()
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }
}
