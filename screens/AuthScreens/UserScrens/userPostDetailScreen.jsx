// screens/UserPostDetailScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView,
    Platform,
    Alert,
    Share,
    TextInput,
    ActivityIndicator,
    Image
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- THEME ---
const THEME = {
  primary: '#950404ff',
  primaryLight: '#FEE2E2',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#F59E0B',
  info: '#3B82F6',
  danger:'#950404ff',
};

// --- CONSTANTS ---
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const URGENCY = ['normal', 'soon', 'urgent', 'critical'];

// --- Main Screen Component ---
const UserPostDetailScreen = ({ route, navigation }) => {
  const { post } = route.params;
  
  // --- STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);

  const isDonor = post.type === 'donor';

  // --- EFFECTS ---
  useEffect(() => {
    if (isDonor) {
      setAppointmentLoading(true);
      const unsubscribe = firestore()
        .collection('donationAppointments')
        .where('requestId', '==', post.id)
        .limit(1)
        .onSnapshot(querySnapshot => {
          if (!querySnapshot.empty) {
            const appointmentDoc = querySnapshot.docs[0];
            setAppointmentDetails({ id: appointmentDoc.id, ...appointmentDoc.data() });
          } else {
            setAppointmentDetails(null);
          }
          setAppointmentLoading(false);
        }, error => {
          console.error("Error fetching appointment details: ", error);
          setAppointmentLoading(false);
        });
      return () => unsubscribe();
    } else {
      setAppointmentLoading(false);
    }
  }, [post.id, isDonor]);

  useEffect(() => {
    setEditableData(post || {});
  }, [post]);

  // --- HANDLERS ---
  const handleInputChange = (key, value) => setEditableData(prev => ({ ...prev, [key]: value }));
  const handleShare = async () => { /* ... */ };
  const handleDelete = () => { /* ... */ };
  const handleUpdate = async () => { /* ... */ };

  // --- RENDER ---
  const fieldsToDisplay = [
      { key: 'name', label: 'Name', editable: false },
      { key: 'phone', label: 'Phone Number', editable: true },
      { key: 'location', label: 'Location', editable: true, multiline: true },
      { key: 'bloodGroup', label: 'Blood Group', editable: true, type: 'picker', options: BLOOD_GROUPS },
      { key: 'urgency', label: 'Urgency', editable: true, type: 'picker', options: URGENCY, isVisible: !isDonor },
      { key: 'purpose', label: 'Purpose', editable: true, isVisible: !isDonor },
      { key: 'patientDetails', label: 'Patient Details', editable: true, isVisible: !isDonor, multiline: true },
      { key: 'disease', label: 'Disease / Condition', editable: true, isVisible: !isDonor },
      { key: 'prevDonationDate', label: 'Previous Donation Date', editable: true, isVisible: isDonor, placeholder: 'YYYY-MM-DD' },
      { key: 'medicalHistory', label: 'Medical History', editable: true, isVisible: isDonor, multiline: true },
      { key: 'description', label: 'Additional Notes', editable: true, multiline: true },
      { key: 'createdAt', label: 'Posted On', editable: false, isDate: true },
  ];

  return (
    <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.topSection}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Icon name="chevron-left" size={30} color={THEME.surface} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Your Post</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}><Icon name={isEditing ? "close-circle-outline" : "pencil-outline"} size={24} color={THEME.surface} /></TouchableOpacity>
                </View>
                <Image source={require('../bottomTabs/save_life-02.png')} style={styles.imageSpace} resizeMode="contain" /> 
            </View>

            <View style={styles.bottomSection}>
                {isDonor && <AppointmentCard details={appointmentDetails} loading={appointmentLoading} />}
                <View style={styles.infoCard}>
                    {fieldsToDisplay.map(field => (
                        <EditableField 
                            key={field.key}
                            label={field.label}
                            value={editableData[field.key]}
                            onChange={(val) => handleInputChange(field.key, val)}
                            isEditing={isEditing && field.editable}
                            type={field.type}
                            options={field.options}
                            isVisible={field.isVisible !== false}
                            multiline={field.multiline}
                            isDate={field.isDate}
                            placeholder={field.placeholder}
                        />
                    ))}
                </View>
                {isEditing ? (
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={loading}>{loading ? <ActivityIndicator color={THEME.surface} /> : <Text style={styles.actionButtonText}>Update Post</Text>}</TouchableOpacity>
                ) : (
                    <View style={styles.actionsContainer}>
                        <ActionButton icon="share-variant-outline" text="Share" onPress={handleShare} />
                        <ActionButton icon="delete-outline" text="Delete" onPress={handleDelete} color={THEME.danger} />
                    </View>
                )}
            </View>
        </ScrollView>
    </SafeAreaView>
  );
};

// --- Reusable Child Components ---

