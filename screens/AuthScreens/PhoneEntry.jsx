// screens/AuthScreens/PhoneEntry.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';

export const PhoneEntryScreen = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinue = async () => {
    setError('');
    if (!/^[0-9]{6,15}$/.test(phone)) {
      setError('Please enter a valid phone number.');
      return;
    }
    
    setLoading(true);
    try {
      const fullPhone = `+${callingCode}${phone}`;
      console.log('Sending OTP to:', fullPhone);
      
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      
      navigation.navigate('OTPVerification', { 
        confirmation, 
        fullPhone 
      });
    } catch (e) {
      console.error('OTP send error:', e.code, e.message);
      setError('Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header with Blood Bank Theme */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="water" size={60} color={THEME.primary} />
          </View>
          <Text style={styles.title}>BloodConnect</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to save lives
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <CountryPicker
              countryCode={countryCode}
              withCallingCode
              withFilter
              withFlag
              onSelect={({ cca2, callingCode }) => {
                setCountryCode(cca2);
                setCallingCode(callingCode[0]);
              }}
              containerButtonStyle={styles.flagButton}
            />
            <Text style={styles.callingCode}>+{callingCode}</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#999"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={onContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="phone" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to help save lives and our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const THEME = {
  primary: '#DC2626',
  primaryLight: '#FEE2E2',
  secondary: '#7C2D12',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#B91C1C',
  success: '#059669',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    backgroundColor: THEME.surface,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  flagButton: {
    marginRight: 12,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    paddingVertical: 8,
  },
  errorText: {
    color: THEME.error,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footerText: {
    color: THEME.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  link: {
    color: THEME.primary,
    fontWeight: '600',
  },
});
