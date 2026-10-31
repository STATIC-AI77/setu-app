package expo.modules.setunative

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SetuConfig {
    private const val PREFS_NAME = "setu_guardian_prefs"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_TOKEN = "team_token"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_FAMILY_ID = "family_id"
    private const val KEY_PROTECTION = "protection_enabled"
    private const val KEY_AUTO_REPLY = "auto_reply_enabled"
    private const val KEY_INTERLOCK_STATUS = "interlock_status"
    private const val KEY_LOGS = "activity_logs"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getBaseUrl(context: Context): String =
        getPrefs(context).getString(KEY_BASE_URL, "http://10.0.2.2:8000") ?: "http://10.0.2.2:8000"

    fun getToken(context: Context): String =
        getPrefs(context).getString(KEY_TOKEN, "setu-dev-token") ?: "setu-dev-token"

    fun getDeviceId(context: Context): String =
        getPrefs(context).getString(KEY_DEVICE_ID, "device_demo_001") ?: "device_demo_001"

    fun getFamilyId(context: Context): String =
        getPrefs(context).getString(KEY_FAMILY_ID, "fam_demo_001") ?: "fam_demo_001"

    fun isProtectionEnabled(context: Context): Boolean =
        getPrefs(context).getBoolean(KEY_PROTECTION, true)

    fun isAutoReplyEnabled(context: Context): Boolean =
        getPrefs(context).getBoolean(KEY_AUTO_REPLY, true)

    fun getInterlockStatus(context: Context): String =
        getPrefs(context).getString(KEY_INTERLOCK_STATUS, "idle") ?: "idle"

    fun setInterlockStatus(context: Context, status: String) {
        getPrefs(context).edit().putString(KEY_INTERLOCK_STATUS, status).apply()
    }

    fun saveConfig(
        context: Context,
        baseUrl: String,
        token: String,
        deviceId: String,
        familyId: String,
        protection: Boolean,
        autoReply: Boolean
    ) {
        getPrefs(context).edit()
            .putString(KEY_BASE_URL, baseUrl)
            .putString(KEY_TOKEN, token)
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_FAMILY_ID, familyId)
            .putBoolean(KEY_PROTECTION, protection)
            .putBoolean(KEY_AUTO_REPLY, autoReply)
            .apply()
    }

    @Synchronized
    fun addLog(context: Context, tag: String, message: String) {
        try {
            val prefs = getPrefs(context)
            val logsStr = prefs.getString(KEY_LOGS, "[]") ?: "[]"
            val array = JSONArray(logsStr)
            val time = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            val item = JSONObject().apply {
                put("id", System.currentTimeMillis().toString())
                put("time", time)
                put("tag", tag)
                put("message", message)
            }
            val newArray = JSONArray()
            newArray.put(item)
            val max = minOf(array.length(), 29)
            for (i in 0 until max) {
                newArray.put(array.get(i))
            }
            prefs.edit().putString(KEY_LOGS, newArray.toString()).apply()
        } catch (_: Exception) {}
    }

    fun getLogs(context: Context): String =
        getPrefs(context).getString(KEY_LOGS, "[]") ?: "[]"

    fun clearLogs(context: Context) {
        getPrefs(context).edit().putString(KEY_LOGS, "[]").apply()
    }
}
