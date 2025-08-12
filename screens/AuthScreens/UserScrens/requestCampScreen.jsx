// screens/RequestCampScreen.js
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
  Image,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

// --- THEME ---
const THEME = {
  primary: '#950404ff',
  primaryLight: '#FEE2E2',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export default function RequestCampScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [organizationName, setOrganizationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [expectedDonors, setExpectedDonors] = useState('');
  const [facilities, setFacilities] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUser(currentUser);
      // Pre-fill contact info from user's profile if available
      firestore().collection('users').doc(currentUser.uid).get().then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          setContactPerson(userData.name || '');
          setPhone(userData.phone || currentUser.phoneNumber || '');
        }
      });
    }
  }, []);
   useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(THEME.primary);
      }
      return () => {
        // Optional: Reset status bar style when screen is unfocused
        StatusBar.setBarStyle('default');
         if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(THEME.background); // Or your app's default color
        }
      };
    }, [])
  );

  const handleSubmit = async () => {
    if (!organizationName || !contactPerson || !phone || !proposedDate || !venueAddress || !expectedDonors) {
      Alert.alert('Missing Details', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userId: user.uid,
        organizationName,
        contactPerson,
        phone,
        proposedDate,
        venueAddress,
        expectedDonors,
        facilities,
        notes,
        status: 'pending', // Default status
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      await firestore().collection('campRequests').add(payload);
      Alert.alert('Success', 'Your camp request has been submitted for review.');
      navigation.goBack();
    } catch (error) {
      console.log(error);  
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Top Red Container */}
        <View style={styles.topSection}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={30} color={THEME.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Organize a Camp</Text>
            <View style={{ width: 40 }} />
          </View>
          <Image 
            source={require('../bottomTabs/save_life-02.png')} 
            style={styles.imageSpace} 
            resizeMode="contain"
          /> 
        </View>

        {/* Bottom White Container */}
        <View style={styles.bottomSection}>
          <Group title="Organizer's Details">
            <Input label="Organization / Group Name" value={organizationName} onChangeText={setOrganizationName} placeholder="e.g., Lions Club of Jubilee Hills" />
            <Input label="Contact Person" value={contactPerson} onChangeText={setContactPerson} />
            <Input label="Contact Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Group>

          <Group title="Camp Logistics">
            <Input label="Proposed Date" value={proposedDate} onChangeText={setProposedDate} placeholder="YYYY-MM-DD" />
            <Input label="Venue Address" value={venueAddress} onChangeText={setVenueAddress} multiline />
            <Input label="Expected Number of Donors" value={expectedDonors} onChangeText={setExpectedDonors} keyboardType="number-pad" placeholder="e.g., 50-100" />
          </Group>

          <Group title="Facilities & Notes">
            <Input label="Available Facilities (optional)" value={facilities} onChangeText={setFacilities} multiline placeholder="e.g., Air-conditioned hall, parking..." />
            <Input label="Additional Notes (optional)" value={notes} onChangeText={setNotes} multiline />
          </Group>
        </View>
      </ScrollView>

      {/* Submit Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* Reusable UI pieces */
const Group = ({ title, children }) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);
const Input = ({ label, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={THEME.textSecondary + '99'}
      style={[styles.input, props.multiline && styles.textarea]}
      {...props}
    />
  </View>
);

/* NEW STYLES */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  scrollContainer: { paddingBottom: 120 }, // Extra padding for the fixed button
  topSection: {
    backgroundColor: THEME.primary,
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.surface,
  },
  imageSpace: {
    height: 130,
    width: '100%',
    marginTop: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderColor: THEME.border,
  },
  submitBtn: {
    backgroundColor: THEME.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  group: { marginBottom: 16 },
  groupTitle: {
    color: THEME.text,
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 18,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  field: { marginBottom: 16 },
  label: {
    color: THEME.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: THEME.text,
    fontSize: 16,
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});
