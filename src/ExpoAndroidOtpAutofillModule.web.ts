import { registerWebModule, NativeModule } from 'expo';

import { ExpoAndroidOtpAutofillModuleEvents } from './ExpoAndroidOtpAutofill.types';

class ExpoAndroidOtpAutofillModule extends NativeModule<ExpoAndroidOtpAutofillModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoAndroidOtpAutofillModule, 'ExpoAndroidOtpAutofillModule');
