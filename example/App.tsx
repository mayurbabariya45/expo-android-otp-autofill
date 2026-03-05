import { useOtpVerify, type OtpLength } from 'expo-android-otp-autofill';
import { useState } from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const OTP_LENGTHS: { label: string; value: OtpLength }[] = [
  { label: '4 digits', value: 4 },
  { label: '6 digits', value: 6 },
  { label: '8 digits', value: 8 },
];

export default function App() {
  const [numberOfDigits, setNumberOfDigits] = useState<OtpLength>(6);
  const [code, setCode] = useState('');

  const { hash, otp, message, timeoutError, startListener, stopListener } = useOtpVerify({
    numberOfDigits,
    onOtpReceived: (otp) => setCode(otp),
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>OTP Autofill Example</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OTP code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder={`Enter ${numberOfDigits}-digit OTP`}
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={8}
            editable
          />
          <Text style={styles.hint}>
            {Platform.OS === 'android'
              ? `SMS Retriever: send an SMS with app hash + ${numberOfDigits}-digit code (≤140 bytes).`
              : 'Run on Android to auto-fill OTP from SMS.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OTP length</Text>
          <View style={styles.row}>
            {OTP_LENGTHS.map(({ label, value }) => (
              <Button
                key={value}
                title={label}
                onPress={() => setNumberOfDigits(value)}
                color={numberOfDigits === value ? '#0a7ea4' : '#666'}
              />
            ))}
          </View>
          <Text style={styles.hint}>
            Match {numberOfDigits}-digit codes in SMS (e.g. 1234 or 123456).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <View style={styles.row}>
            <Button title="Start listener" onPress={startListener} />
            <Button title="Stop listener" onPress={stopListener} />
          </View>
        </View>

        {timeoutError && (
          <View style={styles.section}>
            <Text style={styles.timeoutHint}>Timed out. Tap "Start listener" to retry.</Text>
          </View>
        )}

        {hash != null && (
          <View style={styles.section}>
            <Text style={styles.hint} numberOfLines={1}>App hash: {hash}</Text>
          </View>
        )}

        {otp != null && (
          <View style={styles.section}>
            <Text style={styles.lastOtp}>Last received: {otp}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Android only • expo-android-otp-autofill</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  lastOtp: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  timeoutHint: {
    fontSize: 13,
    color: '#c00',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
