// screens/DonationCampDetailScreen.js
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
  danger: '#950404ff',
  warning: '#F59E0B',
};

// --- Main Screen ---
const DonationCampDetailScreen = ({ route, navigation }) => {
  const { request } = route.params;
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableData, setEditableData] = useState({});

  useEffect(() => {
    setEditableData(request || {});
  }, [request]);

  const handleInputChange = (key, value) => {
    setEditableData(prev => ({ ...prev, [key]: value }));
  };

  const handleShare = async () => {
    try {
      const message = `*Blood Donation Camp Request*
        \n*Organization:* ${request.organizationName}
        \n*Proposed Date:* ${request.proposedDate}
        \n*Location:* ${request.venueAddress}
        \n*Contact:* ${request.phone}
        \n\nShared from BloodBank App.`;
      
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Could not share the request.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to permanently delete this camp request?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await firestore().collection('campRequests').doc(request.id).delete();
              Alert.alert("Success", "Your request has been deleted.");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Could not delete the request.");
            }
          } 
        }
      ]
    );
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updatePayload = {
        ...editableData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      await firestore().collection('campRequests').doc(request.id).update(updatePayload);
      Alert.alert("Success", "Your request has been updated.");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Could not update the request.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
        case 'confirmed': return { backgroundColor: THEME.success, text: 'Confirmed' };
        case 'rejected': return { backgroundColor: THEME.danger, text: 'Rejected' };
        case 'pending':
        default: return { backgroundColor: THEME.warning, text: 'Pending Review' };
    }
  };
  const statusStyle = getStatusStyle(request.status);

  // Define which fields to display and if they are editable
  const fieldsToDisplay = [
      { key: 'organizationName', label: 'Organization / Group', editable: true },
      { key: 'contactPerson', label: 'Contact Person', editable: true },
      { key: 'phone', label: 'Contact Phone', editable: true },
      { key: 'proposedDate', label: 'Proposed Date', editable: true, placeholder: 'YYYY-MM-DD' },
      { key: 'venueAddress', label: 'Venue Address', editable: true, multiline: true },
      { key: 'expectedDonors', label: 'Expected Donors', editable: true },
      { key: 'facilities', label: 'Available Facilities', editable: true, multiline: true },
      { key: 'notes', label: 'Additional Notes', editable: true, multiline: true },
  ];

  return (
    <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.topSection}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="chevron-left" size={30} color={THEME.surface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Donation Camp Details</Text>
                    {/* Only show edit button if status is pending */}
                    {request.status === 'pending' ? (
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                            <Icon name={isEditing ? "close-circle-outline" : "pencil-outline"} size={24} color={THEME.surface} />
                        </TouchableOpacity>
                    ) : <View style={{width: 40}} />}
                </View>
                <Image 
                  source={require('../bottomTabs/save_life-02.png')} 
                  style={styles.imageSpace} 
                  resizeMode="contain"
                /> 
            </View>

            <View style={styles.bottomSection}>
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                         <Text style={styles.cardHeaderTitle}>Request Summary</Text>
                         <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                            <Text style={styles.statusText}>{statusStyle.text}</Text>
                        </View>
                    </View>
                    
                    {fieldsToDisplay.map(field => (
                        <EditableField 
                            key={field.key}
                            label={field.label}
                            value={editableData[field.key]}
                            onChange={(val) => handleInputChange(field.key, val)}
                            isEditing={isEditing}
                            multiline={field.multiline}
                            placeholder={field.placeholder}
                        />
                    ))}
                </View>

                {isEditing ? (
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={loading}>
                        {loading ? <ActivityIndicator color={THEME.surface} /> : <Text style={styles.actionButtonText}>Update Request</Text>}
                    </TouchableOpacity>
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

// Reusable Editable Components
const EditableField = ({ label, value, onChange, isEditing, multiline = false, placeholder }) => {
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
                <TextInput 
                    style={[styles.input, multiline && {height: 80, textAlignVertical: 'top'}]}
                    value={String(value || '')}
                    onChangeText={onChange}
                    multiline={multiline}
                    placeholder={placeholder}
                    placeholderTextColor={THEME.textSecondary + '99'}
                />
            ) : (
                <Text style={styles.info}>{value || 'Not specified'}</Text>
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
  topSection: {
    backgroundColor: '#950404ff',
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 20,
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSpace: {
    height: 130,
    width: '100%',
    marginTop: 14,
  },
  infoCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: THEME.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: THEME.surface,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  info: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    backgroundColor: THEME.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: THEME.surface,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  updateButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DonationCampDetailScreen;
