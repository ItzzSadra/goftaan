import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MeetingCard } from '../components/MeetingCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../../auth/context/AuthContext';
import type { AppStackParamList } from '../../../core/navigation/types';
import { CenteredState } from '../../../shared/components/CenteredState';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingsList'>;

export const MeetingsListScreen = ({ navigation }: Props) => {
  const { status, meetings, errorMessage, isRefreshing, refresh } = useMeetings();
  const { logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
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
        <Text style={styles.kicker}>گفتان</Text>
        <Text style={styles.title}>جلسه‌های پیش رو</Text>
        <Text style={styles.subtitle}>یک جلسه را برای ضبط، پیاده‌سازی و خلاصه انتخاب کنید.</Text>
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
              onPress={(meeting) => navigation.navigate('MeetingDetail', { meeting })}
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
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.backgroundAccent,
    padding: 16,
    gap: 6,
  },
  kicker: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: typography.bold,
    letterSpacing: 0.8,
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
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
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
    backgroundColor: colors.backgroundAccent,
    borderRadius: 12,
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
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    borderRadius: 12,
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
    paddingBottom: 18,
  },
  separator: {
    height: 10,
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
