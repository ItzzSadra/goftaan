import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import { MeetingCard } from '../../features/meetings/components/MeetingCard';
import { useMeetings } from '../../features/meetings/hooks/useMeetings';
import { useAuth } from '../../features/auth/context/AuthContext';
import type { AppStackParamList, HomeTabParamList } from '../../navigation/types';
import { CenteredState } from '../../components/CenteredState';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';
import { settingsService } from '../../features/settings/services/settingsService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'MeetingsList'>,
  NativeStackScreenProps<AppStackParamList>
>;

export const MeetingsListScreen = ({ navigation }: Props) => {
  const { status, meetings, errorMessage, isRefreshing, refresh } = useMeetings();
  const { logout } = useAuth();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [compactCardsEnabled, setCompactCardsEnabled] = useState(false);

  useEffect(() => {
    const loadAppSettings = async () => {
      const appSettings = await settingsService.getAppSettings();
      setAutoRefreshEnabled(appSettings.autoRefreshMeetings);
      setCompactCardsEnabled(appSettings.compactCards);
    };

    void loadAppSettings();
  }, []);

  const runDeleteMeeting = (meetingId: string) => {
    const remove = async () => {
      try {
        await manualMeetingsService.removeMeeting(meetingId);
        await refresh();
      } catch {
        Alert.alert('خطا', 'حذف جلسه انجام نشد. دوباره تلاش کنید.');
      }
    };

    void remove();
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('آیا از حذف این جلسه مطمئن هستید؟');
      if (ok) {
        runDeleteMeeting(meetingId);
      }
      return;
    }

    Alert.alert('حذف جلسه', 'آیا از حذف این جلسه مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => runDeleteMeeting(meetingId),
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (!autoRefreshEnabled) {
        return;
      }
      void refresh();
    }, [autoRefreshEnabled, refresh]),
  );

  const emptyState = useMemo(() => {
    if (status === 'permissionDenied' && meetings.length === 0) {
      return (
        <CenteredState
          title="دسترسی به تقویم لازم است"
          description="دسترسی تقویم را از تنظیمات فعال کنید یا جلسه دستی اضافه کنید."
          action={
            <View style={styles.stateActionsRow}>
              <Pressable style={styles.secondaryActionButton} onPress={() => navigation.navigate('AddMeeting')}>
                <Text style={styles.secondaryActionText}>افزودن جلسه</Text>
              </Pressable>
              <Pressable style={styles.primaryActionButton} onPress={() => void Linking.openSettings()}>
                <Text style={styles.primaryActionText}>باز کردن تنظیمات</Text>
              </Pressable>
            </View>
          }
        />
      );
    }

    if (status === 'error') {
      return (
        <CenteredState
          title="بارگذاری جلسه‌ها ناموفق بود"
          description={errorMessage || 'برای اتصال دوباره به تقویم، مجددا تلاش کنید.'}
          action={
            <Pressable style={styles.primaryActionButton} onPress={() => void refresh()}>
              <Text style={styles.primaryActionText}>تلاش مجدد</Text>
            </Pressable>
          }
        />
      );
    }

    if ((status === 'ready' || status === 'permissionDenied') && meetings.length === 0) {
      return (
        <CenteredState
          title="جلسه‌ای در راه نیست"
          description="یک جلسه دستی اضافه کنید یا رویدادهای ۷ روز آینده را تازه‌سازی کنید."
          action={
            <View style={styles.stateActionsRow}>
              <Pressable style={styles.secondaryActionButton} onPress={() => navigation.navigate('AddMeeting')}>
                <Text style={styles.secondaryActionText}>افزودن جلسه</Text>
              </Pressable>
              <Pressable style={styles.primaryActionButton} onPress={() => void refresh()}>
                <Text style={styles.primaryActionText}>تازه‌سازی</Text>
              </Pressable>
            </View>
          }
        />
      );
    }

    return null;
  }, [errorMessage, meetings.length, navigation, refresh, status]);

  const hasList = meetings.length > 0 && (status === 'ready' || status === 'permissionDenied');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.kicker}>داشبورد</Text>
            <Text style={styles.title}>جلسه‌های پیش رو</Text>
          </View>
          <View style={styles.counterChip}>
            <Text style={styles.counterChipText}>{meetings.length} جلسه</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>جلسه موردنظر را انتخاب کنید تا ضبط، پیاده‌سازی و خلاصه را شروع کنید.</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddMeeting')}>
            <Text style={styles.addButtonText}>+ افزودن جلسه</Text>
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
            <Text style={styles.refreshButtonText}>تازه‌سازی</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={() => void logout()}>
            <Text style={styles.logoutButtonText}>خروج</Text>
          </Pressable>
        </View>
      </View>

      {status === 'loading' && meetings.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}

      {hasList ? (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MeetingCard
              meeting={item}
              compact={compactCardsEnabled}
              onPress={(meeting) => navigation.navigate('MeetingDetail', { meeting })}
              onDeletePress={
                item.source === 'manual'
                  ? (meeting) => {
                      handleDeleteMeeting(meeting.id);
                    }
                  : undefined
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => void refresh()}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {!hasList ? emptyState : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    padding: 18,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  counterChip: {
    borderWidth: 1,
    borderColor: '#BFD9D6',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  counterChipText: {
    color: colors.accentDark,
    fontSize: 12,
    fontFamily: typography.bold,
  },
  kicker: {
    fontSize: 11,
    color: colors.accentDark,
    fontFamily: typography.bold,
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 30,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  headerActions: {
    marginTop: 8,
    flexDirection: 'row-reverse',
    gap: 10,
    flexWrap: 'wrap',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 14,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F7F3E9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#E7B8B4',
    backgroundColor: '#FFF2F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.danger,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 26,
  },
  separator: {
    height: 12,
  },
  stateActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  primaryActionButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 14,
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
  },
});
