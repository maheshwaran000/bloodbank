// screens/RequestDetailScreen.js
import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView,
    Platform,
    Linking,
    Image
} from 'react-native';
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
  danger: '#B91C1C',
};

// --- Main Screen ---
const RequestDetailScreen = ({ route, navigation }) => {
  // Use the post data passed from the navigation route
  const { post } = route.params;

  // Helper function to open phone dialer
  const handleCall = () => {
    if (post?.phone) {
      Linking.openURL(`tel:${post.phone}`);
    }
  };

  // Helper function to open WhatsApp
  const handleWhatsApp = () => {
    if (post?.whatsapp || post?.phone) {
      const number = post.whatsapp || post.phone;
      // The phone number needs the country code for WhatsApp
      const formattedNumber = number.startsWith('+') ? number : `+${number}`;
      Linking.openURL(`whatsapp://send?phone=${formattedNumber}`);
    }
  };

  const isDonor = post.type === 'donor';

  return (
    <SafeAreaView style={styles.root}>
        {/* Top Red Container (User's changes are preserved) */}
        <View style={styles.topSection}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={30} color={THEME.surface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isDonor ? 'Donor Details' : 'Request Details'}</Text>
                <View style={{ width: 40 }} />
            </View>
             <Image 
                source={require('../bottomTabs/save_life-02.png')} 
                style={styles.imageSpace} 
                resizeMode="contain"
              /> 
        </View>

        {/* Bottom White Container */}
        <ScrollView style={styles.bottomSection} contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                    <View style={[styles.bloodGroupPill, {backgroundColor: isDonor ? THEME.success : THEME.danger}]}>
                        <Text style={styles.bloodGroupText}>{post.bloodGroup}</Text>
                    </View>
                    <Text style={styles.urgencyText}>{post.urgency}</Text>
                </View>
                
                {/* InfoRows now use a default icon */}
                <InfoRow label="Name" value={post.name} />
                <InfoRow label="Location" value={post.location} />
                <InfoRow label="Purpose" value={post.purpose || 'Not specified'} isVisible={!isDonor} />
                <InfoRow label="Posted" value={new Date(post.createdAt).toLocaleDateString()} />
                
                {post.notes ? (
                    <>
                        <Text style={styles.notesLabel}>Additional Notes</Text>
                        <Text style={styles.notesText}>{post.notes}</Text>
                    </>
                ) : null}
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleCall}>
                    <Icon name="phone-outline" size={20} color={THEME.surface} />
                    <Text style={styles.actionButtonText}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleWhatsApp}>
                    <Icon name="whatsapp" size={20} color={THEME.primary} />
                    <Text style={[styles.actionButtonText, { color: THEME.primary }]}>WhatsApp</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
};

// Reusable component for displaying a row of information
const InfoRow = ({ label, value, isVisible = true }) => {
    if (!isVisible || !value) return null;
    return (
        <View style={styles.infoRow}>
            <Icon name="circle-medium" size={24} color={THEME.primary} style={styles.infoIcon} />
            <View>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.info}>{value}</Text>
            </View>
        </View>
    );
};

// --- STYLES ---
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    height: 140,
    width: '100%',
  },
  infoCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 20,
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
    paddingBottom: 16,
    marginBottom: 16,
  },
  bloodGroupPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bloodGroupText: {
    color: THEME.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.danger,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  info: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    flexShrink: 1, // Allows text to wrap
  },
  notesLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 10,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: THEME.text,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: THEME.surface,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RequestDetailScreen;
