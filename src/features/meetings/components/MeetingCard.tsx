import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Meeting } from '../models/meeting';
import { formatMeetingTime } from '../../../shared/utils/date';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type MeetingCardProps = {
  meeting: Meeting;
  onPress: (meeting: Meeting) => void;
};

export const MeetingCard = ({ meeting, onPress }: MeetingCardProps) => {
  return (
    <Pressable style={styles.card} onPress={() => onPress(meeting)}>
      <View style={styles.row}>
        <Text style={styles.title}>{meeting.title}</Text>
        <View style={[styles.badge, meeting.source === 'manual' ? styles.badgeManual : styles.badgeCalendar]}>
          <Text style={styles.badgeText}>{meeting.source === 'manual' ? 'دستی' : 'تقویم'}</Text>
        </View>
      </View>
      <Text style={styles.time}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
      {meeting.location ? <Text style={styles.location}>{meeting.location}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.06)',
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  location: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: typography.bold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeCalendar: {
    backgroundColor: colors.accentSoft,
  },
  badgeManual: {
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
});
