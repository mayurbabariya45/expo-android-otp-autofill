import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type OnOtpReceivedPayload = {
  otp: string;
  /** Full SMS body when received via SMS Retriever API; not set for READ_SMS. */
  message?: string;
};

export type OnSmsRetrieverTimeoutPayload = {
  timedOut: boolean;
};

export type ExpoAndroidOtpAutofillModuleEvents = {
  onOtpReceived: (payload: OnOtpReceivedPayload) => void;
  onSmsRetrieverTimeout: (payload: OnSmsRetrieverTimeoutPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoAndroidOtpAutofillViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
