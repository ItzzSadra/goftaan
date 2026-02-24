const PERSIAN_LOCALE = 'fa-IR';

export const formatMeetingTime = (startISO: string, endISO: string): string => {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const day = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start);

  const startTime = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);

  const endTime = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(end);

  return `${day} • ${startTime} تا ${endTime}`;
};

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minutesText = new Intl.NumberFormat(PERSIAN_LOCALE, { minimumIntegerDigits: 2 }).format(minutes);
  const secondsText = new Intl.NumberFormat(PERSIAN_LOCALE, { minimumIntegerDigits: 2 }).format(seconds);

  return `${minutesText}:${secondsText}`;
};
