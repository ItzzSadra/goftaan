import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/context/AuthContext';
import type { Meeting } from '../../features/meetings/models/meeting';
import type { MeetingSummary } from '../../features/meetings/models/meetingSummary';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';
import { meetingSummaryService } from '../../features/meetings/services/meetingSummaryService';
import { settingsService } from '../../features/settings/services/settingsService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type AnalyticsState = {
  meetings: Meeting[];
  summaries: MeetingSummary[];
};

const parseActionItemMeta = (value: string) => {
  const completed = /^\s*(\[x\]|✅)/i.test(value.trim());
  const dueMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  const dueDate = dueMatch ? new Date(`${dueMatch[1]}T23:59:59`) : null;
  return { completed, dueDate };
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const AnalyticsScreen = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsState>({ meetings: [], summaries: [] });
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const load = useCallback(
    async (refreshing: boolean) => {
      if (!user) {
        setData({ meetings: [], summaries: [] });
        setIsLoading(false);
        return;
      }

      try {
        if (refreshing) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError(null);
        const appSettings = await settingsService.getAppSettings();
        setShowOverdueOnly(appSettings.analyticsShowOverdueOnly);
        const meetings = await manualMeetingsService.getAllMeetings(user.id);
        const summaries = await meetingSummaryService.getSummariesByMeetingIds(meetings.map((item) => item.id));
        setData({ meetings, summaries });
      } catch (loadError) {
        const message =
          loadError instanceof Error && loadError.message.trim()
            ? loadError.message
            : 'بارگذاری تحلیل‌ها انجام نشد.';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const meetings = showOverdueOnly
      ? data.meetings.filter((meeting) => {
          const summary = data.summaries.find((item) => item.meetingId === meeting.id);
          if (!summary) {
            return false;
          }
          return summary.actionItems.some((action) => {
            const parsed = parseActionItemMeta(action);
            return Boolean(parsed.dueDate && !parsed.completed && parsed.dueDate.getTime() < now.getTime());
          });
        })
      : data.meetings;
    const summariesByMeeting = new Map(data.summaries.map((summary) => [summary.meetingId, summary]));
    const meetingsWithSummary = meetings.filter((meeting) => summariesByMeeting.has(meeting.id)).length;
    const summaryCoverage = meetings.length ? Math.round((meetingsWithSummary / meetings.length) * 100) : 0;
    const durations = meetings.map(
      (meeting) => (new Date(meeting.endDateISO).getTime() - new Date(meeting.startDateISO).getTime()) / 60000,
    );
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const thisWeekCount = meetings.filter((meeting) => {
      const start = new Date(meeting.startDateISO);
      return start >= weekStart && start < weekEnd;
    }).length;

    let keyPointsCount = 0;
    let overdueActions = 0;
    for (const summary of data.summaries) {
      keyPointsCount += summary.keyPoints.length;
      for (const action of summary.actionItems) {
        const parsed = parseActionItemMeta(action);
        if (parsed.dueDate && !parsed.completed && parsed.dueDate.getTime() < now.getTime()) {
          overdueActions += 1;
        }
      }
    }

    const upcoming7Days = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return meetings.filter((meeting) => {
        const start = new Date(meeting.startDateISO);
        return start >= dayStart && start < dayEnd;
      }).length;
    });

    return {
      totalMeetings: meetings.length,
      thisWeekCount,
      summaryCoverage,
      avgDuration,
      keyPointsCount,
      overdueActions,
      upcoming7Days,
    };
  }, [data.meetings, data.summaries, showOverdueOnly]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.accentDark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>تحلیل</Text>
          <Text style={styles.title}>داشبورد عملکرد</Text>
          <Text style={styles.subtitle}>نمای کلی جلسه‌ها، خلاصه‌ها و اقدام‌ها</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.totalMeetings}</Text>
            <Text style={styles.metricLabel}>کل جلسه‌ها</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.thisWeekCount}</Text>
            <Text style={styles.metricLabel}>جلسه این هفته</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.summaryCoverage}%</Text>
            <Text style={styles.metricLabel}>پوشش خلاصه</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.avgDuration}</Text>
            <Text style={styles.metricLabel}>میانگین دقیقه</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.keyPointsCount}</Text>
            <Text style={styles.metricLabel}>نکات کلیدی</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, stats.overdueActions > 0 ? styles.metricDanger : null]}>
              {stats.overdueActions}
            </Text>
            <Text style={styles.metricLabel}>اقدام معوق</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>۷ روز آینده</Text>
          <View style={styles.barRow}>
            {stats.upcoming7Days.map((count, index) => (
              <View style={styles.barItem} key={`day-${index}`}>
                <View style={[styles.bar, { height: Math.max(8, count * 12) }]} />
                <Text style={styles.barLabel}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 26,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    gap: 4,
  },
  kicker: {
    fontSize: 11,
    color: colors.accentDark,
    letterSpacing: 0.9,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  metricDanger: {
    color: colors.danger,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  chartCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    gap: 12,
  },
  chartTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 94,
  },
  barItem: {
    alignItems: 'center',
    gap: 6,
    width: 30,
  },
  bar: {
    width: 22,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
});
