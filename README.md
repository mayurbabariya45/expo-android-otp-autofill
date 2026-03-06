# expo-android-otp-autofill

Android-only Expo module that auto-detects OTP from SMS (READ_SMS and native code included). No third-party OTP library required.

## Features

- **Android only** — READ_SMS permission and native OTP reader; use `textContentType="oneTimeCode"` on iOS.
- **Expo module** — Native code in the package (autolinked); READ_SMS and Play Services Auth are declared in the module.
- **Event-based** — Native module emits `onOtpReceived` when an OTP (4–8 digits, configurable) is found.
- **Two modes** — Use **READ_SMS** (any SMS format) or **SMS Retriever API** (no permission; message must include your app hash).

## Installation

```bash
npx expo install expo-android-otp-autofill
```

## Setup

### 1. Prebuild (native module is included when you install the package)

```bash
npx expo prebuild --platform android
```

### 2. Use the API in your verify-otp screen

**Recommended – useOtpVerify** (SMS Retriever, no permission):

Your **backend must include the app hash** in every OTP SMS (see “Why is useOtpVerify not reading the message?” below if `otp` / `message` stay empty).

```ts
import { useOtpVerify } from 'expo-android-otp-autofill';

const { hash, otp, message, timeoutError, startListener, stopListener } = useOtpVerify({
  numberOfDigits: 4,
  onOtpReceived: (otp) => setValue('user_entered_otp', otp, { shouldValidate: true }),
});
// Use hash in your SMS template; otp/message when SMS arrives; timeoutError for "Resend".
```

**READ_SMS mode (any SMS format; shows permission dialog):**

Use `startOtpListenerAsync()` so the app requests READ_SMS and shows the system permission dialog before listening:

```ts
import {
  addOtpListener,
  startOtpListenerAsync,
  stopOtpListener,
} from 'expo-android-otp-autofill';

useEffect(() => {
  const remove = addOtpListener((otp) => setValue('user_entered_otp', otp, { shouldValidate: true }));
  startOtpListenerAsync({ length: 6 }); // requests READ_SMS, then starts listener
  return () => {
    stopOtpListener();
    remove();
  };
}, []);
```

To show the permission dialog at a specific time (e.g. on a button press), use `requestReadSmsPermission()` first, then `startOtpListener()`.

### Why is `useOtpVerify` not reading the message / not giving OTP?

`useOtpVerify` uses the **SMS Retriever API**. Android delivers an SMS to your app **only if** the message matches Google’s rules. If any of the following are wrong, you will not get `otp` or `message`:

