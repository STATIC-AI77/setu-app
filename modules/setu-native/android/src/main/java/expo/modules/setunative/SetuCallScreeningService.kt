package expo.modules.setunative

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi
import org.json.JSONObject

@RequiresApi(Build.VERSION_CODES.Q)
class SetuCallScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val number = callDetails.handle?.schemeSpecificPart ?: ""
        val start = System.currentTimeMillis()

        if (!SetuConfig.isProtectionEnabled(this) || number.isBlank()) {
            allowCall(callDetails)
            return
        }

        Thread {
            val result = SetuApiClient.checkThreatIntel(this, number)
            val elapsed = System.currentTimeMillis() - start

            if (result.knownScam) {
                val blockResponse = CallResponse.Builder()
                    .setDisallowCall(true)
                    .setRejectCall(true)
                    .setSkipCallLog(false)
                    .setSkipNotification(true)
                    .build()
                respondToCall(callDetails, blockResponse)

                SetuConfig.addLog(this, "CALL", "Screened $number: BLOCKED scam call (${elapsed}ms)")
                SetuApiClient.sendEvent(this, "scam_blocked", JSONObject().apply {
                    put("phone", number)
                    put("elapsed_ms", elapsed)
                })
            } else {
                allowCall(callDetails)
                SetuConfig.addLog(this, "CALL", "Screened $number: ALLOWED (${elapsed}ms)")
            }
        }.start()
    }

    private fun allowCall(callDetails: Call.Details) {
        val allowResponse = CallResponse.Builder()
            .setDisallowCall(false)
            .setRejectCall(false)
            .setSkipCallLog(false)
            .setSkipNotification(false)
            .build()
        respondToCall(callDetails, allowResponse)
    }
}
