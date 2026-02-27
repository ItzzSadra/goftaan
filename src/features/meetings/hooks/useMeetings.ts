import { useCallback, useEffect, useState } from 'react';

import type { Meeting } from '../models/meeting';
import { calendarService } from '../services/calendarService';
import { manualMeetingsService } from '../services/manualMeetingsService';
import { isDesktopWeb } from '../../../utils/platform';
import { useAuth } from '../../auth/context/AuthContext';

type Status = 'idle' | 'loading' | 'ready' | 'permissionDenied' | 'error';

type UseMeetingsResult = {
  status: Status;
  meetings: Meeting[];
  errorMessage: string | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

const defaultError = 'بارگذاری جلسه‌ها انجام نشد. دوباره تلاش کنید.';
const mergeMeetings = (calendarMeetings: Meeting[], manualMeetings: Meeting[]): Meeting[] => {
  const byId = new Map<string, Meeting>();

  for (const meeting of [...calendarMeetings, ...manualMeetings]) {
    byId.set(meeting.id, meeting);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime(),
  );
};

export const useMeetings = (): UseMeetingsResult => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMeetings = useCallback(async (isInitialLoad: boolean) => {
    try {
      if (isInitialLoad) {
        setStatus('loading');
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      if (!user) {
        setMeetings([]);
        setStatus('ready');
        if (!isInitialLoad) {
          setIsRefreshing(false);
        }
        return;
      }

      if (isDesktopWeb()) {
        const manualMeetings = await manualMeetingsService.getMeetings(user.id);
        setMeetings(mergeMeetings([], manualMeetings));
        setStatus('ready');
        if (!isInitialLoad) {
          setIsRefreshing(false);
        }
        return;
      }

      const [result, manualMeetings] = await Promise.all([
        calendarService.fetchUpcomingMeetings(),
        manualMeetingsService.getMeetings(user.id),
      ]);

      if (result.permission !== 'granted') {
        setMeetings(manualMeetings);
        setStatus('permissionDenied');
        if (!isInitialLoad) {
          setIsRefreshing(false);
        }
        return;
      }

      setMeetings(mergeMeetings(result.meetings, manualMeetings));
      setStatus('ready');
      if (!isInitialLoad) {
        setIsRefreshing(false);
      }
    } catch (error) {
      setStatus('error');
      if (!isInitialLoad) {
        setIsRefreshing(false);
      }
      if (error instanceof Error && error.message.trim()) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(defaultError);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await loadMeetings(false);
  }, [loadMeetings]);

  useEffect(() => {
    void loadMeetings(true);
  }, [loadMeetings]);

  return {
    status,
    meetings,
    errorMessage,
    isRefreshing,
    refresh,
  };
};
