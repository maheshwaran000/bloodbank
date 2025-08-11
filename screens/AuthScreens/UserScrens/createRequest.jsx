// screens/CreatePostScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Image,
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

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const URGENCY = ['normal', 'soon', 'urgent', 'critical'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function CreatePostScreen({ navigation, route }) {
  // --- All State and Logic Preserved ---
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState(route.params?.type || 'receiver');

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [area, setArea] = useState('');
  const [hospital, setHospital] = useState('');
  const [prevDonationDate, setPrevDonationDate] = useState('');
  const [availableToDonate, setAvailableToDonate] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [purpose, setPurpose] = useState('');
  const [urgency, setUrgency] = useState('');
  const [patientDetails, setPatientDetails] = useState('');
  const [disease, setDisease] = useState('');

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        navigation?.replace?.('Login');
      }
    });
    return subscriber;
  }, [navigation]);

  const canSubmit = useMemo(() => {
    if (!uid || !bloodGroup || !phone || !stateName || !district) return false;
    if (postType === 'receiver' && (!name || !urgency)) return false;
    return true;
  }, [uid, postType, name, bloodGroup, phone, stateName, district, urgency]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Missing Details', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        type: postType,
        userId: uid,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        name: (name || '').trim(),
        gender,
        bloodGroup,
        location: [hospital, area, municipality, district, stateName].filter(Boolean).join(', '),
        description,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        prevDonationDate: postType === 'donor' ? (prevDonationDate || null) : null,
        availableToDonate: postType === 'donor' ? !!availableToDonate : null,
        medicalHistory: postType === 'donor' ? (medicalHistory || null) : null,
        purpose: postType === 'receiver' ? (purpose || null) : null,
        urgency: postType === 'receiver' ? (urgency || null) : null,
        patientDetails: postType === 'receiver' ? (patientDetails || null) : null,
        disease: postType === 'receiver' ? (disease || null) : null,
      };
      await firestore().collection('requests').add(payload);
      Alert.alert('Success', 'Your post has been created.');
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert('Failed to post', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW LAYOUT ---
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Top Red Container */}
        <View style={styles.topSection}>
          <View style={styles.header}>
            {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={30} color={THEME.surface} />
            </TouchableOpacity> */}
            <Text style={styles.headerTitle}>Create a Request</Text>
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
          {/* Type Segment */}
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, postType === 'receiver' && styles.segmentActive]}
              onPress={() => setPostType('receiver')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, postType === 'receiver' && styles.segmentTextActive]}>I Need Blood</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, postType === 'donor' && styles.segmentActive]}
              onPress={() => setPostType('donor')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, postType === 'donor' && styles.segmentTextActive]}>I Can Donate</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <Group title="Essentials">
            {postType === 'receiver' && (
              <Input label="Name" value={name} onChangeText={setName} placeholder="Patient or requester name" />
            )}
            <PickerRow label="Blood Group" value={bloodGroup} onSelect={setBloodGroup} options={BLOOD_GROUPS} />
            <PickerRow label="Gender" value={gender} onSelect={setGender} options={GENDERS} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91…" />
            <Input label="WhatsApp (optional)" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          </Group>

          <Group title="Location">
            <Input label="State" value={stateName} onChangeText={setStateName} />
            <Input label="District" value={district} onChangeText={setDistrict} />
            <Input label="Municipality / City" value={municipality} onChangeText={setMunicipality} />
            <Input label="Area / Locality" value={area} onChangeText={setArea} />
            <Input label="Hospital (optional)" value={hospital} onChangeText={setHospital} />
          </Group>

          {postType === 'donor' && (
            <Group title="Donor Details">
              <Input label="Previous Donation Date" value={prevDonationDate} onChangeText={setPrevDonationDate} placeholder="YYYY-MM-DD" />
              <ToggleRow label="Available to Donate" value={availableToDonate} onToggle={() => setAvailableToDonate((v) => !v)} />
              <Input label="Medical History (optional)" value={medicalHistory} onChangeText={setMedicalHistory} multiline />
              <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline />
            </Group>
          )}

          {postType === 'receiver' && (
            <Group title="Receiver Details">
              <PickerRow label="Urgency" value={urgency} onSelect={setUrgency} options={URGENCY.map((u) => u.charAt(0).toUpperCase() + u.slice(1))} mapBack={(s) => s.toLowerCase()} />
              <Input label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="e.g., Surgery, Accident" />
              <Input label="Patient Details (optional)" value={patientDetails} onChangeText={setPatientDetails} multiline />
              <Input label="Disease / Condition (optional)" value={disease} onChangeText={setDisease} />
              <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline />
            </Group>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={[styles.postBtn, (!canSubmit || loading) && { opacity: 0.6 }]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Submit Post</Text>}
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
const PickerRow = ({ label, value, onSelect, options, mapBack }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
      {options.map((opt) => {
        const key = mapBack ? mapBack(opt) : opt;
        const selected = value === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.pill, selected && styles.pillActive]}
            onPress={() => onSelect(key)}
            activeOpacity={0.9}
          >
            <Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);
const ToggleRow = ({ label, value, onToggle }) => (
  <View style={[styles.field, styles.toggleRow]}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[styles.toggle, value && styles.toggleOn]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </TouchableOpacity>
  </View>
);

/* NEW STYLES */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  scrollContainer: { paddingBottom: 100 },
  topSection: {
    backgroundColor: '#950404ff',
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
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingHorizontal: 16,
  },
    imageSpace: {
    height: 130,
    width: '100%',
    marginTop: 10,
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
    paddingLeft:20,
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
  postBtn: {
    backgroundColor: THEME.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: THEME.primaryLight,
  },
  segmentText: {
    color: THEME.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  segmentTextActive: {
    color: THEME.primary,
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
  pillsRow: { gap: 8 },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.primaryLight,
  },
  pillText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 14,
  },
  pillTextActive: {
    color: THEME.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingBottom: 0,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    padding: 3,
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
});
