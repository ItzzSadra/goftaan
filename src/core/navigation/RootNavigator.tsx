import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MeetingsListScreen } from '../../features/meetings/screens/MeetingsListScreen';
import { MeetingDetailScreen } from '../../features/meetings/screens/MeetingDetailScreen';
import { AddMeetingScreen } from '../../features/meetings/screens/AddMeetingScreen';
import { RecordingScreen } from '../../features/recording/screens/RecordingScreen';
import type { RootStackParamList } from './types';
import { colors } from '../../shared/theme/colors';
import { typography } from '../../shared/theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontFamily: typography.bold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="MeetingsList"
          component={MeetingsListScreen}
          options={{ title: 'جلسه‌ها', headerShown: false }}
        />
        <Stack.Screen
          name="AddMeeting"
          component={AddMeetingScreen}
          options={{ title: 'افزودن جلسه' }}
        />
        <Stack.Screen
          name="MeetingDetail"
          component={MeetingDetailScreen}
          options={{ title: 'جزئیات جلسه' }}
        />
        <Stack.Screen
          name="Recording"
          component={RecordingScreen}
          options={{ title: 'ضبط صدا' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
