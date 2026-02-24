import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Calendar from 'expo-calendar';

import type { RootStackParamList } from '../../../core/navigation/types';
import { formatMeetingTime } from '../../../shared/utils/date';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { manualMeetingsService } from '../services/manualMeetingsService';

type Props = NativeStackScreenProps<RootStackParamList, 'MeetingDetail'>;

export const MeetingDetailScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;

  const confirmDelete = () => {
    Alert.alert('حذف جلسه', 'آیا از حذف این جلسه مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          const remove = async () => {
            try {
              if (meeting.source === 'manual') {
                await manualMeetingsService.removeMeeting(meeting.id);
              } else {
                const permission = await Calendar.requestCalendarPermissionsAsync();
                if (permission.status !== 'granted') {
                  Alert.alert('دسترسی لازم است', 'برای حذف جلسه تقویمی، اجازه دسترسی تقویم را فعال کنید.');
                  return;
                }
                await Calendar.deleteEventAsync(meeting.id);
              }
              navigation.goBack();
            } catch {
              Alert.alert('خطا', 'حذف جلسه انجام نشد. دوباره تلاش کنید.');
            }
          };

          void remove();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{meeting.title}</Text>
          <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
          {meeting.location ? <Text style={styles.meta}>محل: {meeting.location}</Text> : null}
          <View style={[styles.badge, meeting.source === 'manual' ? styles.manualBadge : styles.calendarBadge]}>
            <Text style={styles.badgeText}>{meeting.source === 'manual' ? 'جلسه دستی' : 'جلسه تقویمی'}</Text>
          </View>
          {meeting.notes ? <Text style={styles.notes}>{meeting.notes}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ضبط صدا</Text>
          <Text style={styles.cardText}>صدای جلسه را ضبط کنید تا بعدا متن و خلاصه ساخته شود.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Recording', { meeting })}>
            <Text style={styles.primaryButtonText}>شروع ضبط</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>مدیریت جلسه</Text>
          <Text style={styles.cardText}>
            {meeting.source === 'manual'
              ? 'این جلسه دستی است و می‌توانید آن را حذف کنید.'
              : 'این جلسه از تقویم حذف می‌شود.'}
          </Text>
          <Pressable style={styles.dangerButton} onPress={confirmDelete}>
            <Text style={styles.dangerButtonText}>حذف جلسه</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 27,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  calendarBadge: {
    backgroundColor: colors.accentSoft,
  },
  manualBadge: {
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  notes: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.backgroundAccent,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  dangerButton: {
    marginTop: 4,
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
});
