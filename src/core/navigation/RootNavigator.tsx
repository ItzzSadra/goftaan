import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MeetingsListScreen } from '../../features/meetings/screens/MeetingsListScreen';
import { MeetingDetailScreen } from '../../features/meetings/screens/MeetingDetailScreen';
import { AddMeetingScreen } from '../../features/meetings/screens/AddMeetingScreen';
import { RecordingScreen } from '../../features/recording/screens/RecordingScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { useAuth } from '../../features/auth/context/AuthContext';
import type { AppStackParamList, AuthStackParamList } from './types';
import { colors } from '../../shared/theme/colors';
import { typography } from '../../shared/theme/typography';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const sharedScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontFamily: typography.bold },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
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
            name="MeetingsList"
            component={MeetingsListScreen}
            options={{ title: 'جلسه‌ها', headerShown: false }}
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
