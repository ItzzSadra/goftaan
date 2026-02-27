import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Meeting } from '../models/meeting';
import { formatMeetingTime } from '../../../utils/date';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

type MeetingCardProps = {
  meeting: Meeting;
  onPress: (meeting: Meeting) => void;
  onDeletePress?: (meeting: Meeting) => void;
  compact?: boolean;
};

export const MeetingCard = ({ meeting, onPress, onDeletePress, compact = false }: MeetingCardProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, compact ? styles.compactCard : null, pressed ? styles.cardPressed : null]}
      onPress={() => onPress(meeting)}
    >
      <View style={styles.accentBar} />
      <View style={styles.row}>
        <Text style={styles.title}>{meeting.title}</Text>
        <View style={[styles.badge, meeting.source === 'manual' ? styles.badgeManual : styles.badgeCalendar]}>
          <Text style={styles.badgeText}>{meeting.source === 'manual' ? 'دستی' : 'تقویم'}</Text>
        </View>
      </View>
      <Text style={styles.time}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
      {meeting.location ? <Text style={styles.location}>{meeting.location}</Text> : null}
      {onDeletePress ? (
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.deleteButton}
            onPress={(event) => {
              event.stopPropagation();
              onDeletePress(meeting);
            }}
          >
            <Text style={styles.deleteButtonText}>حذف</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 8px 16px rgba(13, 26, 20, 0.08)',
      },
    }),
  },
  compactCard: {
    padding: 12,
    gap: 7,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    backgroundColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
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
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  actionsRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#E7B8B4',
    backgroundColor: '#FFF2F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 13,
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
    backgroundColor: '#DBF2E3',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
});
