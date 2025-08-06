import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const THEME = {
  primary: '#D90429',
  onPrimary: '#FFFFFF',
  black: '#111827',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  subtle: '#F2F4F8',
  green: '#10B981',
  red: '#EF233C',
  border: '#EAECEF',
};

const TABS = ['Feed', 'Donors', 'Requests'];

const DEFAULT_POSTS = [
  {
    id: 'd1',
    type: 'receiver',
    name: 'Rahul Verma',
    bloodGroup: 'O+',
    location: 'City Hospital, Pune',
    urgency: 'urgent',
    notes: 'Surgery this evening. Need O+ urgently.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd2',
    type: 'donor',
    name: 'Ananya Sharma',
    bloodGroup: 'A-',
    location: 'Baner, Pune',
    urgency: 'soon',
    notes: 'Available after 6 PM. Last donation 5 months ago.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

function urgencyStyle(u) {
  switch (u) {
    case 'normal':
      return { bg: '#ECF6FF', txt: '#0C4A6E' };
    case 'soon':
      return { bg: '#FFF3E6', txt: '#9A3412' };
    case 'urgent':
      return { bg: '#FFE8EA', txt: '#7F1D1D' };
    case 'critical':
      return { bg: '#FFE6EB', txt: '#7A0E26' };
    default:
      return { bg: '#EEF2F7', txt: THEME.muted };
  }
}

// Removed props onCreatePost and onOpenPost
export default function DashboardScreen() {
  const navigation = useNavigation(); // Get the navigation object with the hook
  const [tab, setTab] = useState('Feed');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState(''); // 'donor' | 'receiver' | ''
  const [groupFilter, setGroupFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState(''); // normal|soon|urgent|critical|''
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState([]); // posts from Firestore
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.error('No authenticated user found for DashboardScreen.');
      setLoading(false);
      return;
    }

    // Set up a real-time listener for the user's document
    const userDocRef = firestore().collection('users').doc(currentUser.uid);
    const unsubscribeUser = userDocRef.onSnapshot(
      (docSnapshot) => {
        if (docSnapshot.exists) {
          setUserData(docSnapshot.data());
        } else {
          console.warn('User document does not exist for UID:', currentUser.uid);
          setUserData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
        setUserData(null);
      },
    );

    // Set up real-time listener for posts
    const postsQuery = firestore()
      .collection('requests')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const unsubscribePosts = postsQuery.onSnapshot(
      (querySnapshot) => {
        const rows = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data() || {};
          rows.push({
            id: doc.id,
            type: d.type || 'receiver',
            name: d.name || 'Unknown',
            bloodGroup: d.bloodGroup || 'O+',
            location: d.location || 'Unknown',
            urgency: d.urgency || 'normal',
            notes: d.notes || '',
            createdAt:
              (d.createdAt && d.createdAt.toDate && d.createdAt.toDate().toISOString()) ||
              new Date().toISOString(),
          });
        });
        setFetched(rows);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      },
    );

    // Clean up listeners
    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, []);

  const source = fetched.length > 0 ? fetched : DEFAULT_POSTS;

  const filtered = useMemo(() => {
    let items = source.slice();

    if (tab === 'Donors') items = items.filter((p) => p.type === 'donor');
    if (tab === 'Requests') items = items.filter((p) => p.type === 'receiver');

    if (typeFilter) items = items.filter((p) => p.type === typeFilter);
    if (groupFilter)
      items = items.filter(
        (p) => (p.bloodGroup || '').toUpperCase() === groupFilter.toUpperCase(),
      );
    if (urgencyFilter) items = items.filter((p) => (p.urgency || '') === urgencyFilter);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (p) =>
          (p.location || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.name || '').toLowerCase().includes(q) ||
          (p.bloodGroup || '').toLowerCase() === q,
      );
    }
    return items;
  }, [source, tab, typeFilter, groupFilter, urgencyFilter, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Since we're using onSnapshot, data is real-time; refresh might not be needed, but for consistency
    setRefreshing(false);
  }, []);

  const clearFilters = () => {
    setTypeFilter('');
    setGroupFilter('');
    setUrgencyFilter('');
  };

  const userName = userData?.name || 'User';

  const FiltersSheet = (
    <Modal transparent animationType="slide" visible={showFilters} onRequestClose={() => setShowFilters(false)}>
      <Pressable style={styles.sheetBackdrop} onPress={() => setShowFilters(false)} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Filters</Text>

        <Text style={styles.groupLabel}>Type</Text>
        <View style={styles.rowWrap}>
          <Pill
            label="Donor"
            selected={typeFilter === 'donor'}
            onPress={() => setTypeFilter(typeFilter === 'donor' ? '' : 'donor')}
          />
          <Pill
            label="Receiver"
            selected={typeFilter === 'receiver'}
            onPress={() => setTypeFilter(typeFilter === 'receiver' ? '' : 'receiver')}
          />
        </View>

        <Text style={styles.groupLabel}>Blood group</Text>
        <View style={styles.rowWrap}>
          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
            <Pill
              key={g}
              label={g}
              selected={groupFilter === g}
              onPress={() => setGroupFilter(groupFilter === g ? '' : g)}
            />
          ))}
        </View>

        <Text style={styles.groupLabel}>Urgency</Text>
        <View style={styles.rowWrap}>
          {['normal', 'soon', 'urgent', 'critical'].map((u) => (
            <Pill
              key={u}
              label={u[0].toUpperCase() + u.slice(1)}
              selected={urgencyFilter === u}
              onPress={() => setUrgencyFilter(urgencyFilter === u ? '' : u)}
            />
          ))}
        </View>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.ghostBtn} onPress={clearFilters}>
            <Text style={styles.ghostText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={THEME.primary} />
        <Text style={styles.loadingText}>Loading profile and posts…</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load user profile.</Text>
        <Text style={styles.errorSubText}>Please try again or contact support.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Brand Bar with User Greeting */}
      <View style={styles.brandBar}>
        <View style={styles.logoWrap}>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.brandText}>BloodBank</Text>
        <Text style={styles.userGreeting}>Hello, {userName}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location, notes, or group"
          placeholderTextColor={THEME.muted + '99'}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearX}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buttons row under search: Feed / Donors / Requests + Filters */}
      <View style={styles.topRow}>
        <Segment value={tab} onChange={setTab} options={TABS} />
        <TouchableOpacity style={styles.filtersBtn} onPress={() => setShowFilters(true)} activeOpacity={0.9}>
          <Text style={styles.filtersIcon}></Text>
          <Text style={styles.filtersText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          // Direct navigation call inside the onPress handler
          <Card post={item} onPress={() => navigation.navigate('PostDetailsScreen', { post: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptyText}>Try changing filters or create a post.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('CreatePost')} // Direct navigation call
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabText}>Create Post</Text>
      </TouchableOpacity>

      {FiltersSheet}
    </SafeAreaView>
  );
}