| Requirement | What to do |
|-------------|------------|
| **App hash in SMS** | The SMS **must** contain the exact 11-character hash from `getAppHash()`. Your backend must append it to every OTP SMS (e.g. `Your code is 123456\nAbCdEfGhIjK`). Without it, the system never gives the SMS to your app. |
| **Hash matches build** | Debug and release builds have **different** hashes (different signing keys). Use the hash from the same build you’re testing (e.g. run the app, log `hash` from the hook, send that to your backend for testing). |
| **Message length** | SMS must be **≤ 140 bytes**. Shorten the template if needed. |
| **Format** | Follow [Google’s verification message format](https://developers.google.com/identity/sms-retriever/verify#1_construct_a_verification_message) (e.g. hash at end, no other app’s hash). |
| **Listener active** | The listener is started when the screen mounts. If the SMS arrives before the listener is ready or after it timed out (~5 min), call `startListener()` and send the SMS again. |
| **Device** | Needs Google Play Services. Emulators with Play Services are OK. |

**If you can’t change the SMS template** (e.g. third-party provider, fixed format): use **READ_SMS mode** instead so the app can read any recent SMS. You’ll get a one-time permission dialog:

```ts
import { addOtpListener, startOtpListenerAsync, stopOtpListener } from 'expo-android-otp-autofill';

useEffect(() => {
  const remove = addOtpListener((otp) => setValue('user_entered_otp', otp, { shouldValidate: true }));
  startOtpListenerAsync({ length: 6 });
  return () => { stopOtpListener(); remove(); };
}, []);
```

## API

| Name | Description |
|------|-------------|
| `useOtpVerify(options)` | Hook (SMS Retriever): `numberOfDigits`, `onOtpReceived`; returns `hash`, `otp`, `message`, `timeoutError`, `startListener`, `stopListener`. |
| `requestReadSmsPermission()` | **Promise\<boolean\>** — Requests READ_SMS; shows system dialog. Use before READ_SMS mode or use `startOtpListenerAsync()`. |
| `startOtpListenerAsync(options?)` | **Promise\<boolean\>** — Requests READ_SMS, then starts SMS polling. Use this so the permission dialog is shown. |
| `startOtpListener(options?)` | Starts SMS polling (READ_SMS); optional `length` (4–8, default 6). Call `requestReadSmsPermission()` or `startOtpListenerAsync()` first to show the dialog. |
| `stopOtpListener()` | Stops the READ_SMS listener. |
| `getAppHash()` | **Promise\<string | null\>** — Returns the 11-char app hash for SMS Retriever messages. |
| `startSmsRetrieverListener(options?)` | Starts SMS Retriever (no permission). Message must include app hash; ~5 min timeout. |
| `stopSmsRetrieverListener()` | Stops the SMS Retriever listener. |
| `addSmsRetrieverTimeoutListener(callback)` | Called when SMS Retriever times out (~5 min). Use for "Resend" / "Didn't get code?". |
| `addOtpListener(callback)` | Subscribes to OTP events; returns unsubscribe function. |

---

## Automatic SMS verification with the SMS Retriever API (no permission)

The **SMS Retriever API** lets you verify users via SMS **without READ_SMS**. The user does not grant any extra permissions; your server sends an SMS that contains a unique hash identifying your app, and the system delivers that message only to your app.

### 1. Get your app hash

Call `getAppHash()` and pass the value to your backend (e.g. at build time or via a one-time setup endpoint):

```ts
import { getAppHash } from 'expo-android-otp-autofill';

const hash = await getAppHash();
// e.g. "AbCdEfGhIjK" — give this to your server so it can include it in SMS
```

### 2. Message format / structure

The verification SMS **must**:

- Be **no longer than 140 bytes**
- Contain a **one-time code** (e.g. 4–8 digits)
- Include the **11-character hash** that identifies your app (from `getAppHash()`)

The exact format is flexible. Example:

```
Your verification code is 123456

AbCdEfGhIjK
```

(Replace `AbCdEfGhIjK` with your actual hash.)

For the full rules and how to compute the hash on the server, see the official guide:  
**[SMS Retriever API – Construct a verification message](https://developers.google.com/identity/sms-retriever/verify#1_construct_a_verification_message)** (Google for Developers).

### 3. Use the hook or imperative API

**Easiest:** use `useOtpVerify` — it starts the retriever on mount and gives you `hash`, `otp`, `message`, `timeoutError`, `startListener`, `stopListener`:

```ts
const { hash, otp, timeoutError, startListener, stopListener } = useOtpVerify({
  numberOfDigits: 6,
  onOtpReceived: (otp) => setCode(otp),
});
// On timeout, show "Resend" and call startListener() to retry.
```

Or use the imperative API (`addOtpListener`, `addSmsRetrieverTimeoutListener`, `startSmsRetrieverListener`, `stopSmsRetrieverListener`) if you prefer.

The retriever waits for a matching SMS for about **5 minutes**, then sets `timeoutError`. Call `startListener()` to retry.

---

## READ_SMS mode (any SMS format)

If you prefer to use the **READ_SMS** permission, the module reads the **most recent SMS** from the **last 2 minutes** and matches an OTP of the length you set (default 6; 4–8 supported). No special message format required. Example formats:

- `991233 is your OTP for …`
- `Your code is 991233`

---

## Phone number (optional)

For **phone number retrieval** without the user typing it, use the **Phone Number Hint API** (Android). This module does not implement it; you can use it alongside this one. See: [Request a phone number](https://developers.google.com/identity/sms-retriever/request#request_a_phone_number) (Google for Developers).

## Supported versions

- **Expo**: 50+
- **React Native**: 0.72+

## License

MIT
