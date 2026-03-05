import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAndroidOtpAutofillModuleEvents } from './ExpoAndroidOtpAutofill.types';

declare class ExpoAndroidOtpAutofillModule extends NativeModule<ExpoAndroidOtpAutofillModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAndroidOtpAutofillModule>('ExpoAndroidOtpAutofill');