/* UI Components */

function Segment({ value, onChange, options }) {
  return (
    <View style={styles.segment}>
      {options.map((op) => {
        const active = value === op;
        return (
          <TouchableOpacity
            key={op}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
            onPress={() => onChange(op)}
            activeOpacity={0.9}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{op}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Card({ post, onPress }) {
  const accent = post.type === 'donor' ? THEME.green : THEME.red;
  const u = urgencyStyle(post.urgency);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
      <View style={[styles.marker, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>
            {post.type === 'donor' ? `Donor • ${post.bloodGroup}` : `Need • ${post.bloodGroup}`}
          </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Text style={styles.cardMeta}>{(post.name || 'Unknown')} • {(post.location || 'Unknown')}</Text>
        <View style={styles.badges}>
          <Badge label={post.type === 'donor' ? 'Donor' : 'Receiver'} color={accent} filled />
          <Badge label={(post.bloodGroup || '').toUpperCase()} />
          <Badge label={(post.urgency || '').toUpperCase()} bg={u.bg} color={u.txt} />
        </View>
        {!!post.notes && <Text numberOfLines={2} style={styles.notes}>{post.notes}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Text style={styles.icon}>↗︎</Text>
          <Text style={styles.icon}>☆</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Badge({ label, color = THEME.muted, bg = THEME.subtle, filled }) {
  const bgc = filled ? color : bg;
  const txt = filled ? '#FFFFFF' : color;
  return (
    <View style={[styles.badge, { backgroundColor: bgc }]}>
      <Text style={[styles.badgeText, { color: txt }]}>{label}</Text>
    </View>
  );
}

function Pill({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.pill, selected && styles.pillActive]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* Styles */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg, paddingTop: 20 },

  // Brand
  brandBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  logoWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFFAA' },
  brandText: { fontSize: 23, fontWeight: '600', color: THEME.text },
  userGreeting: { fontSize: 16, fontWeight: '600', color: '#1E90FF', marginLeft: 'auto' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  searchIcon: { fontSize: 18, color: THEME.muted, marginRight: 8 },
  searchInput: { flex: 1, color: THEME.text },
  clearX: { fontSize: 16, color: THEME.muted, marginLeft: 8 },

  // Row under search
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  segment: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: 22,
    padding: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: THEME.black,
  },
  segmentText: { color: THEME.muted, fontWeight: '700' },
  segmentTextActive: { color: '#FFFFFF' },

  filtersBtn: {
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: THEME.surface,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  filtersIcon: { fontSize: 16 },
  filtersText: { fontWeight: '800', color: THEME.text },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  marker: { width: 6, borderRadius: 3, backgroundColor: THEME.red, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  time: { fontSize: 12, color: THEME.muted },
  cardMeta: { marginTop: 4, color: THEME.muted },
  badges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  notes: { marginTop: 8, color: THEME.text, lineHeight: 20 },

  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  primaryBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: THEME.subtle,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  secondaryBtnText: { color: THEME.black, fontWeight: '800' },
  icon: { marginLeft: 10, color: THEME.muted, fontSize: 16 },

  // Empty / Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: THEME.muted },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },
  emptyText: { marginTop: 6, color: THEME.muted, textAlign: 'center' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#B91C1C',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 22, marginRight: 2 },
  fabText: { color: '#FFFFFF', fontWeight: '800' },

  // Filters sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 4 },
  groupLabel: { fontWeight: '700', color: THEME.muted, marginTop: 6, marginBottom: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: THEME.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: { backgroundColor: THEME.black },
  pillText: { color: THEME.text, fontWeight: '700' },
  pillTextActive: { color: '#FFFFFF' },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ghostBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: THEME.black, fontWeight: '800' },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#FFFFFF', fontWeight: '800' },
});