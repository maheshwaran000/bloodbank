// screens/DashboardScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  Image,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- THEME ---
const THEME = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  primary: "#C81E1E",
  primaryLight: "#FEE2E2",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#16A34A",
  danger: "#B91C1C",
};

// --- Helper Functions ---
function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// --- UI Components ---
// This component is from your existing code and is unchanged
const DashboardHeader = ({ userName }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerWelcome}>Hello, {userName}!</Text>
      <Text style={styles.headerSubtitle}>Ready to save a life today?</Text>
    </View>
    <TouchableOpacity style={styles.profileChip}>
      {/* <Icon name="account-outline" size={24} color={THEME.primary} /> */}
    </TouchableOpacity>
  </View>
);

// This component is from your existing code and is unchanged
const ActionRow = ({ icon, title, subtitle, onPress, isReversed = false }) => (
    <TouchableOpacity 
      style={[styles.actionRow, { flexDirection: isReversed ? 'row-reverse' : 'row' }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.actionIconContainer}>
        <Icon name={icon} size={40} color={THEME.primary} />
      </View>
      <View style={styles.actionButton}>
        <Text style={styles.actionButtonTitle}>{title}</Text>
        <Text style={styles.actionButtonSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
);

// --- NEW, REDESIGNED FEED CARD ---
const FeedCard = ({ post, onPress }) => {
  const isDonor = post.type === 'donor';
  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.9}>
      {/* Left Icon Container */}
      <View style={styles.feedCardIconContainer}>
        <Icon name={isDonor ? "account-heart-outline" : "water-plus-outline"} size={28} color={isDonor ? THEME.success : THEME.danger} />
        <Text style={styles.feedCardBloodGroup}>{post.bloodGroup}</Text>
      </View>

      {/* Center Info Container */}
      <View style={styles.feedCardInfo}>
        <Text style={styles.feedCardName}>{post.name}</Text>
        <Text style={styles.feedCardMeta}>
          {isDonor ? 'Wants to Donate' : 'Needs Blood'} • {timeAgo(post.createdAt)}
        </Text>
      </View>

      {/* Right Chevron Icon */}
      <Icon name="chevron-right" size={24} color={THEME.textSecondary} />
    </TouchableOpacity>
  );
};

const Pill = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.pill, selected && styles.pillActive]}
  >
    <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);


