import type { Meeting } from '../models/meeting';

type ManualMeetingInput = {
  userId: string;
  title: string;
  location?: string;
  notes?: string;
  startDateISO: string;
  endDateISO: string;
};

type MeetingRow = {
  id: string | number;
  user_id: string;
  title: string;
  location: string | null;
  notes: string | null;
  start_at: string;
  end_at: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjdvfrkegflymfvcpxpf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.');
}

const meetingsEndpoint = `${supabaseUrl}/rest/v1/meetings`;

const buildHeaders = (includeReturn = false): HeadersInit => ({
  'Content-Type': 'application/json',
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  ...(includeReturn ? { Prefer: 'return=representation' } : {}),
});

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  return fallback;
};

const toMeeting = (row: MeetingRow): Meeting => {
  return {
    id: String(row.id),
    title: row.title,
    location: row.location || undefined,
    notes: row.notes || undefined,
    startDateISO: row.start_at,
    endDateISO: row.end_at,
    calendarId: 'supabase',
    isAllDay: false,
    source: 'manual',
  };
};

export const manualMeetingsService = {
  async getMeetings(userId: string): Promise<Meeting[]> {
    const params = new URLSearchParams({
      select: 'id,user_id,title,location,notes,start_at,end_at',
      user_id: `eq.${userId}`,
      end_at: `gte.${new Date().toISOString()}`,
      order: 'start_at.asc',
    });

    const response = await fetch(`${meetingsEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = (await response.json()) as MeetingRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'بارگذاری جلسه‌ها انجام نشد.'));
    }

    return data.map(toMeeting);
  },

  async getAllMeetings(userId: string): Promise<Meeting[]> {
    const params = new URLSearchParams({
      select: 'id,user_id,title,location,notes,start_at,end_at',
      user_id: `eq.${userId}`,
      order: 'start_at.asc',
    });

    const response = await fetch(`${meetingsEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = (await response.json()) as MeetingRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'بارگذاری جلسه‌ها انجام نشد.'));
    }

    return data.map(toMeeting);
  },

  async addMeeting(input: ManualMeetingInput): Promise<Meeting> {
    const response = await fetch(meetingsEndpoint, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        user_id: input.userId,
        title: input.title.trim(),
        location: input.location?.trim() || null,
        notes: input.notes?.trim() || null,
        start_at: input.startDateISO,
        end_at: input.endDateISO,
      }),
    });

    const data = (await response.json()) as MeetingRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(getErrorMessage(data, 'ذخیره جلسه انجام نشد.'));
    }

    return toMeeting(data[0]);
  },

  async removeMeeting(meetingId: string): Promise<void> {
    const params = new URLSearchParams({
      id: `eq.${meetingId}`,
    });

    const response = await fetch(`${meetingsEndpoint}?${params.toString()}`, {
      method: 'DELETE',
      headers: buildHeaders(true),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(getErrorMessage(payload, 'حذف جلسه انجام نشد.'));
    }

    if (response.status !== 204) {
      const payload = (await response.json()) as MeetingRow[] | { message?: string };
      if (!Array.isArray(payload)) {
        throw new Error(getErrorMessage(payload, 'حذف جلسه انجام نشد.'));
      }
      if (payload.length === 0) {
        throw new Error('جلسه پیدا نشد یا حذف نشد.');
      }
    }
  },
};
