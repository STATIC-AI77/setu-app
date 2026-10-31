package expo.modules.setunative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class SetuBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        SetuConfig.addLog(context, "SYSTEM", "Device rebooted — Setu Guardian restored")
    }
}
