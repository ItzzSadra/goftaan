import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  defaultAppSettings,
  defaultReminderSettings,
  defaultSettingsState,
  type AppSettings,
  type ReminderSettings,
  type SettingsState,
} from '../models/settings';

const SETTINGS_KEY = 'goftaan.settings.reminders.v1';

export const settingsService = {
  async getSettings(): Promise<SettingsState> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultSettingsState;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState> | Partial<ReminderSettings>;

      // Backward compatibility with previous shape where only reminder settings were stored.
      if ('preMeetingEnabled' in parsed || 'preMeetingMinutes' in parsed) {
        return {
          reminders: {
            ...defaultReminderSettings,
            ...(parsed as Partial<ReminderSettings>),
          },
          app: defaultAppSettings,
        };
      }

      return {
        reminders: {
          ...defaultReminderSettings,
          ...(('reminders' in parsed ? parsed.reminders : {}) || {}),
        },
        app: {
          ...defaultAppSettings,
          ...(('app' in parsed ? parsed.app : {}) || {}),
        },
      };
    } catch {
      return defaultSettingsState;
    }
  },

  async saveSettings(settings: SettingsState): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  async getReminderSettings(): Promise<ReminderSettings> {
    const settings = await this.getSettings();
    return settings.reminders;
  },

  async saveReminderSettings(settings: ReminderSettings): Promise<void> {
    const current = await this.getSettings();
    await this.saveSettings({ ...current, reminders: settings });
  },

  async getAppSettings(): Promise<AppSettings> {
    const settings = await this.getSettings();
    return settings.app;
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    const current = await this.getSettings();
    await this.saveSettings({ ...current, app: settings });
  },
};
