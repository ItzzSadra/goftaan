import * as Calendar from 'expo-calendar';

import type { Meeting } from '../models/meeting';

const DEFAULT_LOOKAHEAD_DAYS = 7;

type CalendarPermission = 'granted' | 'denied' | 'undetermined';

export type CalendarFetchResult = {
  permission: CalendarPermission;
  meetings: Meeting[];
};

const normalizeEvent = (event: Calendar.Event): Meeting => {
  const startDate = event.startDate ? new Date(event.startDate) : new Date();
  const endDate = event.endDate ? new Date(event.endDate) : startDate;

  return {
    id: event.id,
    title: event.title?.trim() || 'جلسه بدون عنوان',
    startDateISO: startDate.toISOString(),
    endDateISO: endDate.toISOString(),
    location: event.location || undefined,
    notes: event.notes || undefined,
    calendarId: event.calendarId,
    isAllDay: Boolean(event.allDay),
    source: 'calendar',
  };
};

const getReadableCalendars = async (): Promise<Calendar.Calendar[]> => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.filter((calendar) => calendar.allowsModifications || calendar.source?.name);
};

const requestPermission = async (): Promise<CalendarPermission> => {
  const existing = await Calendar.getCalendarPermissionsAsync();
  if (existing.status === 'granted') {
    return 'granted';
  }

  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.status;
};

const getUpcomingMeetings = async (lookaheadDays = DEFAULT_LOOKAHEAD_DAYS): Promise<Meeting[]> => {
  const calendars = await getReadableCalendars();
  if (!calendars.length) {
    return [];
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + lookaheadDays);

  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    startDate,
    endDate,
  );

  return events
    .filter((event) => event.startDate && event.endDate)
    .map(normalizeEvent)
    .filter((meeting) => new Date(meeting.endDateISO).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime());
};

export const calendarService = {
  requestPermission,
  getUpcomingMeetings,
  async fetchUpcomingMeetings(lookaheadDays = DEFAULT_LOOKAHEAD_DAYS): Promise<CalendarFetchResult> {
    const permission = await requestPermission();
    if (permission !== 'granted') {
      return { permission, meetings: [] };
    }

    const meetings = await getUpcomingMeetings(lookaheadDays);
    return { permission, meetings };
  },
};
