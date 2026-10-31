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
        if (overlayView != null) return

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        )

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#dc2626"))
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
        }

        val icon = TextView(this).apply {
            text = "🛑"
            textSize = 72f
            gravity = Gravity.CENTER
        }

        val title = TextView(this).apply {
            text = "Blocked by Setu\nसेतु द्वारा अवरुद्ध"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setPadding(0, 24, 0, 16)
        }

        val subtitle = TextView(this).apply {
            text = "Payment apps locked — son must approve from dashboard\nधोखाधड़ी का खतरा — सुरक्षा के लिए भुगतान ऐप बंद हैं"
            textSize = 16f
            setTextColor(Color.parseColor("#fef2f2"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        val badge = TextView(this).apply {
            text = "Detected Threat: $scamType (Risk: $riskScore%)"
            textSize = 14f
            setTextColor(Color.YELLOW)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val dismissBtn = Button(this).apply {
            text = "Emergency Unlock (Demo)"
            setBackgroundColor(Color.parseColor("#1e293b"))
            setTextColor(Color.WHITE)
            setOnClickListener { release(this@SetuOverlayService) }
        }

        layout.addView(icon)
        layout.addView(title)
        layout.addView(subtitle)
        layout.addView(badge)
        layout.addView(dismissBtn)

        overlayView = layout
        try {
            windowManager?.addView(overlayView, layoutParams)
        } catch (_: Exception) {}
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
