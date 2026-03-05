import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoAndroidOtpAutofillViewProps } from './ExpoAndroidOtpAutofill.types';

const NativeView: React.ComponentType<ExpoAndroidOtpAutofillViewProps> =
  requireNativeView('ExpoAndroidOtpAutofill');

export default function ExpoAndroidOtpAutofillView(props: ExpoAndroidOtpAutofillViewProps) {
  return <NativeView {...props} />;
}
