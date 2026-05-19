import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants';
import IngestorsScreen from '../screens/IngestorsScreen';
import IngestorDetailScreen from '../screens/IngestorDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import { BottomTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function IngestorsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Main"
        component={IngestorsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IngestorDetail"
        component={IngestorDetailScreen}
        options={({ route }) => ({
          title: (route.params as { ingestor: { name: string } }).ingestor.name,
        })}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarLabel: 'Chat IA',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 2, color, fontWeight: '700' }}>AI</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Ingestors"
          component={IngestorsStack}
          options={{
            tabBarLabel: 'Ingestores',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 2, color, fontWeight: '700' }}>DB</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
