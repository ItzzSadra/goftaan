import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { MeetingsListScreen } from '../screens/meetings/MeetingsListScreen';
import { MeetingDetailScreen } from '../screens/meetings/MeetingDetailScreen';
import { AddMeetingScreen } from '../screens/meetings/AddMeetingScreen';
import { RecordingScreen } from '../screens/recording/RecordingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useAuth } from '../features/auth/context/AuthContext';
import type { AppStackParamList, AuthStackParamList, HomeTabParamList } from './types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeTabs = createBottomTabNavigator<HomeTabParamList>();

const sharedScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontFamily: typography.bold },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

const tabsScreenOptions = ({ route }: { route: { name: keyof HomeTabParamList } }) => ({
  headerShown: false,
  tabBarStyle: {
    position: 'absolute' as const,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 66,
    paddingBottom: 8,
    paddingTop: 7,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tabBarLabelStyle: {
    fontFamily: typography.bold,
    fontSize: 11,
  },
  tabBarIcon: ({ color, size }: { color: string; size: number }) => {
    const iconMap: Record<keyof HomeTabParamList, ComponentProps<typeof Ionicons>['name']> = {
      MeetingsList: 'calendar-outline',
      Analytics: 'stats-chart-outline',
      Settings: 'settings-outline',
    };

    return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
  },
  tabBarActiveTintColor: colors.accentDark,
  tabBarInactiveTintColor: colors.textSecondary,
});

const HomeTabsNavigator = () => {
  return (
    <HomeTabs.Navigator screenOptions={tabsScreenOptions}>
      <HomeTabs.Screen
        name="MeetingsList"
        component={MeetingsListScreen}
        options={{ title: 'جلسه‌ها', tabBarLabel: 'جلسه‌ها' }}
      />
      <HomeTabs.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'تحلیل', tabBarLabel: 'تحلیل' }}
      />
      <HomeTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'تنظیمات', tabBarLabel: 'تنظیمات' }}
      />
    </HomeTabs.Navigator>
  );
};

export const RootNavigator = () => {
  const { isReady, isLoggedIn } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppStack.Navigator screenOptions={sharedScreenOptions}>
          <AppStack.Screen
            name="HomeTabs"
            component={HomeTabsNavigator}
            options={{ headerShown: false }}
          />
          <AppStack.Screen
            name="AddMeeting"
            component={AddMeetingScreen}
            options={{ title: 'افزودن جلسه' }}
          />
          <AppStack.Screen
            name="MeetingDetail"
            component={MeetingDetailScreen}
            options={{ title: 'جزئیات جلسه' }}
          />
          <AppStack.Screen
            name="Recording"
            component={RecordingScreen}
            options={{ title: 'ضبط صدا' }}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={sharedScreenOptions}>
          <AuthStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'ورود', headerShown: false }}
          />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
