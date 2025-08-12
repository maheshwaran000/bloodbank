// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Image
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- THEME ---
const THEME = {
  primary: '#C81E1E',
  primaryLight: '#FEE2E2',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
};

export default function ProfileScreen({ navigation }) {
  // --- All State and Logic Preserved ---
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState({});

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          setError('');
          const userDocument = await firestore().collection('users').doc(user.uid).get();
          if (userDocument.exists) {
            setData({ id: userDocument.id, ...userDocument.data() });
          } else {
            setError('User profile not found.');
            setData(null);
          }
        } catch (e) {
          console.error(e);
          setError('Failed to load profile.');
          setData(null);
        }
      } else {
        setData(null);
        navigation?.replace('Login');
      }
      if (loading) setLoading(false);
    });
    return subscriber;
  }, [navigation, loading]);

  const startEdit = (key) => setEditing((e) => ({ ...e, [key]: true }));
  const cancelEdit = (key) => setEditing((e) => ({ ...e, [key]: false }));

  const saveField = async (key, value) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Authentication Error', 'You must be logged in.');
      return;
    }
    try {
      setSavingKey(key);
      const userDocRef = firestore().collection('users').doc(currentUser.uid);
      await userDocRef.update({
        [key]: value,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setData((d) => ({ ...d, [key]: value }));
      setEditing((e) => ({ ...e, [key]: false }));
    } catch (e) {
      Alert.alert('Update failed', e?.message || 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleAvailability = async () => {
    if (!data) return;
    await saveField('isAvailableToDonate', !data.isAvailableToDonate);
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (e) {
      Alert.alert('Logout failed', e?.message || 'Please try again.');
    }
  };

  const Field = ({ label, keyName, placeholder }) => {
    const isEditing = !!editing[keyName];
    const value = data?.[keyName];
    const [temp, setTemp] = useState(String(value || ''));

    useEffect(() => {
      if (!isEditing) {
        setTemp(String(value || ''));
      }
    }, [isEditing, value]);

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          {isEditing ? (
            <TextInput
              value={temp}
              onChangeText={setTemp}
              placeholder={placeholder}
              placeholderTextColor={THEME.textSecondary + '99'}
              style={styles.input}
              autoFocus
            />
          ) : (
            <Text style={styles.value}>{String(value || '-')}</Text>
          )}
          <View style={styles.editActions}>
            {isEditing ? (
              <>
                <TouchableOpacity onPress={() => cancelEdit(keyName)}>
                  <Icon name="close-circle-outline" size={24} color={THEME.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveField(keyName, temp)} disabled={savingKey === keyName}>
                  {savingKey === keyName ? <ActivityIndicator size="small" color={THEME.primary} /> : <Icon name="check-circle-outline" size={24} color={THEME.success} />}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => startEdit(keyName)}>
                <Icon name="pencil-outline" size={24} color={THEME.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Red Container */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            {/* <Icon name="logout" size={24} color={THEME.surface} /> */}
            <Text  style={styles.logoutButtonTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Image 
          source={require('../bottomTabs/save_life-02.png')} 
          style={styles.imageSpace} 
          resizeMode="contain"
        /> 
      </View>

      {/* Bottom White Container */}
      <View style={styles.bottomSection}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={THEME.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.availability}>
              <Text style={styles.availText}>Available to Donate</Text>
              <TouchableOpacity
                style={[styles.toggle, data.isAvailableToDonate && styles.toggleOn]}
                onPress={toggleAvailability}
                activeOpacity={0.9}
              >
                <View style={[styles.knob, data.isAvailableToDonate && styles.knobOn]} />
              </TouchableOpacity>
            </View>
            <Field label="Name" keyName="name" placeholder="Enter your name" />
            <Field label="Phone" keyName="phone" placeholder="+91…" />
            <Field label="Age" keyName="age" placeholder="Enter age" />
            <Field label="Blood Group" keyName="bloodGroup" placeholder="A+, O-, etc." />
            <Field label="State" keyName="state" placeholder="Your state" />
            <Field label="Constituency" keyName="constituency" placeholder="Your city/area" />
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// --- NEW STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.primary },
  topSection: {
    backgroundColor:'#950404ff',
    paddingBottom: 40,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.surface,
  },
  logoutButton: {
    paddingLeft: 5,
    paddingRight:5,
    borderWidth:2,
    borderColor:"#fff",
    borderRadius:5,
  },
  logoutButtonTxt:{
    color:"#fff",
  },
  imageSpace: {
    height: 130,
    width: '100%',
    marginTop: 14,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: THEME.primary,
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  availability: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },
  availText: {
    color: THEME.text,
    fontWeight: 'bold',
    flex: 1,
    fontSize: 16,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: THEME.success,
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  knobOn: {
    transform: [{ translateX: 24 }],
  },
  fieldContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  label: {
    color: THEME.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    flex: 1,
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    padding: 0, // Remove default padding
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
});
