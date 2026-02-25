export type ReminderSettings = {
  preMeetingEnabled: boolean;
  preMeetingMinutes: number;
  summaryReadyEnabled: boolean;
  overdueActionsEnabled: boolean;
};

export type AppSettings = {
  autoRefreshMeetings: boolean;
  defaultMeetingDurationMinutes: number;
  analyticsShowOverdueOnly: boolean;
  compactCards: boolean;
};

export type SettingsState = {
  reminders: ReminderSettings;
  app: AppSettings;
};

export const defaultReminderSettings: ReminderSettings = {
  preMeetingEnabled: true,
  preMeetingMinutes: 15,
  summaryReadyEnabled: true,
  overdueActionsEnabled: true,
};

export const defaultAppSettings: AppSettings = {
  autoRefreshMeetings: true,
  defaultMeetingDurationMinutes: 45,
  analyticsShowOverdueOnly: false,
  compactCards: false,
};

export const defaultSettingsState: SettingsState = {
  reminders: defaultReminderSettings,
  app: defaultAppSettings,
};
