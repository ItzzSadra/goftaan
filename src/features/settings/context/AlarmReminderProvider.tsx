import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/context/AuthContext';
import type { Meeting } from '../../meetings/models/meeting';
import { manualMeetingsService } from '../../meetings/services/manualMeetingsService';
import { formatMeetingTime } from '../../../shared/utils/date';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { settingsService } from '../services/settingsService';

const CHECK_INTERVAL_MS = 20_000;
const TRIGGER_WINDOW_MS = 90_000;
const SNOOZE_MINUTES = 5;

const getDayKey = () => new Date().toISOString().slice(0, 10);
const firedKey = (userId: string) => `goftaan.alarm.fired.${userId}.${getDayKey()}`;

const readFiredSet = async (userId: string): Promise<Set<string>> => {
  const raw = await AsyncStorage.getItem(firedKey(userId));
  if (!raw) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
};

const writeFiredSet = async (userId: string, set: Set<string>) => {
  await AsyncStorage.setItem(firedKey(userId), JSON.stringify(Array.from(set)));
};

export const AlarmReminderProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [activeAlarm, setActiveAlarm] = useState<Meeting | null>(null);
  const snoozedUntilRef = useRef<Map<string, number>>(new Map());
  const pendingRef = useRef<Meeting[]>([]);
  const isCheckingRef = useRef(false);

  const nowLabel = useMemo(() => {
    if (!activeAlarm) {
      return '';
    }

    const minutesToStart = Math.round((new Date(activeAlarm.startDateISO).getTime() - Date.now()) / 60_000);
    if (minutesToStart > 0) {
      return `${minutesToStart} دقیقه تا شروع جلسه`;
    }
    return 'جلسه الان شروع می‌شود';
  }, [activeAlarm]);

  const popPending = useCallback(() => {
    if (activeAlarm) {
      return;
    }
    const next = pendingRef.current.shift() || null;
    if (next) {
      setActiveAlarm(next);
    }
  }, [activeAlarm]);

  const checkForAlarm = useCallback(async () => {
    if (!user || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    try {
      const reminderSettings = await settingsService.getReminderSettings();
      if (!reminderSettings.preMeetingEnabled) {
        return;
      }

      const preMeetingMinutes = reminderSettings.preMeetingMinutes;
      const meetings = await manualMeetingsService.getMeetings(user.id);
      const now = Date.now();
      const fired = await readFiredSet(user.id);
      const snoozedUntil = snoozedUntilRef.current;

      const dueMeetings = meetings
        .filter((meeting) => {
          const triggerAt = new Date(meeting.startDateISO).getTime() - preMeetingMinutes * 60_000;
          const snoozeUntil = snoozedUntil.get(meeting.id) || 0;
          const isWithinWindow = Math.abs(triggerAt - now) <= TRIGGER_WINDOW_MS;
          return isWithinWindow && !fired.has(meeting.id) && now >= snoozeUntil;
        })
        .sort((a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime());

      if (dueMeetings.length === 0) {
        return;
      }

      for (const meeting of dueMeetings) {
        fired.add(meeting.id);
      }
      await writeFiredSet(user.id, fired);

      pendingRef.current.push(...dueMeetings);
      popPending();
    } finally {
      isCheckingRef.current = false;
    }
  }, [popPending, user]);

  useEffect(() => {
    if (!user) {
      setActiveAlarm(null);
      pendingRef.current = [];
      return;
    }

    void checkForAlarm();
    const id = setInterval(() => {
      void checkForAlarm();
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(id);
    };
  }, [checkForAlarm, user]);

  const dismissAlarm = () => {
    setActiveAlarm(null);
    setTimeout(popPending, 50);
  };

  const snoozeAlarm = () => {
    if (activeAlarm) {
      const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60_000;
      snoozedUntilRef.current.set(activeAlarm.id, snoozeUntil);
    }

    setActiveAlarm(null);
    setTimeout(popPending, 50);
  };

  return (
    <>
      {children}
      <Modal visible={Boolean(activeAlarm)} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.alarmContainer}>
          <View style={styles.alarmPulse} />
          <Text style={styles.alarmKicker}>ALARM</Text>
          <Text style={styles.alarmTitle}>یادآوری جلسه</Text>
          {activeAlarm ? <Text style={styles.meetingTitle}>{activeAlarm.title}</Text> : null}
          {activeAlarm ? <Text style={styles.meetingMeta}>{formatMeetingTime(activeAlarm.startDateISO, activeAlarm.endDateISO)}</Text> : null}
          <Text style={styles.nowLabel}>{nowLabel}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.snoozeButton} onPress={snoozeAlarm}>
              <Text style={styles.snoozeText}>تعویق ۵ دقیقه</Text>
            </Pressable>
            <Pressable style={styles.dismissButton} onPress={dismissAlarm}>
              <Text style={styles.dismissText}>متوجه شدم</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  alarmContainer: {
    flex: 1,
    backgroundColor: '#0D1513',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  alarmPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#183A36',
    borderWidth: 2,
    borderColor: '#2C7E76',
  },
  alarmKicker: {
    color: '#6ED2C7',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: typography.bold,
  },
  alarmTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: typography.bold,
  },
  meetingTitle: {
    color: '#E8F2EF',
    fontSize: 28,
    textAlign: 'center',
    fontFamily: typography.bold,
  },
  meetingMeta: {
    color: '#A7BBB6',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: typography.regular,
  },
  nowLabel: {
    marginTop: 8,
    color: '#6ED2C7',
    fontSize: 18,
    fontFamily: typography.bold,
    textAlign: 'center',
  },
  actions: {
    marginTop: 18,
    width: '100%',
    gap: 10,
  },
  snoozeButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#39706A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12332F',
  },
  snoozeText: {
    color: '#DBF6F1',
    fontSize: 16,
    fontFamily: typography.bold,
  },
  dismissButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: typography.bold,
  },
});
