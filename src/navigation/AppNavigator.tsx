import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import ShareIntentModal from '../components/ShareIntentModal';
import IngestorsScreen from '../screens/IngestorsScreen';
import IngestorDetailScreen from '../screens/IngestorDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
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

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const sharedFile = hasShareIntent ? (shareIntent?.files?.[0] ?? null) : null;

  return (
    <>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 8,
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
    {sharedFile && (
      <ShareIntentModal
        file={{
          path: sharedFile.path,
          fileName: sharedFile.fileName,
          mimeType: sharedFile.mimeType,
          size: sharedFile.size ?? undefined,
        }}
        onDismiss={resetShareIntent}
      />
    )}
    </>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (!session) return <LoginScreen />;

  return <TabNavigator />;
}
