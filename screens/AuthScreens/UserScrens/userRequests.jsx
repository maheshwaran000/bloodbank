// screens/UserRequestsScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Alert,
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
  danger: '#B91C1C',
};

// --- Helper Functions (Unchanged) ---
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- UI Components (Unchanged) ---
function PostCard({ post, onPress }) {
  const isDonor = post.type === 'donor';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.marker, { backgroundColor: isDonor ? THEME.success : THEME.danger }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>
            {isDonor ? `Donor • ${post.bloodGroup}` : `Need • ${post.bloodGroup}`}
          </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>{post.location}</Text>
        {!!post.notes && <Text numberOfLines={2} style={styles.notes}>{post.notes}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function DonationHistorySection({ donationHistory }) {
  const items = Array.isArray(donationHistory) ? donationHistory : [];
  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>Donation History</Text>
      {items.length === 0 ? (
        <Text style={styles.historyEmpty}>No donations recorded yet.</Text>
      ) : (
        items.map((it, idx) => (
          <View key={idx} style={styles.historyRow}>
            <Icon name="water-check" size={16} color={THEME.success} />
            <Text style={styles.historyText}>{formatHistoryItem(it)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function formatHistoryItem(it) {
  if (!it) return 'Donation';
  if (typeof it === 'string') return it;
  const date = it.date?.toDate ? it.date.toDate() : (it.date ? new Date(it.date) : null);
  const when = date ? date.toLocaleDateString() : '';
  const place = it.place || it.hospital || '';
  return [when, place].filter(Boolean).join(' at ') || 'Donation Recorded';
}

// --- Main Screen ---
export default function UserRequestsScreen({ navigation }) {
  // --- All State and Logic Preserved ---
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        navigation?.replace?.('Login');
      }
    });
    return () => unsub();
  }, [navigation]);

  const fetchAll = useCallback(async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    // No setLoading(true) here to allow for background refresh
    try {
      const requestsSnapshot = await firestore()
        .collection('requests')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();
      const rows = requestsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt ? docSnap.data().createdAt.toDate() : new Date(),
      }));
      setPosts(rows);

      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      setDonationHistory(userData?.donationHistory || []);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load data');
    } finally {
      setLoading(false); // Set loading false after fetch
    }
  }, []);

  useEffect(() => {
    if (uid) {
      fetchAll();
    }
  }, [uid, fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // --- NEW LAYOUT ---
  return (
    <SafeAreaView style={styles.root}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={THEME.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetailsScreen', { post: item })}
            />
          )}
          ListHeaderComponent={
            <>
              <View style={styles.topSection}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>My Posts & History</Text>
                  <View style={{ width: 40 }} />
                </View>
                 <Image 
                  source={require('../bottomTabs/save_life-02.png')} 
                  style={styles.imageSpace} 
                  resizeMode="contain"
                /> 
              </View>
              <View style={styles.bottomSection}>
                <DonationHistorySection donationHistory={donationHistory} />
                <Text style={styles.listHeaderTitle}>My Posts</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-document-outline" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyTitle}>You have no posts yet</Text>
              <Text style={styles.emptySubtitle}>Tap the '+' button to create your first request or donor post.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.9}
      >
        <Text style={styles.new}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- NEW STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  topSection: {
    backgroundColor: '#950404ff',
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingLeft:30,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 120,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 12,
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  marker: {
    width: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
  },
  time: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  meta: {
    marginTop: 4,
    color: THEME.textSecondary,
  },
  notes: {
    marginTop: 8,
    color: THEME.text,
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8,
  },
  historyEmpty: {
    color: THEME.textSecondary,
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  historyText: {
    color: THEME.text,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#aa0606ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  new:{
    color:'#fff',
    fontSize:25,
  },
    imageSpace: {
    height: 130,
    width: '100%',
    marginTop: 14,
  },
});
