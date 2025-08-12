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
  Modal,
  FlatList,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Local Imports ---
import { locationData } from './statesData';
import { ALL_DAY_SLOTS } from './timeSlots';

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

// --- CONSTANTS ---
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const URGENCY = ['normal', 'soon', 'urgent', 'critical'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function CreatePostScreen({ navigation, route }) {
  // --- Component State ---
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState(route.params?.type || 'receiver');

  // Shared Fields
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  
  // Location Fields
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [constituency, setConstituency] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [area, setArea] = useState('');
  const [hospital, setHospital] = useState('');

  // Donor-Specific Fields
  const [prevDonationDate, setPrevDonationDate] = useState('');
  const [availableToDonate, setAvailableToDonate] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState('');
  
  // Professional Appointment Fields (for Donor)
  const [appointmentDate, setAppointmentDate] = useState(null); // Date object
  const [appointmentTime, setAppointmentTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  // Receiver-Specific Fields
  const [purpose, setPurpose] = useState('');
  const [urgency, setUrgency] = useState('');
  const [patientDetails, setPatientDetails] = useState('');
  const [disease, setDisease] = useState('');

  // --- Effects ---
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
      else navigation?.replace?.('Login');
    });
    return subscriber;
  }, [navigation]);

  useEffect(() => {
    setDistrict('');
    setConstituency('');
  }, [stateName]);

  useEffect(() => {
    if (!appointmentDate) {
      setAvailableSlots([]);
      setAppointmentTime('');
      return;
    }
    const fetchBookedSlots = async () => {
      setSlotsLoading(true);
      setAppointmentTime('');
      try {
        const selectedDateString = appointmentDate.toISOString().split('T')[0];
        const appointmentsSnapshot = await firestore()
          .collection('donationAppointments')
          .where('appointmentDate', '==', selectedDateString)
          .get();

        const bookedTimes = appointmentsSnapshot.docs.map(doc => doc.data().appointmentTime);
        const freeSlots = ALL_DAY_SLOTS.filter(slot => !bookedTimes.includes(slot));
        setAvailableSlots(freeSlots);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        Alert.alert('Error', 'Could not fetch available time slots.');
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchBookedSlots();
  }, [appointmentDate]);

  // --- Logic ---
  const canSubmit = useMemo(() => {
    if (!uid || !name || !bloodGroup || !phone || !stateName || !district || !constituency) return false;
    if (postType === 'receiver' && !urgency) return false;
    if (postType === 'donor' && (!appointmentDate || !appointmentTime)) return false;
    return true;
  }, [uid, postType, name, bloodGroup, phone, stateName, district, constituency, urgency, appointmentDate, appointmentTime]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Missing Details', 'Please fill all required fields to submit.');
      return;
    }
    setLoading(true);
    try {
      const requestPayload = {
        type: postType,
        userId: uid,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        name: name.trim(),
        gender,
        bloodGroup,
        location: [hospital, area, municipality, district, constituency, stateName].filter(Boolean).join(', '),
        location_structured: {
            state: stateName, district, constituency, municipality, area, hospital,
        },
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

      const requestRef = await firestore().collection('requests').add(requestPayload);

      if (postType === 'donor') {
        const appointmentPayload = {
          requestId: requestRef.id,
          userId: uid,
          appointmentDate: appointmentDate.toISOString().split('T')[0],
          appointmentTime: appointmentTime,
          bloodBankLocation: "Mega Blood Bank, Hyderabad",
          appointmentStatus: "pending_approval",
          donationStatus: "pending",
          createdAt: firestore.FieldValue.serverTimestamp(),
        };
        await firestore().collection('donationAppointments').add(appointmentPayload);
      }
      Alert.alert('Success', 'Your post has been created successfully.');
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert('Failed to post', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const states = Object.keys(locationData);
  const districts = stateName ? locationData[stateName].districts : [];
  const constituencies = stateName ? locationData[stateName].constituencies : [];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.topSection}>
            <View style={styles.header}><Text style={styles.headerTitle}>Create a Request</Text></View>
            <Image source={require('../bottomTabs/save_life-02.png')} style={styles.imageSpace} resizeMode="contain"/>
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.segment}>
            <TouchableOpacity style={[styles.segmentItem, postType === 'receiver' && styles.segmentActive]} onPress={() => setPostType('receiver')} activeOpacity={0.9}><Text style={[styles.segmentText, postType === 'receiver' && styles.segmentTextActive]}>I Need Blood</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segmentItem, postType === 'donor' && styles.segmentActive]} onPress={() => setPostType('donor')} activeOpacity={0.9}><Text style={[styles.segmentText, postType === 'donor' && styles.segmentTextActive]}>I Can Donate</Text></TouchableOpacity>
          </View>

          <Group title="Essentials">
            <Input label="Name" value={name} onChangeText={setName} placeholder="Patient or Donor name" />
            <PickerRow label="Blood Group" value={bloodGroup} onSelect={setBloodGroup} options={BLOOD_GROUPS} />
            <PickerRow label="Gender" value={gender} onSelect={setGender} options={GENDERS} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91…" />
            <Input label="WhatsApp (optional)" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          </Group>

          <Group title="Location">
            <ModalPicker label="State" value={stateName} onSelect={setStateName} options={states} />
            <ModalPicker label="Constituency" value={constituency} onSelect={setConstituency} options={constituencies} disabled={!stateName} />
            <ModalPicker label="District" value={district} onSelect={setDistrict} options={districts} disabled={!stateName} />
            <Input label="Municipality / City" value={municipality} onChangeText={setMunicipality} />
            <Input label="Area / Locality" value={area} onChangeText={setArea} />
            {postType === 'receiver' && <Input label="Hospital (optional)" value={hospital} onChangeText={setHospital} />}
          </Group>

          {postType === 'donor' && (
            <>
              <Group title="Donor Details">
                <Input label="Previous Donation Date" value={prevDonationDate} onChangeText={setPrevDonationDate} placeholder="YYYY-MM-DD" />
                <ToggleRow label="Are you currently available?" value={availableToDonate} onToggle={() => setAvailableToDonate(v => !v)} />
                <Input label="Medical History (optional)" value={medicalHistory} onChangeText={setMedicalHistory} multiline />
              </Group>
              <Group title="Book an Appointment">
                <Text style={styles.label}>Preferred Date 🗓️</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}><Text style={styles.datePickerText}>{appointmentDate ? appointmentDate.toLocaleDateString('en-GB') : "Select a Date"}</Text></TouchableOpacity>
                {showDatePicker && <DateTimePicker value={appointmentDate || new Date()} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />}
                {slotsLoading && <ActivityIndicator style={{marginTop: 16}} color={THEME.primary} />}
                {!slotsLoading && appointmentDate && ( availableSlots.length > 0 ? ( <PickerRow label="Available Time Slots" value={appointmentTime} onSelect={setAppointmentTime} options={availableSlots} /> ) : ( <Text style={styles.noSlotsText}>No slots available for this date. Please select another day.</Text> ) )}
              </Group>
            </>
          )}

          {postType === 'receiver' && (
            <Group title="Receiver Details">
              <PickerRow label="Urgency" value={urgency} onSelect={setUrgency} options={URGENCY.map((u) => u.charAt(0).toUpperCase() + u.slice(1))} mapBack={(s) => s.toLowerCase()} />
              <Input label="Purpose of Requirement" value={purpose} onChangeText={setPurpose} placeholder="e.g., Surgery, Accident" />
              <Input label="Description / More Details" value={description} onChangeText={setDescription} multiline />
            </Group>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit || loading} style={[styles.postBtn, (!canSubmit || loading) && { opacity: 0.6 }]} >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Submit Post</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Reusable Components ---

const ModalPicker = ({ label, value, onSelect, options, disabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const handleSelect = (option) => { onSelect(option); setModalVisible(false); setSearch(''); };

  return ( <> <View style={styles.field}><Text style={styles.label}>{label}</Text><TouchableOpacity style={[styles.input, styles.pickerInput, disabled && styles.disabledInput]} onPress={() => !disabled && setModalVisible(true)} disabled={disabled}><Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>{value || `Select ${label}`}</Text><Icon name="chevron-down" size={22} color={THEME.textSecondary} /></TouchableOpacity></View><Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}><TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} activeOpacity={1}><View style={styles.modalContent} onStartShouldSetResponder={() => true}><Text style={styles.modalTitle}>Select {label}</Text><TextInput style={styles.searchInput} placeholder="Search..." value={search} onChangeText={setSearch} placeholderTextColor={THEME.textSecondary + '99'} /><FlatList data={filteredOptions} keyExtractor={(item) => item} renderItem={({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}><Text style={styles.modalItemText}>{item}</Text></TouchableOpacity>)} ItemSeparatorComponent={() => <View style={styles.separator} />} /></View></TouchableOpacity></Modal></> );
};
const Group = ({ title, children }) => ( <View style={styles.group}><Text style={styles.groupTitle}>{title}</Text><View style={styles.card}>{children}</View></View> );
const Input = ({ label, ...props }) => ( <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={THEME.textSecondary + '99'} style={[styles.input, props.multiline && styles.textarea]} {...props} /></View> );
const PickerRow = ({ label, value, onSelect, options, mapBack }) => ( <View style={styles.field}><Text style={styles.label}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>{options.map((opt) => { const key = mapBack ? mapBack(opt) : opt; const selected = value === key; return (<TouchableOpacity key={key} style={[styles.pill, selected && styles.pillActive]} onPress={() => onSelect(key)} activeOpacity={0.9}><Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt}</Text></TouchableOpacity>); })}</ScrollView></View> );
const ToggleRow = ({ label, value, onToggle }) => ( <View style={[styles.field, styles.toggleRow]}><Text style={styles.label}>{label}</Text><TouchableOpacity style={[styles.toggle, value && styles.toggleOn]} onPress={onToggle} activeOpacity={0.9}><View style={[styles.knob, value && styles.knobOn]} /></TouchableOpacity></View> );

