import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, StatusBar, Alert
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const OTPVerificationScreen = ({ route, navigation }) => {
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

  // const verifyCode = async () => {
  //   if (code.length < 6) {
  //     setError('Enter a valid 6-digit code');
  //     return;
  //   }

  //   if (!confirmRef.current) {
  //     setError('No OTP session available. Please resend OTP.');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     console.log('Verifying OTP...');
  //     const userCredential = await confirmRef.current.confirm(code);
  //     const currentUser = userCredential.user;

  //     if (!currentUser) throw new Error('Authentication failed');

  //     console.log('OTP verified successfully!');
  //     console.log('Current UID:', currentUser.uid);

  //     const userDocRef = firestore().collection('users').doc(currentUser.uid);
  //     const userDoc = await userDocRef.get();

  //     if (!userDoc.exists) {
  //       console.log('New user detected. Redirecting to Signup.');
  //       navigation.dispatch(
  //         CommonActions.reset({
  //           index: 0,
  //           routes: [
  //             {
  //               name: 'Signup',
  //               params: {
  //                 uid: currentUser.uid,
  //                 fullPhone: currentUser.phoneNumber,
  //               },
  //             },
  //           ],
  //         })
  //       );
  //     } else {
  //       console.log('User profile exists. App will handle further navigation.');
  //     }

  //   } catch (error) {
  //     console.error('OTP verification error:', error.code, error.message);
  //     setError(getFriendlyError(error.code) || 'Verification failed. Please try again.');
  //   }

  //   setLoading(false);
  // };

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
      // App's auth listener will take care of redirecting to the appropriate screen
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="shield-check" size={50} color={THEME.primary} />
          </View>
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{fullPhone}</Text>
          </Text>
        </View>

        <View style={styles.content}>
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
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
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
      </View>
    </>
  );
};

export default OTPVerificationScreen;

const THEME = {
  primary: '#DC2626',
  primaryLight: '#FEE2E2',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#B91C1C',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '600',
    color: THEME.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingVertical: 20,
    fontSize: 24,
    letterSpacing: 8,
    color: THEME.text,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
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
    marginTop: 32,
    alignItems: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: THEME.primaryLight,
    borderRadius: 12,
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
