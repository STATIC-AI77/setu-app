package expo.modules.setunative

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class DetectResponse(
    val isScam: Boolean,
    val scamType: String,
    val riskScore: Int,
    val action: String,
    val raw: String
)

data class ThreatIntelResponse(
    val knownScam: Boolean,
    val scamTypes: List<String>,
    val verdict: String
)

object SetuApiClient {
    private fun getIsoTs(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    private fun openConnection(urlStr: String, method: String, token: String, timeoutMs: Int): HttpURLConnection {
        val url = URL(urlStr)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = timeoutMs
        conn.readTimeout = timeoutMs
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")
        return conn
    }

    fun detect(context: Context, channel: String, content: String, sender: String): DetectResponse? {
        val primaryUrl = SetuConfig.getBaseUrl(context).trimEnd('/')
        val fallbackUrl = "http://127.0.0.1:8000"
        val candidates = if (primaryUrl.contains("127.0.0.1")) listOf(primaryUrl) else listOf(primaryUrl, fallbackUrl)
        val token = SetuConfig.getToken(context)
        val deviceId = SetuConfig.getDeviceId(context)

        for (baseUrl in candidates) {
            try {
                Log.i("SetuApiClient", "POST $baseUrl/detect for sender: $sender ($channel)")
                val conn = openConnection("$baseUrl/detect", "POST", token, 12000)
                conn.doOutput = true
                val body = JSONObject().apply {
                    put("channel", channel)
                    put("content", content)
                    put("sender", sender)
                    put("media_url", JSONObject.NULL)
                    put("device_id", deviceId)
                    put("ts", getIsoTs())
                }
                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                val code = conn.responseCode
                Log.i("SetuApiClient", "Response from $baseUrl/detect: $code")
                if (code in 200..299) {
                    val resp = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(resp)
                    return DetectResponse(
                        isScam = json.optBoolean("is_scam", false),
                        scamType = json.optString("scam_type", "scam"),
                        riskScore = json.optInt("risk_score", 0),
                        action = json.optString("action", "ignore"),
                        raw = resp
                    )
                }
            } catch (e: Exception) {
                Log.w("SetuApiClient", "Failed calling $baseUrl/detect: ${e.message}")
            }
        }
        return null
    }

    fun getDecoyReply(
        context: Context,
        sender: String,
        latestMsg: String,
        scamType: String,
        conversationId: String? = null,
        history: JSONArray? = null
    ): String? {
        val primaryUrl = SetuConfig.getBaseUrl(context).trimEnd('/')
        val fallbackUrl = "http://127.0.0.1:8000"
        val candidates = if (primaryUrl.contains("127.0.0.1")) listOf(primaryUrl) else listOf(primaryUrl, fallbackUrl)
        val token = SetuConfig.getToken(context)
        val convId = conversationId ?: "wa_${sender.replace(Regex("[^0-9a-zA-Z]"), "")}"

        for (baseUrl in candidates) {
            try {
                Log.i("SetuApiClient", "POST $baseUrl/chat/decoy-reply for $sender")
                val conn = openConnection("$baseUrl/chat/decoy-reply", "POST", token, 10000)
                conn.doOutput = true
                val body = JSONObject().apply {
                    put("conversation_id", convId)
                    put("scammer_number", sender)
                    put("history", history ?: JSONArray())
                    put("latest_message", latestMsg)
                    put("scam_type", scamType)
                    put("generate_audio", false)
                }
                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                val code = conn.responseCode
                Log.i("SetuApiClient", "Response from $baseUrl/chat/decoy-reply: $code")
                if (code in 200..299) {
                    val resp = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(resp)
                    return if (json.has("reply") && !json.isNull("reply")) json.getString("reply") else null
                }
            } catch (e: Exception) {
                Log.w("SetuApiClient", "Failed calling $baseUrl/chat/decoy-reply: ${e.message}")
            }
        }
        return null
    }

    fun checkThreatIntel(context: Context, rawPhone: String): ThreatIntelResponse {
        val baseUrl = SetuConfig.getBaseUrl(context).trimEnd('/')
        val token = SetuConfig.getToken(context)
        val encoded = URLEncoder.encode(rawPhone, "UTF-8")
        return try {
            val conn = openConnection("$baseUrl/threat-intel/$encoded", "GET", token, 1500)
            if (conn.responseCode in 200..299) {
                val resp = conn.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(resp)
                ThreatIntelResponse(
                    knownScam = json.optBoolean("known_scam", false),
                    scamTypes = listOf(json.optString("verdict", "scam")),
                    verdict = json.optString("verdict", "allow")
                )
            } else {
                ThreatIntelResponse(knownScam = false, scamTypes = emptyList(), verdict = "allow")
            }
        } catch (_: Exception) {
            ThreatIntelResponse(knownScam = false, scamTypes = emptyList(), verdict = "allow")
        }
    }

    fun sendEvent(context: Context, eventType: String, payload: JSONObject) {
        val baseUrl = SetuConfig.getBaseUrl(context).trimEnd('/')
        val token = SetuConfig.getToken(context)
        val deviceId = SetuConfig.getDeviceId(context)
        Thread {
            for (attempt in 1..2) {
                try {
                    val conn = openConnection("$baseUrl/event", "POST", token, 5000)
                    conn.doOutput = true
                    val body = JSONObject().apply {
                        put("event_type", eventType)
                        put("device_id", deviceId)
                        put("ts", getIsoTs())
                        put("payload", payload)
                    }
                    OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                    if (conn.responseCode in 200..299) break
                } catch (_: Exception) {
                    if (attempt == 2) break
                }
            }
        }.start()
    }

    fun register(context: Context, fcmToken: String): Boolean {
        val baseUrl = SetuConfig.getBaseUrl(context).trimEnd('/')
        val token = SetuConfig.getToken(context)
        val deviceId = SetuConfig.getDeviceId(context)
        val familyId = SetuConfig.getFamilyId(context)
        return try {
            val conn = openConnection("$baseUrl/register", "POST", token, 5000)
            conn.doOutput = true
            val body = JSONObject().apply {
                put("device_id", deviceId)
                put("fcm_token", fcmToken)
                put("family_id", familyId)
            }
            OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
            conn.responseCode in 200..299
        } catch (_: Exception) { false }
    }
}