// --- Styles ---

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  scrollContainer: { paddingBottom: 100 },
  topSection: { backgroundColor: '#950404ff', paddingBottom: 40 },
  bottomSection: { backgroundColor: THEME.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingHorizontal: 16 },
  imageSpace: { height: 130, width: '100%', marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.surface, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, backgroundColor: THEME.surface, borderTopWidth: 1, borderColor: THEME.border },
  postBtn: { backgroundColor: THEME.primary, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  segment: { flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, padding: 6, marginBottom: 24, borderWidth: 1, borderColor: THEME.border },
  segmentItem: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: THEME.primaryLight },
  segmentText: { color: THEME.textSecondary, fontWeight: 'bold', fontSize: 14 },
  segmentTextActive: { color: THEME.primary },
  group: { marginBottom: 16 },
  groupTitle: { color: THEME.text, fontWeight: 'bold', marginBottom: 8, fontSize: 18 },
  card: { backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingTop: 16, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  field: { marginBottom: 16 },
  label: { color: THEME.textSecondary, fontWeight: '600', marginBottom: 8, fontSize: 14 },
  input: { height: 50, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, color: THEME.text, fontSize: 16 },
  textarea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  pillsRow: { gap: 8, paddingBottom: 4 },
  pill: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: THEME.primaryLight, borderWidth: 1, borderColor: THEME.primary },
  pillText: { color: THEME.text, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: THEME.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  toggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', padding: 3 },
  toggleOn: { backgroundColor: THEME.success },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', transform: [{ translateX: 0 }] },
  knobOn: { transform: [{ translateX: 24 }] },
  pickerInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { color: THEME.text, fontSize: 16 },
  pickerPlaceholder: { color: THEME.textSecondary + '99' },
  disabledInput: { backgroundColor: '#E5E7EB' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: THEME.surface, borderRadius: 16, width: '100%', maxHeight: '80%', padding: 16, elevation: 5, shadowOffset: { width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 16, textAlign: 'center' },
  searchInput: { height: 44, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, color: THEME.text, fontSize: 16, marginBottom: 12 },
  modalItem: { paddingVertical: 14, paddingHorizontal: 8 },
  modalItemText: { fontSize: 16, color: THEME.text },
  separator: { height: 1, backgroundColor: THEME.border },
  datePickerButton: { height: 50, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 8 },
  datePickerText: { color: THEME.text, fontSize: 16 },
  noSlotsText: { textAlign: 'center', color: THEME.textSecondary, marginVertical: 16, fontSize: 14, fontStyle: 'italic' },
});