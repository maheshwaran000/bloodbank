// src/navigation/UserStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RequestIcon,HomeIcon,ProfileIcon } from '../screens/AuthScreens/svgComponent';

// Screens
// import UserDashboard from '../screens/AuthScreens/UserScrens/UserDashboard';
// import RequestScreen from '../screens/AuthScreens/bottomTabs/RequestScreen';
import DashboardScreen from '../screens/AuthScreens/bottomTabs/RequestScreen';
import ProfileScreen from '../screens/AuthScreens/bottomTabs/Profile';
import CreatePostScreen from '../screens/AuthScreens/UserScrens/createRequest';
import UserRequestsScreen from '../screens/AuthScreens/UserScrens/userRequests';
import RequestDetailScreen from '../screens/AuthScreens/UserScrens/requestDetailScreen';
import UserPostDetailScreen from '../screens/AuthScreens/UserScrens/userPostDetailScreen';
import RequestCampScreen from '../screens/AuthScreens/UserScrens/requestCampScreen';
import DonationCampDetailScreen from '../screens/AuthScreens/UserScrens/donationCampDetailsSrceen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ACCENT = '#c42727ff';
const INACTIVE = '#950404ff';

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
     <Stack.Screen name="Request" component={DashboardScreen} />
    {/* <Stack.Screen name="Dashboard" component={UserDashboard} /> */}
    <Stack.Screen name="CreatePost" component={CreatePostScreen} />
    <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
    <Stack.Screen name="RequestCamp" component={RequestCampScreen} />

  </Stack.Navigator>
);

// Request Stack
const RequestStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserRequests" component={UserRequestsScreen} />
     <Stack.Screen name="PostDetailsScreen" component={UserPostDetailScreen} />
     <Stack.Screen name="RequestCamp" component={RequestCampScreen} />
     <Stack.Screen name="DonationCampDetail" component={DonationCampDetailScreen} />

  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const UserStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          // iconName = focused ? 'home' : 'home-outline';
           return (
            <HomeIcon
              width={size}
              height={size}
              color={focused ? color : '#950404ff'} // active vs inactive
            />
          );
        } else if (route.name === 'Request') {
           return (
            <RequestIcon
              width={size}
              height={size}
              color={focused ? color : '#950404ff'}
            />
          );
        } else if (route.name === 'Profile') {
           return (
            <ProfileIcon
              width={size}
              height={size}
              color={focused ? color : '#950404ff'}
            />
          );
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
      component={HomeStack}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Request" 
      component={RequestStack}
      options={{ tabBarLabel: 'Request' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export default UserStack;
