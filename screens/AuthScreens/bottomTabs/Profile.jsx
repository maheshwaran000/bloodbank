import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect ,isFocused,useIsFocused} from '@react-navigation/native';

const Profile = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDocRef = firestore().collection('users').doc(currentUser.uid);
        userDocRef.get().then(doc => {
          if (doc.exists) {
            setUser(doc.data());
          }
        });
      }
    }, [])
  );

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      await auth().signOut();
      setLoggingOut(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout Error:', error);
      setLoggingOut(false);
    }
  };

const isFocused = useIsFocused();

const handleLogout = () => {
  if (!isFocused) return; // Prevent alert if screen not in focus

  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: performLogout },
    ],
  );
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name || 'User'}</Text>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5a5f',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});
