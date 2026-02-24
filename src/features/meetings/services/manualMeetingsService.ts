import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Meeting } from '../models/meeting';

const STORAGE_KEY = 'goftaan.manualMeetings.v1';

type ManualMeetingInput = {
  title: string;
  location?: string;
  notes?: string;
  startDateISO: string;
  endDateISO: string;
};

const read = async (): Promise<Meeting[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Meeting[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((meeting) => Boolean(meeting?.id && meeting?.title && meeting?.startDateISO && meeting?.endDateISO))
      .map((meeting) => ({ ...meeting, source: 'manual' as const, calendarId: 'manual' }));
  } catch {
    return [];
  }
};

const write = async (meetings: Meeting[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
};

const buildMeeting = (input: ManualMeetingInput): Meeting => {
  const id = `manual-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  return {
    id,
    title: input.title.trim(),
    location: input.location?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    startDateISO: input.startDateISO,
    endDateISO: input.endDateISO,
    calendarId: 'manual',
    isAllDay: false,
    source: 'manual',
  };
};

export const manualMeetingsService = {
  async getMeetings(): Promise<Meeting[]> {
    const meetings = await read();

    return meetings
      .filter((meeting) => new Date(meeting.endDateISO).getTime() >= Date.now())
      .sort((a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime());
  },

  async addMeeting(input: ManualMeetingInput): Promise<Meeting> {
    const meeting = buildMeeting(input);
    const meetings = await read();
    const next = [...meetings, meeting].sort(
      (a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime(),
    );

    await write(next);
    return meeting;
  },

  async removeMeeting(meetingId: string): Promise<void> {
    const meetings = await read();
    const next = meetings.filter((meeting) => meeting.id !== meetingId);
    await write(next);
  },
};
