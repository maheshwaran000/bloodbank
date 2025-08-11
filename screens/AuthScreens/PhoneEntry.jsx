// screens/AuthScreens/PhoneEntry.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  ImageBackground, // Import ImageBackground
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import auth from '@react-native-firebase/auth';

// --- THEME (for consistent colors) ---
const THEME = {
  primary: '#E74C3C',
  background: '#FFFFFF',
  text: '#333333',
  textSecondary: '#6B7280',
  border: '#DDDDDD',
  error: '#B91C1C',
  status:'#D10000'
};

export const PhoneEntryScreen = ({ navigation }) => {
  // --- State and Logic (Unchanged) ---
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
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      navigation.navigate('OTPVerification', { confirmation, fullPhone });
    } catch (e) {
      console.error('OTP Send Error:', e);
      let message = 'Failed to send OTP. Please try again later.';
      if (e.code === 'auth/invalid-phone-number') {
        message = 'The phone number you entered is not valid.';
      } else if (e.code === 'auth/too-many-requests') {
        message = 'You have tried too many times. Please try again later.';
      } else if (e.message.includes('SHA-1')) {
        message = 'App configuration error. Please check your Firebase setup.';
      }
      setError(message);
    }
    setLoading(false);
  };

  return (
    // Set the primary color for the safe area to blend with the status bar
    <SafeAreaView style={styles.container}>
      {/* Status bar now matches the theme and has light text */}
      <StatusBar barStyle="light-content" backgroundColor={THEME.status} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Use ImageBackground for the top section */}
        <ImageBackground
          source={require('../../assets/perfect.jpg')}
          style={styles.topSection}
          resizeMode="cover" // This makes the image fill the container
        >
          {/* The background is the image itself */}
        </ImageBackground>

        {/* Bottom Section with Form */}
        <View style={styles.bottomSection}>
          <Text style={styles.title}>LOGIN & REGISTER</Text>
          <Text style={styles.subtitle}>Enter your mobile number to continue</Text>

          {/* Phone Input Container */}
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
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={THEME.textSecondary}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={onContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={THEME.text} />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          {/* Footer Text */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Stylesheet with Layout Fixes ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // The primary color will show in the notch/status bar area
    backgroundColor: THEME.primary, 
  },
  topSection: {
    // Increased flex to make the image taller
    flex: 1.2, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.primary, // Ensures background color behind image
  },
  bottomSection: {
    // Decreased flex to make the form container shorter
    flex: 1,
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 30,
    // The negative margin is key for the overlapping curve effect
    marginTop: -30, 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  flagButton: {
    paddingVertical: 12,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  errorText: {
    color: THEME.error,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    // backgroundColor: THEME.background,
    backgroundColor:'#750000',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor:THEME.background ,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: THEME.background,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 10,
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
