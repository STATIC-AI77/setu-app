package expo.modules.setunative

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaPlayer
import android.content.ContentValues
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.MediaStore
import android.provider.Settings
import androidx.core.content.FileProvider
import java.net.HttpURLConnection
import java.net.URL
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Base64
import android.util.Log
import java.io.File
import java.util.Locale
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SetuNativeModule : Module() {
  private var tts: TextToSpeech? = null
  private var isTtsInitialized = false
  private var activeSpeechRecognizer: SpeechRecognizer? = null
  private var mediaPlayer: MediaPlayer? = null
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React Context unavailable")

  private fun getSafeContext(): Context {
    return appContext.reactContext ?: appContext.currentActivity?.applicationContext ?: context
  }

  private fun ensureTtsInitialized(onReady: (() -> Unit)? = null) {
    Handler(Looper.getMainLooper()).post {
      if (tts != null && isTtsInitialized) {
        onReady?.invoke()
        return@post
      }
      try {
        val ctx = getSafeContext()
        Log.i("SetuTTS", "Initializing Google TextToSpeech engine...")
        tts = TextToSpeech(ctx, { status ->
          Log.i("SetuTTS", "TextToSpeech init status: $status")
          if (status == TextToSpeech.SUCCESS) {
            isTtsInitialized = true
            tts?.setPitch(1.10f)
            tts?.setSpeechRate(0.88f)
            onReady?.invoke()
          } else {
            Log.e("SetuTTS", "TextToSpeech init failed with status: $status")
          }
        }, "com.google.android.tts")
      } catch (e: Exception) {
        Log.w("SetuTTS", "Fallback to default TTS engine: ${e.message}")
        try {
          val ctx = getSafeContext()
          tts = TextToSpeech(ctx) { status ->
            if (status == TextToSpeech.SUCCESS) {
              isTtsInitialized = true
              tts?.setPitch(1.10f)
              tts?.setSpeechRate(0.88f)
              onReady?.invoke()
            }
          }
        } catch (_: Exception) {}
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("SetuNative")

    OnCreate {
      ensureTtsInitialized()
    }

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
      SetuConfig.setInterlockStatus(context, "armed")
    }

    Function("releaseInterlock") {
      SetuConfig.setInterlockStatus(context, "released")
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

    Function("showRedScamNotification") { title: String, message: String, scamType: String, sender: String ->
      try {
        val ctx = getSafeContext()
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        val channelId = "setu_critical_scam_alerts"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val channel = android.app.NotificationChannel(
            channelId,
            "Critical Scam Warning Alerts",
            android.app.NotificationManager.IMPORTANCE_HIGH
          ).apply {
            description = "High priority red warning alerts for detected scam calls"
            enableLights(true)
            lightColor = android.graphics.Color.RED
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 500, 200, 500)
            lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
          }
          nm.createNotificationChannel(channel)
        }

        val notif = androidx.core.app.NotificationCompat.Builder(ctx, channelId)
          .setSmallIcon(android.R.drawable.stat_sys_warning)
          .setContentTitle(title)
          .setContentText(message)
          .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText("$message\n\n⚠️ Protection Active: Do NOT send money, share OTP, or follow caller instructions."))
          .setPriority(androidx.core.app.NotificationCompat.PRIORITY_MAX)
          .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
          .setColor(android.graphics.Color.RED)
          .setColorized(true)
          .setAutoCancel(true)
          .setVibrate(longArrayOf(0, 500, 200, 500))
          .build()

        nm.notify(9001, notif)
      } catch (e: Exception) {
        Log.e("SetuNativeModule", "Failed to show red scam notification: ${e.message}")
      }
    }

    Function("simulateScam") { scamText: String, sender: String ->
      Thread {
        val ctx = getSafeContext()
        SetuConfig.addLog(ctx, "SIMULATE", "Simulating WhatsApp from $sender")
        Log.i("SetuNativeModule", "Simulating WhatsApp from $sender: \"$scamText\"")
        val result = SetuApiClient.detect(ctx, "whatsapp", scamText, sender)
        if (result != null && result.isScam) {
          SetuConfig.addLog(ctx, "SIMULATE", "VERDICT: SCAM (${result.scamType}, ${result.riskScore}%)")
          Log.w("SetuNativeModule", "VERDICT: SCAM (${result.scamType}, ${result.riskScore}%)")
          SetuConfig.setInterlockStatus(ctx, "armed")

          // Post prominent red notification banner
          try {
            val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            val channelId = "setu_scam_alerts"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              val channel = android.app.NotificationChannel(
                channelId,
                "Setu Fraud & Scam Alerts",
                android.app.NotificationManager.IMPORTANCE_HIGH
              ).apply {
                enableLights(true)
                lightColor = android.graphics.Color.RED
                enableVibration(true)
              }
              nm.createNotificationChannel(channel)
            }
            val notif = androidx.core.app.NotificationCompat.Builder(ctx, channelId)
              .setSmallIcon(android.R.drawable.stat_sys_warning)
              .setContentTitle("🚨 Scam WhatsApp Intercepted: ${result.scamType}")
              .setContentText("Sender $sender sent suspected fraud. Interlock armed.")
              .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText("Sender: $sender\nThreat: ${result.scamType}\nMessage: \"$scamText\"\n\n🛡️ Saroj AI Decoy is engaging scammer. Financial apps secured."))
              .setPriority(androidx.core.app.NotificationCompat.PRIORITY_MAX)
              .setColor(android.graphics.Color.RED)
              .setColorized(true)
              .setAutoCancel(true)
              .build()
            nm.notify(8001, notif)
          } catch (_e: Exception) {}

          if (SetuConfig.isAutoReplyEnabled(ctx)) {
            val reply = SetuApiClient.getDecoyReply(ctx, sender, scamText, result.scamType)
            if (!reply.isNullOrBlank()) {
              SetuConfig.addLog(ctx, "SAROJ", "Decoy Reply: \"$reply\"")
              Log.i("SetuNativeModule", "Decoy Reply: \"$reply\"")
            }
          }
        } else {
          val safeVerdict = result?.scamType ?: "clean"
          SetuConfig.addLog(ctx, "SIMULATE", "VERDICT: Safe ($safeVerdict)")
          Log.i("SetuNativeModule", "VERDICT: Safe ($safeVerdict)")
        }
      }.start()
    }

    AsyncFunction("startSpeechRecognition") { promise: Promise ->
      Handler(Looper.getMainLooper()).post {
        val ctx = appContext.currentActivity ?: appContext.reactContext
        if (ctx == null) {
          promise.resolve("")
          return@post
        }
        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
          promise.resolve("")
          return@post
        }

        try {
          try {
            activeSpeechRecognizer?.stopListening()
            activeSpeechRecognizer?.destroy()
          } catch (_: Exception) {}

          val recognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
          activeSpeechRecognizer = recognizer

          val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
          }

          var hasResolved = false

          recognizer.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) {
              if (!hasResolved) {
                hasResolved = true
                try { recognizer.destroy() } catch (_: Exception) {}
                if (activeSpeechRecognizer == recognizer) activeSpeechRecognizer = null
                // Return empty string on silence/timeout so continuous listening loops without errors
                promise.resolve("")
              }
            }
            override fun onResults(results: Bundle?) {
              if (!hasResolved) {
                hasResolved = true
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull() ?: ""
                try { recognizer.destroy() } catch (_: Exception) {}
                if (activeSpeechRecognizer == recognizer) activeSpeechRecognizer = null
                promise.resolve(text)
              }
            }
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
          })

          recognizer.startListening(intent)
        } catch (e: Exception) {
          Log.w("SetuSpeech", "Speech recognition start failed: ${e.message}")
          promise.resolve("")
        }
      }
    }

    Function("stopSpeechRecognition") {
      Handler(Looper.getMainLooper()).post {
        try {
          activeSpeechRecognizer?.stopListening()
          activeSpeechRecognizer?.destroy()
          activeSpeechRecognizer = null
        } catch (_: Exception) {}
      }
    }

    AsyncFunction("speakAsSaroj") { text: String, promise: Promise ->
      Handler(Looper.getMainLooper()).post {
        val doSpeak = {
          try {
            val hasDevanagari = text.any { it in '\u0900'..'\u097F' }
            val preferredLocale = if (hasDevanagari) Locale("hi", "IN") else Locale("en", "IN")
            var langRes = tts?.setLanguage(preferredLocale)
            if (langRes == TextToSpeech.LANG_MISSING_DATA || langRes == TextToSpeech.LANG_NOT_SUPPORTED) {
              langRes = tts?.setLanguage(if (hasDevanagari) Locale("en", "IN") else Locale("hi", "IN"))
              if (langRes == TextToSpeech.LANG_MISSING_DATA || langRes == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.getDefault())
              }
            }
            // Natural 1.0f pitch & 0.95f speech rate prevents broken/metallic voice
            tts?.setPitch(1.0f)
            tts?.setSpeechRate(0.95f)
            val params = Bundle().apply {
              putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, android.media.AudioManager.STREAM_MUSIC)
              putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
            }
            val speakRes = tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "saroj_tts_${System.currentTimeMillis()}")
            Log.i("SetuTTS", "speakAsSaroj speakRes=$speakRes text=\"$text\"")
            promise.resolve(speakRes == TextToSpeech.SUCCESS)
          } catch (e: Exception) {
            Log.e("SetuTTS", "speakAsSaroj error: ${e.message}", e)
            promise.resolve(false)
          }
        }

        if (tts == null || !isTtsInitialized) {
          ensureTtsInitialized {
            doSpeak()
          }
        } else {
          doSpeak()
        }
      }
    }

    Function("stopSpeaking") {
      try {
        tts?.stop()
      } catch (_: Exception) {}
      try {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
      } catch (_: Exception) {}
    }

    AsyncFunction("playAudio") { audioSource: String, promise: Promise ->
      Handler(Looper.getMainLooper()).post {
        try {
          mediaPlayer?.stop()
          mediaPlayer?.release()
          mediaPlayer = null

          // Stop TTS if speaking
          try { tts?.stop() } catch (_: Exception) {}

          val mp = MediaPlayer()
          mediaPlayer = mp

          val audioAttributes = android.media.AudioAttributes.Builder()
            .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
          mp.setAudioAttributes(audioAttributes)

          // Configure audio routing: automatically prioritize Bluetooth or Headphones if connected
          val am = getSafeContext().getSystemService(Context.AUDIO_SERVICE) as? AudioManager
          am?.let { audioManager ->
            try {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val commDevice = audioManager.availableCommunicationDevices.firstOrNull {
                  it.type == AudioDeviceInfo.TYPE_BLE_HEADSET ||
                  it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                  it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                  it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                  it.type == AudioDeviceInfo.TYPE_USB_HEADSET
                } ?: audioManager.availableCommunicationDevices.firstOrNull {
                  it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                }
                if (commDevice != null) {
                  audioManager.setCommunicationDevice(commDevice)
                  Log.i("SetuAudio", "Set communication device to ${commDevice.type}")
                }
              }
            } catch (ae: Exception) {
              Log.w("SetuAudio", "Audio routing note: ${ae.message}")
            }
          }

          if (audioSource.startsWith("data:audio") || audioSource.startsWith("data:")) {
            val base64Data = audioSource.substringAfter("base64,")
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            val tempFile = File.createTempFile("saroj_voice_", ".mp3", getSafeContext().cacheDir)
            tempFile.writeBytes(decodedBytes)
            tempFile.deleteOnExit()
            mp.setDataSource(tempFile.absolutePath)
          } else {
            mp.setDataSource(audioSource)
          }

          mp.setOnPreparedListener { player ->
            player.setVolume(1.0f, 1.0f)
            Log.i("SetuAudio", "Audio prepared with normal balanced volume, starting playback...")
            player.start()
          }

          mp.setOnCompletionListener { player ->
            Log.i("SetuAudio", "ElevenLabs audio playback completed.")
            try {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                am?.clearCommunicationDevice()
              }
              player.release()
            } catch (_: Exception) {}
            if (mediaPlayer == player) mediaPlayer = null
            promise.resolve(true)
          }

          mp.setOnErrorListener { player, what, extra ->
            Log.e("SetuAudio", "MediaPlayer error: what=$what, extra=$extra")
            try {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                am?.clearCommunicationDevice()
              }
              player.release()
            } catch (_: Exception) {}
            if (mediaPlayer == player) mediaPlayer = null
            promise.resolve(false)
            true
          }

          mp.prepareAsync()
        } catch (e: Exception) {
          Log.e("SetuAudio", "playAudio failed: ${e.message}", e)
          promise.resolve(false)
        }
      }
    }

    Function("stopAudio") {
      Handler(Looper.getMainLooper()).post {
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val am = getSafeContext().getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            am?.clearCommunicationDevice()
          }
          mediaPlayer?.stop()
          mediaPlayer?.release()
          mediaPlayer = null
        } catch (_: Exception) {}
      }
    }

    AsyncFunction("downloadAndSavePdf") { pdfUrl: String, filename: String, promise: Promise ->
      Thread {
        try {
          val ctx = getSafeContext()
          val safeName = if (filename.endsWith(".pdf")) filename else "$filename.pdf"
          val cleanUrl = if (pdfUrl.startsWith("http")) pdfUrl else "https://setu-backend.kintree.space$pdfUrl"

          val url = URL(cleanUrl)
          val connection = url.openConnection() as HttpURLConnection
          connection.connectTimeout = 12000
          connection.readTimeout = 20000
          connection.instanceFollowRedirects = true

          val localDir = ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: ctx.filesDir
          val localFile = File(localDir, safeName)
          localFile.outputStream().use { out ->
            connection.inputStream.use { inp ->
              inp.copyTo(out)
            }
          }

          // Also save to public Downloads via MediaStore on Android 10+
          try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
              val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, safeName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Setu_Dossiers")
              }
              val resolver = ctx.contentResolver
              val insertUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
              if (insertUri != null) {
                resolver.openOutputStream(insertUri)?.use { out ->
                  localFile.inputStream().use { inp -> inp.copyTo(out) }
                }
              }
            }
          } catch (me: Exception) {
            Log.w("SetuNative", "Public download copy warning: ${me.message}")
          }

          Log.i("SetuNative", "PDF saved successfully to: ${localFile.absolutePath}")
          promise.resolve(localFile.absolutePath)
        } catch (e: Exception) {
          Log.e("SetuNative", "PDF download failed: ${e.message}", e)
          promise.reject("DOWNLOAD_ERROR", e.message ?: "Failed to download PDF", e)
        }
      }.start()
    }

    AsyncFunction("openPdf") { pathOrUrl: String, promise: Promise ->
      Handler(Looper.getMainLooper()).post {
        try {
          val ctx = appContext.currentActivity ?: getSafeContext()
          if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(pathOrUrl)).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            ctx.startActivity(intent)
            promise.resolve(true)
            return@post
          }

          val file = File(pathOrUrl)
          if (!file.exists()) {
            promise.reject("FILE_NOT_FOUND", "PDF file not found at $pathOrUrl", null)
            return@post
          }

          val authority = "${ctx.packageName}.setuprovider"
          val contentUri = FileProvider.getUriForFile(ctx, authority, file)
          val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(contentUri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }

          val chooser = Intent.createChooser(intent, "Open 1930 Cybercrime Dossier").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          ctx.startActivity(chooser)
          promise.resolve(true)
        } catch (e: Exception) {
          Log.e("SetuNative", "openPdf failed: ${e.message}", e)
          promise.reject("OPEN_ERROR", e.message ?: "Failed to open PDF", e)
        }
      }
    }

    Function("copyToClipboard") { text: String ->
      Handler(Looper.getMainLooper()).post {
        try {
          val cm = getSafeContext().getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
          val clip = android.content.ClipData.newPlainText("Setu Complaint Evidence", text)
          cm?.setPrimaryClip(clip)
        } catch (_: Exception) {}
      }
    }

    AsyncFunction("forceSpeakerphone") {
      Handler(Looper.getMainLooper()).post {
        val am = getSafeContext().getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        am?.let { audioManager ->
          try {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              // Prioritize Bluetooth or Headset if connected; otherwise route to Speaker
              val commDevice = audioManager.availableCommunicationDevices.firstOrNull {
                it.type == AudioDeviceInfo.TYPE_BLE_HEADSET ||
                it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                it.type == AudioDeviceInfo.TYPE_USB_HEADSET
              } ?: audioManager.availableCommunicationDevices.firstOrNull {
                it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
              }
              if (commDevice != null) {
                audioManager.setCommunicationDevice(commDevice)
                Log.i("SetuAudio", "Set communication device to ${commDevice.type}")
              }
            } else {
              val isBluetoothOrHeadset = audioManager.isBluetoothScoOn || audioManager.isWiredHeadsetOn
              if (!isBluetoothOrHeadset) {
                @Suppress("DEPRECATION")
                audioManager.isSpeakerphoneOn = true
              }
            }
          } catch (e: Exception) {
            Log.w("SetuAudio", "forceSpeakerphone error: ${e.message}")
          }
        }
      }
      true
    }

    AsyncFunction("clearAudioRouting") {
      Handler(Looper.getMainLooper()).post {
        val am = getSafeContext().getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          am?.clearCommunicationDevice()
        }
      }
      true
    }

    OnDestroy {
      try {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
        tts?.stop()
        tts?.shutdown()
        tts = null
      } catch (_: Exception) {}
    }
  }
}
