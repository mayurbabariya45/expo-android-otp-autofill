package expo.modules.androidotpautofill

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import java.security.MessageDigest
import java.util.Arrays

/**
 * Computes the 11-character app hash string required for SMS Retriever API verification messages.
 * Your server must include this hash in the SMS so the API can deliver the message to your app.
 * See: https://developers.google.com/identity/sms-retriever/verify#1_construct_a_verification_message
 */
object AppSignatureHelper {
  private const val HASH_LENGTH = 11

  fun getAppHash(context: Context): String? {
    val packageName = context.packageName
    val signature = getSigningCertificateHex(context, packageName) ?: return null
    val appInfo = "$packageName $signature"
    val digest = MessageDigest.getInstance("SHA-256").apply {
      update(appInfo.toByteArray(Charsets.UTF_8))
    }.digest()
    val hashBytes = Arrays.copyOfRange(digest, 0, 9)
    val base64 = android.util.Base64.encodeToString(hashBytes, android.util.Base64.NO_PADDING or android.util.Base64.NO_WRAP)
    return base64.take(HASH_LENGTH)
  }

  private fun getSigningCertificateHex(context: Context, packageName: String): String? {
    return try {
      val pm = context.packageManager
      @Suppress("DEPRECATION")
      val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        PackageManager.GET_SIGNING_CERTIFICATES
      } else {
        PackageManager.GET_SIGNATURES
      }
      val packageInfo = pm.getPackageInfo(packageName, flags)
      val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        packageInfo.signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION")
        packageInfo.signatures
      }
      val sig = signatures?.firstOrNull() ?: return null
      sig.toByteArray().joinToString("") { "%02x".format(it) }
    } catch (e: Exception) {
      null
    }
  }
}
