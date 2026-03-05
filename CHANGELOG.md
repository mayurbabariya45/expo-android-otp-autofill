# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.1.0 — 2026-03-06

### 🎉 New features

- [Android] Native Expo module for OTP auto-detect from SMS.
- READ_SMS and Play Services Auth declared in the module (no config plugin).
- Public API: `useOtpVerify`, `startOtpListener(options?)`, `stopOtpListener()`, `addOtpListener()`, `getAppHash`, `startSmsRetrieverListener`, `stopSmsRetrieverListener`, `addSmsRetrieverTimeoutListener`, `OTP_EVENT_NAME`, `SMS_RETRIEVER_TIMEOUT_EVENT_NAME`, `DEFAULT_OTP_LENGTH`; types `OtpLength`, `StartOtpListenerOptions`, `UseOtpVerifyOptions`, `UseOtpVerifyResult`.
- Configurable OTP length (4–8 digits). `startOtpListener()` and `startSmsRetrieverListener()` accept `{ length }` only.
- [Web] Stub implementation (no-op).
