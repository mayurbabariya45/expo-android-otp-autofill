import * as React from 'react';

import { ExpoAndroidOtpAutofillViewProps } from './ExpoAndroidOtpAutofill.types';

export default function ExpoAndroidOtpAutofillView(props: ExpoAndroidOtpAutofillViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