// --- Main Dashboard Screen (Logic is unchanged) ---
export default function DashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) { setLoading(false); return; }

    const userSub = firestore().collection("users").doc(currentUser.uid).onSnapshot(doc => {
      setUserData(doc.exists ? doc.data() : null);
    });

    const postsQuery = firestore().collection("requests").orderBy("createdAt", "desc").limit(50);
    const postsSub = postsQuery.onSnapshot(snap => {
      const fetchedPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
      }));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts: ", error);
      setLoading(false);
    });

    return () => { userSub(); postsSub(); };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const clearFilters = () => {
    setBloodGroupFilter("");
    setUrgencyFilter("");
  };

  const filteredPosts = useMemo(() => {
    let items = [...posts];
    if (bloodGroupFilter) {
      items = items.filter(p => p.bloodGroup?.toUpperCase() === bloodGroupFilter.toUpperCase());
    }
    if (urgencyFilter) {
      items = items.filter(p => p.urgency === urgencyFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [posts, query, bloodGroupFilter, urgencyFilter]);

  const userName = userData?.name || "User";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard post={item} onPress={() => navigation.navigate("RequestDetail", { post: item })} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
        ListHeaderComponent={
          <>
            {/* This top section is from your code and is unchanged */}
            <View style={styles.topSection}>
              <DashboardHeader userName={userName} />
              <Image 
                source={require('./save_life-02.png')} 
                style={styles.imageSpace} 
                resizeMode="contain"
              /> 
              <View style={styles.actionsContainer}>
                <ActionRow 
                  // icon="water-plus-outline"
                  title="I Need Blood" 
                  subtitle="Create a request" 
                  onPress={() => navigation.navigate("CreatePost", { type: 'receiver' })}
                />
                <ActionRow 
                  // icon="account-heart-outline" 
                  title="I Want to Donate" 
                  subtitle="Find requests" 
                  onPress={() => navigation.navigate("CreatePost", { type: 'receiver' })}
                  isReversed
                />
              </View>
            </View>

            {/* The bottom section starts here, with the new styles */}
            <View style={styles.bottomSection}>
              <View style={styles.searchBar}>
                <Icon name="magnify" size={22} color={THEME.textSecondary} style={{marginRight: 8}}/>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or location..."
                  placeholderTextColor={THEME.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                />
              </View>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>Live Feed</Text>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                  <Icon name="tune-variant" size={16} color={THEME.primary} />
                  <Text style={styles.feedFilterText}>Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox-outline" size={48} color={THEME.textSecondary} />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate("RequestCamp")}>
           <Text style={styles.new}>Apply for Blood Donation Camp</Text>
      </TouchableOpacity>

      <Modal transparent animationType="slide" visible={showFilters} onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowFilters(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filters</Text>
          <Text style={styles.groupLabel}>Blood Group</Text>
          <View style={styles.rowWrap}>
            {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
              <Pill key={g} label={g} selected={bloodGroupFilter === g} onPress={() => setBloodGroupFilter(bloodGroupFilter === g ? "" : g)} />
            ))}
          </View>
          <Text style={styles.groupLabel}>Urgency</Text>
          <View style={styles.rowWrap}>
            {["normal", "soon", "urgent", "critical"].map((u) => (
              <Pill key={u} label={u.charAt(0).toUpperCase() + u.slice(1)} selected={urgencyFilter === u} onPress={() => setUrgencyFilter(urgencyFilter === u ? "" : u)} />
            ))}
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={clearFilters} activeOpacity={0.9}>
              <Text style={styles.ghostText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)} activeOpacity={0.9}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLESHEET (Top section is unchanged, bottom section is updated) ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  listContainer: { paddingBottom: 100 },
  topSection: {
    backgroundColor:'#950404ff',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  bottomSection: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerWelcome: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: THEME.surface 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: 'rgba(255, 255, 255, 0.8)', 
    marginTop: 4 
  },
  profileChip: {
    width: 32,
    height: 32,
    borderRadius: 26,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageSpace: {
    height: 140,
    width: '100%',
  },
  actionsContainer: {
    marginTop: 4,
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 12,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.surface,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 32,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: THEME.text,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  feedTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  feedFilterText: { fontSize: 14, fontWeight: 'bold', color: THEME.primary, marginLeft: 6 },
  
  // --- NEW FEED CARD STYLES ---
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16, // Add horizontal margin to cards
    borderWidth: 1,
    borderColor: THEME.border,
  },
  feedCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  feedCardBloodGroup: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: THEME.primary,
    color: THEME.surface,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden', // Ensures the border radius is applied
  },
  feedCardInfo: {
    flex: 1,
  },
  feedCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
  },
  feedCardMeta: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  // --- END OF NEW STYLES ---

  fab: {
    position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 40 : 20,
    width:"auto", height: 40, borderRadius: 30, backgroundColor:'#aa0606ff',
    justifyContent: 'center', alignItems: 'center', elevation: 8,paddingLeft:15,paddingRight:15,
    shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  new:{
    color:'#fff',
    fontSize:15,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
  emptyContainer: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: THEME.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  // Filter Sheet Styles
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: THEME.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 10,
  },
  sheetHandle: { alignSelf: "center", width: 48, height: 5, borderRadius: 2.5, backgroundColor: THEME.border, marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: THEME.text, marginBottom: 4, textAlign: 'center' },
  groupLabel: { fontWeight: "700", color: THEME.textSecondary, marginTop: 10, marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    height: 38, paddingHorizontal: 16, borderRadius: 19,
    backgroundColor: THEME.background, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: THEME.border,
  },
  pillActive: { backgroundColor: THEME.primaryLight, borderColor: THEME.primary },
  pillText: { color: THEME.text, fontWeight: "600" },
  pillTextActive: { color: THEME.primary, fontWeight: "700" },
  sheetActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, borderTopWidth: 1, borderColor: THEME.border, paddingTop: 16 },
  ghostBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: THEME.background, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: THEME.border, marginRight: 8,
  },
  ghostText: { color: THEME.text, fontWeight: "bold" },
  applyBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: THEME.primary, alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  applyText: { color: "#FFFFFF", fontWeight: "bold" },
});