const AppointmentCard = ({ details, loading }) => {
    if (loading) return <View style={styles.appointmentCard}><ActivityIndicator color={THEME.primary} /></View>;
    if (!details) return null; // Don't show the card if there are no details

    // Safely format the date string
    const appointmentDate = details.appointmentDate ? new Date(details.appointmentDate).toLocaleDateString('en-GB') : 'N/A';

    return (
        <View style={styles.appointmentCard}>
            <Text style={styles.appointmentTitle}>Blood Bank Appointment</Text>
            <View style={styles.fieldContainer}><Text style={styles.label}>Date & Time</Text><Text style={styles.info}>{appointmentDate} at {details.appointmentTime}</Text></View>
            <View style={styles.fieldContainer}><Text style={styles.label}>Location</Text><Text style={styles.info}>{details.bloodBankLocation}</Text></View>
            <View style={styles.statusRow}>
                <View style={{flex: 1}}><Text style={styles.label}>Appointment Status</Text><StatusBadge status={details.appointmentStatus} /></View>
                <View style={{flex: 1}}><Text style={styles.label}>Donation Status</Text><StatusBadge status={details.donationStatus} /></View>
            </View>
        </View>
    );
};

const StatusBadge = ({ status }) => {
    const statusStyles = {
        pending_approval: { bg: THEME.warning, text: 'Pending Approval' },
        approved: { bg: THEME.success, text: 'Approved' },
        rejected: { bg: THEME.danger, text: 'Rejected' },
        pending: { bg: THEME.info, text: 'Pending' },
        completed: { bg: THEME.success, text: 'Completed' },
        cancelled: { bg: THEME.danger, text: 'Cancelled' },
    };
    const currentStyle = statusStyles[status] || { bg: THEME.textSecondary, text: status };
    return <View style={[styles.badge, { backgroundColor: currentStyle.bg }]}><Text style={styles.badgeText}>{currentStyle.text}</Text></View>;
};

const EditableField = ({ label, value, onChange, isEditing, type = 'text', options = [], isVisible = true, multiline = false, isDate = false, placeholder }) => {
    if (!isVisible) return null;

    // --- FIX IS HERE ---
    // This function robustly formats the date value into a string.
    const getDisplayValue = () => {
        if (!value) return 'Not specified';
        if (isDate) {
            if (value.toDate) return value.toDate().toLocaleDateString('en-GB'); // Firestore Timestamp
            if (value instanceof Date) return value.toLocaleDateString('en-GB'); // JS Date Object
            if (typeof value === 'string') return new Date(value).toLocaleDateString('en-GB'); // Date String
        }
        return value;
    };

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
                type === 'picker' ? (
                    <View style={styles.pillsRow}>
                        {options.map(opt => (
                            <TouchableOpacity key={opt} style={[styles.pill, value === opt && styles.pillActive]} onPress={() => onChange(opt)}>
                                <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <TextInput 
                        style={[styles.input, multiline && {height: 80, textAlignVertical: 'top'}]}
                        value={String(value || '')}
                        onChangeText={onChange}
                        multiline={multiline}
                        placeholder={placeholder}
                        placeholderTextColor={THEME.textSecondary + '99'}
                    />
                )
            ) : (
                <Text style={styles.info}>{getDisplayValue()}</Text>
            )}
        </View>
    );
};

const ActionButton = ({ icon, text, onPress, color = THEME.primary }) => (
    <TouchableOpacity style={[styles.actionButton, {backgroundColor: color}]} onPress={onPress}>
        <Icon name={icon} size={20} color={THEME.surface} />
        <Text style={styles.actionButtonText}>{text}</Text>
    </TouchableOpacity>
);

// --- STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  scrollContainer: { paddingBottom: 40 },
  topSection: { backgroundColor: THEME.primary, paddingBottom: 40, },
  bottomSection: { backgroundColor: THEME.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.surface, },
  editButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', },
  imageSpace: { height: 130, width: '100%', marginTop: 14, },
  infoCard: { backgroundColor: THEME.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: THEME.border, marginBottom: 24, },
  fieldContainer: { marginBottom: 20, },
  label: { fontSize: 14, color: THEME.textSecondary, marginBottom: 8, fontWeight: '600', },
  info: { fontSize: 16, fontWeight: '600', color: THEME.text, },
  input: { fontSize: 16, fontWeight: '600', color: THEME.text, backgroundColor: THEME.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: THEME.border, },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: THEME.background, borderWidth: 1, borderColor: THEME.border, },
  pillActive: { backgroundColor: THEME.primaryLight, borderColor: THEME.primary, },
  pillText: { color: THEME.textSecondary, fontWeight: '600', },
  pillTextActive: { color: THEME.primary, },
  actionsContainer: { flexDirection: 'row', gap: 12, },
  actionButton: { flex: 1, flexDirection: 'row', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  actionButtonText: { color: THEME.surface, fontSize: 16, fontWeight: 'bold', marginLeft: 8, },
  updateButton: { height: 52, borderRadius: 16, backgroundColor: THEME.success, justifyContent: 'center', alignItems: 'center', },
  appointmentCard: { backgroundColor: THEME.surface, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: THEME.border, },
  appointmentTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: THEME.border, paddingBottom: 10, },
  statusRow: { flexDirection: 'row', gap: 16, marginTop: 10, },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', },
  badgeText: { color: THEME.surface, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
});

export default UserPostDetailScreen;