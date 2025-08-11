// screens/AuthScreens/OTPVerificationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- THEME (for consistent colors) ---
const THEME = {
  primary: '#DC2626',
  primaryLight: '#FEE2E2',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#B91C1C',
};

const OTPVerificationScreen = ({ route, navigation }) => {
  // --- All existing logic and state are preserved ---
  const { confirmation, fullPhone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const confirmRef = useRef(confirmation);
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const verifyCode = async () => {
    if (code.length < 6) {
      setError('Enter a valid 6-digit code');
      return;
    }
    if (!confirmRef.current) {
      setError('No OTP session available. Please resend OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Verifying OTP...');
      const userCredential = await confirmRef.current.confirm(code);
      const currentUser = userCredential.user;
      if (!currentUser) throw new Error('Authentication failed');
      console.log('OTP verified!');
      const uid = currentUser.uid;
      const userDocRef = firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();
      const isExistingUser = userDoc.exists && userData?.profileComplete === true;
      console.log('Firestore user exists:', userDoc.exists);
      console.log('Profile complete:', userData?.profileComplete);
      if (!isExistingUser) {
        console.log('New or incomplete profile user. Redirecting to Signup...');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Signup',
                params: {
                  uid: uid,
                  fullPhone: currentUser.phoneNumber,
                },
              },
            ],
          })
        );
      } else {
        console.log('Existing user with complete profile. Let App.js handle navigation.');
      }
    } catch (error) {
      console.error('OTP verification error:', error.code, error.message);
      setError(getFriendlyError(error.code) || 'Verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setCode('');
    setError('');
    try {
      const newConfirmation = await auth().signInWithPhoneNumber(fullPhone);
      confirmRef.current = newConfirmation;
      startTimer();
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend OTP. Please try again.');
    }
    setResendLoading(false);
  };

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-verification-code':
        return 'Incorrect OTP. Please try again.';
      case 'auth/code-expired':
        return 'OTP expired. Please resend.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/session-expired':
        return 'Session expired. Please resend OTP.';
      default:
        return null;
    }
  };

  // --- NEW UI LAYOUT ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top section with solid color, icon, and text */}
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <Icon name="shield-check" size={50} color={THEME.primary} />
          </View>
          <Text style={styles.headerTitle}>Verify Phone</Text>
        </View>

        {/* Bottom section with the form */}
        <View style={styles.bottomSection}>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{fullPhone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              textAlign="center"
              placeholderTextColor="#999"
              autoFocus
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color={THEME.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.verifyButton, (loading || code.length < 6) && styles.buttonDisabled]}
            onPress={verifyCode}
            disabled={loading || code.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Verify & Continue</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color={THEME.primary} size="small" />
                ) : (
                  <>
                    <Icon name="refresh" size={16} color={THEME.primary} />
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.timerContainer}>
                <Icon name="timer-sand" size={16} color={THEME.textSecondary} />
                <Text style={styles.timerText}>Resend in {timer}s</Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- NEW STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.primary,
  },
  topSection: {
    flex: 0.8, // Adjusted flex ratio
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.background,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30, // Give space for the content
    marginTop: -30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  phoneNumber: {
    fontWeight: '600',
    color: THEME.primary,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 18,
    fontSize: 24,
    letterSpacing: 10,
    color: THEME.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: THEME.error,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  resendContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resendText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginLeft: 6,
  },
});

export default OTPVerificationScreen;
