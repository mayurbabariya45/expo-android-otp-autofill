// Reexport the native module. On web, it will be resolved to ExpoAndroidOtpAutofillModule.web.ts
// and on native platforms to ExpoAndroidOtpAutofillModule.ts
export { default } from './ExpoAndroidOtpAutofillModule';
export { default as ExpoAndroidOtpAutofillView } from './ExpoAndroidOtpAutofillView';
export * from  './ExpoAndroidOtpAutofill.types';
