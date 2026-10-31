package expo.modules.setunative

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SetuNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React Context unavailable")

  override fun definition() = ModuleDefinition {
    Name("SetuNative")

    Function("getGreeting") {
      "hello from native"
    }

    Function("checkNotificationListenerPermission") {
      val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(context)
      enabledPackages.contains(context.packageName)
    }

    Function("openNotificationListenerSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("checkOverlayPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(context)
      } else true
    }

    Function("openOverlaySettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        ).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
    }

    Function("checkBatteryOptimizationPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        pm.isIgnoringBatteryOptimizations(context.packageName)
      } else true
    }

    Function("requestIgnoreBatteryOptimization") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:${context.packageName}")
        ).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
    }

    Function("requestCallScreeningRole") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = context.getSystemService(Context.ROLE_SERVICE) as RoleManager
        if (!roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
          val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        }
      }
    }

    Function("armInterlock") { scamType: String, riskScore: Int ->
      SetuOverlayService.arm(context, scamType, riskScore)
    }

    Function("releaseInterlock") {
      SetuOverlayService.release(context)
    }

    Function("isInterlockArmed") {
      SetuOverlayService.isArmed
    }

    Function("updateConfig") { baseUrl: String, token: String, deviceId: String, familyId: String, protection: Boolean, autoReply: Boolean ->
      SetuConfig.saveConfig(context, baseUrl, token, deviceId, familyId, protection, autoReply)
    }

    Function("getRecentLogs") {
      SetuConfig.getLogs(context)
    }

    Function("clearLogs") {
      SetuConfig.clearLogs(context)
    }

    Function("simulateScam") { scamText: String, sender: String ->
      Thread {
        SetuConfig.addLog(context, "SIMULATE", "Simulating message from $sender")
        val result = SetuApiClient.detect(context, "whatsapp", scamText, sender)
        if (result != null && result.isScam) {
          SetuConfig.addLog(context, "SIMULATE", "VERDICT: SCAM (${result.scamType}, ${result.riskScore})")
          if (result.action == "arm_interlock") {
            SetuOverlayService.arm(context, result.scamType, result.riskScore)
          }
          if (SetuConfig.isAutoReplyEnabled(context)) {
            val reply = SetuApiClient.getDecoyReply(context, sender, scamText, result.scamType)
            if (!reply.isNullOrBlank()) {
              SetuConfig.addLog(context, "SAROJ", "Decoy Reply: \"$reply\"")
            }
          }
        } else {
          SetuConfig.addLog(context, "SIMULATE", "VERDICT: Safe or backend unavailable")
        }
      }.start()
    }
  }
}
