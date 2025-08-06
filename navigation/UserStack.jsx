// src/navigation/UserStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import UserDashboard, { DashboardScreen } from '../screens/AuthScreens/UserScrens/UserDashboard';
// import RequestScreen from '../screens/AuthScreens/UserScrens/RequestScreen';
import RequestScreen from '../screens/AuthScreens/bottomTabs/RequestScreen';
// import ProfileScreen from '../screens/AuthScreens/UserScrens/ProfileScreen';
import ProfileScreen from '../screens/AuthScreens/bottomTabs/Profile';

const Tab = createBottomTabNavigator();

const ACCENT = '#4F46E5';
const INACTIVE = '#777';

const UserStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Request') {
          iconName = focused ? 'plus-box' : 'plus-box-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'account-circle' : 'account-circle-outline';
        }
        
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: ACCENT,
      tabBarInactiveTintColor: INACTIVE,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={DashboardScreen}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Request" 
      component={RequestScreen}
      options={{ tabBarLabel: 'Request' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export default UserStack;
