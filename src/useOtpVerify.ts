import React, { useCallback, useEffect, useState } from 'react';

import ExpoAndroidOtpAutofill from './ExpoAndroidOtpAutofill';
import type { ExpoAndroidOtpAutofillModuleEvents } from './ExpoAndroidOtpAutofill.types';
import {
  addSmsRetrieverTimeoutListener,
  getAppHash,
  isAndroid,
  OTP_EVENT_NAME,
  startSmsRetrieverListener,
  stopSmsRetrieverListener,
} from './OtpAutofill';
import type { OtpLength } from './OtpAutofill';

export type UseOtpVerifyOptions = {
  /** Number of OTP digits to match (4–8). Default 6. */
  numberOfDigits?: OtpLength;
  /** Called when an OTP is received (e.g. to sync to a form field). */
  onOtpReceived?: (otp: string) => void;
};

export type UseOtpVerifyResult = {
  /** App hash for SMS Retriever (from getAppHash()). Include in your SMS template. */
  hash: string | null;
  /** OTP extracted from the last received SMS, or null. */
  otp: string | null;
  /** Full SMS message when received via SMS Retriever; null otherwise. */
  message: string | null;
  /** True when SMS Retriever timed out (~5 min). Show "Resend" or "Didn't get code?". */
  timeoutError: boolean;
  /** Start listening again (e.g. after timeout or to retry). */
  startListener: () => void;
  /** Stop the SMS Retriever listener. */
  stopListener: () => void;
};

const DEFAULT_DIGITS: OtpLength = 6;

/**
 * Hook for SMS Retriever API (no READ_SMS).
 * Returns hash, otp, message, timeoutError, startListener, stopListener.
 *
 * @example
 * const { hash, otp, message, timeoutError, startListener, stopListener } = useOtpVerify({ numberOfDigits: 4 });
 */
export function useOtpVerify(options: UseOtpVerifyOptions = {}): UseOtpVerifyResult {
  const { numberOfDigits = DEFAULT_DIGITS, onOtpReceived } = options;
  const [hash, setHash] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [timeoutError, setTimeoutError] = useState(false);
  const onOtpReceivedRef = React.useRef(onOtpReceived);
  onOtpReceivedRef.current = onOtpReceived;

  const startListener = useCallback(() => {
    if (!isAndroid()) return;
    setTimeoutError(false);
    const length = numberOfDigits >= 4 && numberOfDigits <= 8 ? numberOfDigits : DEFAULT_DIGITS;
    startSmsRetrieverListener({ length });
  }, [numberOfDigits]);

  const stopListener = useCallback(() => {
    if (isAndroid()) {
      stopSmsRetrieverListener();
    }
  }, []);

  useEffect(() => {
    if (!isAndroid() || !ExpoAndroidOtpAutofill?.addEventListener) {
      return;
    }

    getAppHash().then(setHash);

    const otpListener: ExpoAndroidOtpAutofillModuleEvents['onOtpReceived'] = (payload) => {
      setOtp(payload.otp);
      setMessage(payload.message ?? null);
      onOtpReceivedRef.current?.(payload.otp);
    };
    ExpoAndroidOtpAutofill.addEventListener(OTP_EVENT_NAME, otpListener);

    const removeTimeout = addSmsRetrieverTimeoutListener(() => setTimeoutError(true));

    const length = numberOfDigits >= 4 && numberOfDigits <= 8 ? numberOfDigits : DEFAULT_DIGITS;
    startSmsRetrieverListener({ length });

    return () => {
      ExpoAndroidOtpAutofill.removeEventListener(OTP_EVENT_NAME, otpListener);
      removeTimeout();
      stopSmsRetrieverListener();
    };
  }, [numberOfDigits]);

  return {
    hash,
    otp,
    message,
    timeoutError,
    startListener,
    stopListener,
  };
}
