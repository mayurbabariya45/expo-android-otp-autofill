import { Platform, PermissionsAndroid } from 'react-native';

import ExpoAndroidOtpAutofill from './ExpoAndroidOtpAutofill';
import type { ExpoAndroidOtpAutofillModuleEvents } from './ExpoAndroidOtpAutofill.types';

/**
 * Event name emitted by the native module when an OTP is read from SMS.
 * Subscribe with `addOtpListener()`.
 */
export const OTP_EVENT_NAME = 'onOtpReceived';

/**
 * Event name emitted when the SMS Retriever API times out (~5 minutes without a matching SMS).
 * Subscribe with `addSmsRetrieverTimeoutListener()`.
 */
export const SMS_RETRIEVER_TIMEOUT_EVENT_NAME = 'onSmsRetrieverTimeout';

/** True when running on Android (OTP from SMS is only supported on Android). */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/** Default OTP length used when not specified (common for SMS codes). */
export const DEFAULT_OTP_LENGTH = 6;

/** Supported OTP length (4–8 digits). Used to match OTP in SMS body. */
export type OtpLength = 4 | 5 | 6 | 7 | 8;

export type StartOtpListenerOptions = {
  /** Number of digits to match (4–8). Default 6. */
  length?: OtpLength;
};

/**
 * Request READ_SMS permission on Android. Shows the system permission dialog.
 * Use this before starting the READ_SMS listener, or use startOtpListenerAsync().
 * @returns true if already granted or user granted, false if denied. No-op on iOS/web (returns true).
 */
export async function requestReadSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Read SMS for OTP',
        message: 'This app needs to read SMS to auto-fill your verification code.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Request READ_SMS permission, then start listening for OTP in incoming SMS.
 * Call `stopOtpListener()` when done. Prefer this over startOtpListener() so the permission dialog is shown.
 * No-op on iOS and web.
 * @param options Optional `{ length: 4|5|6|7|8 }`. Default 6 when omitted.
 * @returns true if listener started (permission granted), false if permission denied.
 */
export async function startOtpListenerAsync(options?: StartOtpListenerOptions): Promise<boolean> {
  if (Platform.OS !== 'android' || !ExpoAndroidOtpAutofill?.startOtpListener) return false;
  const granted = await requestReadSmsPermission();
  if (!granted) return false;
  const length = options?.length;
  if (length != null && length >= 4 && length <= 8) {
    ExpoAndroidOtpAutofill.startOtpListener(length);
  } else {
    ExpoAndroidOtpAutofill.startOtpListener();
  }
  return true;
}

/**
 * Start listening for incoming SMS and parsing OTP of the given length.
 * On Android, request READ_SMS first with requestReadSmsPermission() or use startOtpListenerAsync()
 * so the system permission dialog is shown. Call `stopOtpListener()` when done.
 * No-op on iOS and web.
 * @param options Optional `{ length: 4|5|6|7|8 }`. Default 6 when omitted.
 */
export function startOtpListener(options?: StartOtpListenerOptions): void {
  if (!ExpoAndroidOtpAutofill?.startOtpListener) return;
  const length = options?.length;
  if (length != null && length >= 4 && length <= 8) {
    ExpoAndroidOtpAutofill.startOtpListener(length);
  } else {
    ExpoAndroidOtpAutofill.startOtpListener();
  }
}

/**
 * Stop the SMS listener and polling.
 * No-op on iOS and web.
 */
export function stopOtpListener(): void {
  if (ExpoAndroidOtpAutofill?.removeListener) {
    ExpoAndroidOtpAutofill.removeListener();
  }
}

/**
 * Get the 11-character app hash required for SMS Retriever API verification messages.
 * Your backend must include this hash in the SMS so the message can be delivered to your app.
 * No permission required. Returns null on iOS/web or if unavailable.
 * @see https://developers.google.com/identity/sms-retriever/verify
 */
export async function getAppHash(): Promise<string | null> {
  if (!ExpoAndroidOtpAutofill?.getAppHash) return null;
  return ExpoAndroidOtpAutofill.getAppHash();
}

/**
 * Start listening via SMS Retriever API (no READ_SMS permission).
 * The SMS must contain your app hash (from getAppHash()) and be ≤140 bytes.
 * Times out after ~5 minutes. Same onOtpReceived events as startOtpListener.
 * No-op on iOS and web.
 */
export function startSmsRetrieverListener(options?: StartOtpListenerOptions): void {
  if (!ExpoAndroidOtpAutofill?.startSmsRetrieverListener) return;
  const length = options?.length;
  if (length != null && length >= 4 && length <= 8) {
    ExpoAndroidOtpAutofill.startSmsRetrieverListener(length);
  } else {
    ExpoAndroidOtpAutofill.startSmsRetrieverListener();
  }
}

/**
 * Stop the SMS Retriever listener (unregister receiver).
 * No-op on iOS and web.
 */
export function stopSmsRetrieverListener(): void {
  if (ExpoAndroidOtpAutofill?.removeSmsRetrieverListener) {
    ExpoAndroidOtpAutofill.removeSmsRetrieverListener();
  }
}

/**
 * Subscribe to OTP events. Call the returned function to unsubscribe.
 * @param callback Called with the OTP string (4–8 digits) when detected from SMS.
 * @returns Unsubscribe function.
 */
export function addOtpListener(callback: (otp: string) => void): () => void {
  if (!ExpoAndroidOtpAutofill?.addEventListener) return () => {};
  const listener = (payload: { otp: string }) => callback(payload.otp);
  ExpoAndroidOtpAutofill.addEventListener(OTP_EVENT_NAME, listener as ExpoAndroidOtpAutofillModuleEvents['onOtpReceived']);
  return () => ExpoAndroidOtpAutofill.removeEventListener(OTP_EVENT_NAME, listener as ExpoAndroidOtpAutofillModuleEvents['onOtpReceived']);
}

/**
 * Subscribe to SMS Retriever timeout events (fired when no matching SMS is received within ~5 minutes).
 * Use this to show "Didn't get the code?" / "Resend" when using startSmsRetrieverListener().
 * @param callback Called when the retriever times out.
 * @returns Unsubscribe function.
 */
export function addSmsRetrieverTimeoutListener(callback: () => void): () => void {
  if (!ExpoAndroidOtpAutofill?.addEventListener) return () => {};
  const listener = () => callback();
  ExpoAndroidOtpAutofill.addEventListener(SMS_RETRIEVER_TIMEOUT_EVENT_NAME, listener as ExpoAndroidOtpAutofillModuleEvents['onSmsRetrieverTimeout']);
  return () => ExpoAndroidOtpAutofill.removeEventListener(SMS_RETRIEVER_TIMEOUT_EVENT_NAME, listener as ExpoAndroidOtpAutofillModuleEvents['onSmsRetrieverTimeout']);
}
