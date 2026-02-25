import type { MeetingSummary } from '../models/meetingSummary';

type MeetingSummaryRow = {
  id: string | number;
  meeting_id: string | number;
  summary: string | null;
  key_points: unknown;
  action_items: unknown;
  created_at: string;
};

type CreateMeetingSummaryInput = {
  meetingId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  language?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjdvfrkegflymfvcpxpf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.');
}

const summariesEndpoint = `${supabaseUrl}/rest/v1/meeting_summaries`;

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

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object') {
        if ('text' in item && typeof item.text === 'string') {
          return item.text.trim();
        }
        if ('title' in item && typeof item.title === 'string') {
          return item.title.trim();
        }
      }

      return String(item).trim();
    })
    .filter((item) => item.length > 0);
};

const toMeetingSummary = (row: MeetingSummaryRow): MeetingSummary => ({
  id: String(row.id),
  meetingId: String(row.meeting_id),
  summary: row.summary || '',
  keyPoints: toStringArray(row.key_points),
  actionItems: toStringArray(row.action_items),
  createdAt: row.created_at,
});

export const meetingSummaryService = {
  async getLatestSummary(meetingId: string): Promise<MeetingSummary | null> {
    const params = new URLSearchParams({
      select: 'id,meeting_id,summary,key_points,action_items,created_at',
      meeting_id: `eq.${meetingId}`,
      order: 'created_at.desc',
      limit: '1',
    });

    const response = await fetch(`${summariesEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = (await response.json()) as MeetingSummaryRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'بارگذاری خلاصه جلسه انجام نشد.'));
    }

    if (data.length === 0) {
      return null;
    }

    return toMeetingSummary(data[0]);
  },

  async createSummary(input: CreateMeetingSummaryInput): Promise<MeetingSummary> {
    const response = await fetch(summariesEndpoint, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        meeting_id: input.meetingId,
        summary: input.summary,
        key_points: input.keyPoints,
        action_items: input.actionItems,
        language: input.language || 'fa',
      }),
    });

    const data = (await response.json()) as MeetingSummaryRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(getErrorMessage(data, 'ذخیره خلاصه جلسه انجام نشد.'));
    }

    return toMeetingSummary(data[0]);
  },

  async getSummariesByMeetingIds(meetingIds: string[]): Promise<MeetingSummary[]> {
    if (meetingIds.length === 0) {
      return [];
    }

    const inFilter = `(${meetingIds.map((id) => `"${id}"`).join(',')})`;
    const params = new URLSearchParams({
      select: 'id,meeting_id,summary,key_points,action_items,created_at',
      meeting_id: `in.${inFilter}`,
      order: 'created_at.desc',
    });

    const response = await fetch(`${summariesEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = (await response.json()) as MeetingSummaryRow[] | { message?: string };

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'بارگذاری خلاصه‌ها انجام نشد.'));
    }

    const latestByMeeting = new Map<string, MeetingSummary>();
    for (const row of data) {
      const parsed = toMeetingSummary(row);
      if (!latestByMeeting.has(parsed.meetingId)) {
        latestByMeeting.set(parsed.meetingId, parsed);
      }
    }

    return Array.from(latestByMeeting.values());
  },
};
