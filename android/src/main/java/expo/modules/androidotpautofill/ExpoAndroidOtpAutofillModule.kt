package expo.modules.androidotpautofill

import android.app.Activity
import android.Manifest
import android.content.BroadcastReceiver
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Telephony
import androidx.core.app.ActivityCompat
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.regex.Pattern

class ExpoAndroidOtpAutofillModule : Module() {
  private val context: android.content.Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val handler = Handler(Looper.getMainLooper())
  private var pollRunnable: Runnable? = null
  private var lastCheckedMessageId: Long = -1
  private var otpLength: Int = 6

  private var smsRetrieverReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAndroidOtpAutofill")

    Events("onOtpReceived", "onSmsRetrieverTimeout")

    AsyncFunction("getAppHash") {
      AppSignatureHelper.getAppHash(context)
    }

    AsyncFunction("startOtpListener") { length: Int? ->
      if (length != null && length in 4..8) {
        otpLength = length
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
          appContext.currentActivity?.let { activity: Activity ->
            ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.READ_SMS), 1001)
          }
          handler.postDelayed({ startPolling() }, 2000)
          return@AsyncFunction
        }
      }
      startPolling()
    }

    AsyncFunction<Unit>("removeListener") {
      stopPolling()
    }

    AsyncFunction("startSmsRetrieverListener") { length: Int? ->
      if (length != null && length in 4..8) {
        otpLength = length
      }
      startSmsRetriever()
    }

    AsyncFunction<Unit>("removeSmsRetrieverListener") {
      unregisterSmsRetrieverReceiver()
    }
  }

  private fun startPolling() {
    if (pollRunnable != null) return
    pollRunnable = object : Runnable {
      override fun run() {
        val otp = readOtpFromLastSms()
        if (otp != null) {
          stopPolling()
          sendEvent("onOtpReceived", mapOf("otp" to otp))
        } else {
          handler.postDelayed(this, 2500)
        }
      }
    }
    handler.post(pollRunnable!!)
  }

  private fun stopPolling() {
    pollRunnable?.let { handler.removeCallbacks(it) }
    pollRunnable = null
  }

  private fun readOtpFromLastSms(): String? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
      ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED
    ) {
      return null
    }
    val cr: ContentResolver = context.contentResolver
    val uri: Uri = Telephony.Sms.CONTENT_URI
    val cursor = cr.query(
      uri,
      arrayOf(Telephony.Sms._ID, Telephony.Sms.BODY, Telephony.Sms.DATE),
      null,
      null,
      Telephony.Sms.DEFAULT_SORT_ORDER
    ) ?: return null
    try {
      if (cursor.moveToFirst()) {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms._ID))
        if (id == lastCheckedMessageId) return null
        lastCheckedMessageId = id
        val body = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)) ?: return null
        val date = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE))
        val twoMinutesAgo = System.currentTimeMillis() - 2 * 60 * 1000
        if (date < twoMinutesAgo) return null
        val pattern = Pattern.compile("\\d{$otpLength}")
        val matcher = pattern.matcher(body)
        if (matcher.find()) return matcher.group()
      }
    } finally {
      cursor.close()
    }
    return null
  }

  private fun startSmsRetriever() {
    unregisterSmsRetrieverReceiver()
    val client = SmsRetriever.getClient(context)
    client.startSmsRetriever().addOnSuccessListener {
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
          if (intent?.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
          val extras = intent.extras ?: return
          @Suppress("DEPRECATION")
          val status = extras.get(SmsRetriever.EXTRA_STATUS) as? com.google.android.gms.common.api.Status ?: return
          when (status.statusCode) {
            CommonStatusCodes.SUCCESS -> {
              val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE) ?: return
              val pattern = Pattern.compile("\\d{$otpLength}")
              val matcher = pattern.matcher(message)
              if (matcher.find()) {
                unregisterSmsRetrieverReceiver()
                sendEvent("onOtpReceived", mapOf("otp" to matcher.group()!!, "message" to message))
              }
            }
            CommonStatusCodes.TIMEOUT -> {
              sendEvent("onSmsRetrieverTimeout", mapOf("timedOut" to true))
              unregisterSmsRetrieverReceiver()
            }
          }
        }
      }
      smsRetrieverReceiver = receiver
      val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
      val appContext = context.applicationContext
      if (Build.VERSION.SDK_INT >= 33) {
        appContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        @Suppress("DEPRECATION")
        appContext.registerReceiver(receiver, filter)
      }
    }
  }

  private fun unregisterSmsRetrieverReceiver() {
    val receiver = smsRetrieverReceiver ?: return
    try {
      context.applicationContext.unregisterReceiver(receiver)
    } catch (_: Exception) {}
    smsRetrieverReceiver = null
  }
}
