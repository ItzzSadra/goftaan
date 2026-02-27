import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { SettingsState } from '../../features/settings/models/settings';
import { settingsService } from '../../features/settings/services/settingsService';

const PRE_MEETING_MINUTES = [5, 10, 15, 30];
const DEFAULT_DURATION_OPTIONS = [30, 45, 60, 90];

export const SettingsScreen = () => {
  const { user, updateUserProfile, updateUserPassword, deleteUserAccount, logout } = useAuth();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      const current = await settingsService.getSettings();
      setSettings(current);
      setProfileName(user?.name || '');
      setProfileEmail(user?.email || '');
    };

    void load();
  }, [user?.email, user?.name]);

  const saveSettings = async (next: SettingsState) => {
    setSettings(next);
    setIsSavingSettings(true);
    try {
      await settingsService.saveSettings(next);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const onSaveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      Alert.alert('خطا', 'نام و ایمیل را کامل وارد کنید.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUserProfile(profileName, profileEmail);
      Alert.alert('انجام شد', 'اطلاعات حساب به‌روزرسانی شد.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'به‌روزرسانی حساب انجام نشد.';
      Alert.alert('خطا', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('خطا', 'رمز فعلی و جدید را وارد کنید.');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('خطا', 'رمز جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }

    try {
      setIsSavingPassword(true);
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('انجام شد', 'رمز عبور تغییر کرد.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تغییر رمز عبور انجام نشد.';
      Alert.alert('خطا', message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const onDeleteAccount = () => {
    Alert.alert('حذف حساب', 'همه داده‌های حساب حذف می‌شود. مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف دائمی',
        style: 'destructive',
        onPress: () => {
          const remove = async () => {
            try {
              await deleteUserAccount();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'حذف حساب انجام نشد.';
              Alert.alert('خطا', message);
            }
          };

          void remove();
        },
      },
    ]);
  };

  const savingLabel = useMemo(() => {
    if (isSavingSettings) {
      return 'در حال ذخیره تنظیمات...';
    }
    if (isSavingProfile) {
      return 'در حال ذخیره حساب...';
    }
    if (isSavingPassword) {
      return 'در حال تغییر رمز عبور...';
    }
    return '';
  }, [isSavingPassword, isSavingProfile, isSavingSettings]);

  if (!settings) {
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>مرکز کنترل</Text>
          <Text style={styles.title}>تنظیمات کامل</Text>
          <Text style={styles.subtitle}>مدیریت حساب، رفتار برنامه و اعلان‌ها در یک صفحه</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>حساب کاربری</Text>
          <Text style={styles.label}>نام</Text>
          <TextInput
            style={styles.input}
            value={profileName}
            onChangeText={setProfileName}
            autoCapitalize="words"
            placeholder="نام"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.label}>ایمیل</Text>
          <TextInput
            style={styles.input}
            value={profileEmail}
            onChangeText={setProfileEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable style={styles.primaryButton} onPress={() => void onSaveProfile()} disabled={isSavingProfile}>
            <Text style={styles.primaryButtonText}>ذخیره حساب</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>امنیت</Text>
          <Text style={styles.label}>رمز عبور فعلی</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="رمز فعلی"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.label}>رمز عبور جدید</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="رمز جدید"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable style={styles.primaryButton} onPress={() => void onChangePassword()} disabled={isSavingPassword}>
            <Text style={styles.primaryButtonText}>تغییر رمز عبور</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>اپلیکیشن</Text>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>تازه‌سازی خودکار جلسه‌ها</Text>
              <Text style={styles.rowSubtitle}>هنگام ورود به صفحه جلسه‌ها خودکار رفرش شود</Text>
            </View>
            <Switch
              value={settings.app.autoRefreshMeetings}
              onValueChange={(value) => void saveSettings({ ...settings, app: { ...settings.app, autoRefreshMeetings: value } })}
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>کارت‌های فشرده</Text>
              <Text style={styles.rowSubtitle}>چیدمان کم‌فاصله‌تر برای لیست جلسه‌ها</Text>
            </View>
            <Switch
              value={settings.app.compactCards}
              onValueChange={(value) => void saveSettings({ ...settings, app: { ...settings.app, compactCards: value } })}
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>تحلیل فقط اقدام معوق</Text>
              <Text style={styles.rowSubtitle}>داشبورد تحلیل فقط جلسه‌های دارای اقدام معوق را نشان دهد</Text>
            </View>
            <Switch
              value={settings.app.analyticsShowOverdueOnly}
              onValueChange={(value) =>
                void saveSettings({ ...settings, app: { ...settings.app, analyticsShowOverdueOnly: value } })
              }
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>

          <Text style={styles.sectionLabel}>مدت پیش‌فرض جلسه جدید</Text>
          <View style={styles.minutesRow}>
            {DEFAULT_DURATION_OPTIONS.map((duration) => {
              const selected = settings.app.defaultMeetingDurationMinutes === duration;
              return (
                <Pressable
                  key={duration}
                  style={[styles.minuteButton, selected ? styles.minuteButtonActive : null]}
                  onPress={() =>
                    void saveSettings({
                      ...settings,
                      app: { ...settings.app, defaultMeetingDurationMinutes: duration },
                    })
                  }
                >
                  <Text style={[styles.minuteText, selected ? styles.minuteTextActive : null]}>{duration} دقیقه</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>اعلان‌ها و یادآورها</Text>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>یادآوری قبل از جلسه</Text>
              <Text style={styles.rowSubtitle}>برای جلسه‌های آینده اعلان زمان‌بندی شود</Text>
            </View>
            <Switch
              value={settings.reminders.preMeetingEnabled}
              onValueChange={(value) =>
                void saveSettings({ ...settings, reminders: { ...settings.reminders, preMeetingEnabled: value } })
              }
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>

          <Text style={styles.sectionLabel}>زمان یادآوری</Text>
          <View style={styles.minutesRow}>
            {PRE_MEETING_MINUTES.map((minute) => {
              const selected = settings.reminders.preMeetingMinutes === minute;
              return (
                <Pressable
                  key={minute}
                  style={[styles.minuteButton, selected ? styles.minuteButtonActive : null]}
                  onPress={() =>
                    void saveSettings({
                      ...settings,
                      reminders: { ...settings.reminders, preMeetingMinutes: minute },
                    })
                  }
                >
                  <Text style={[styles.minuteText, selected ? styles.minuteTextActive : null]}>{minute} دقیقه</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>اعلان آماده شدن خلاصه</Text>
              <Text style={styles.rowSubtitle}>وقتی خلاصه جدید ثبت شود به شما اطلاع می‌دهد</Text>
            </View>
            <Switch
              value={settings.reminders.summaryReadyEnabled}
              onValueChange={(value) =>
                void saveSettings({ ...settings, reminders: { ...settings.reminders, summaryReadyEnabled: value } })
              }
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>هشدار اقدام‌های معوق</Text>
              <Text style={styles.rowSubtitle}>روزانه اقدام‌های عقب‌افتاده را یادآوری می‌کند</Text>
            </View>
            <Switch
              value={settings.reminders.overdueActionsEnabled}
              onValueChange={(value) =>
                void saveSettings({ ...settings, reminders: { ...settings.reminders, overdueActionsEnabled: value } })
              }
              thumbColor={colors.surfaceElevated}
              trackColor={{ false: '#CCC4B3', true: colors.accent }}
            />
          </View>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.sectionTitle}>خروج و حذف حساب</Text>
          <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
            <Text style={styles.secondaryButtonText}>خروج از حساب</Text>
          </Pressable>
          <Pressable style={styles.dangerButton} onPress={onDeleteAccount}>
            <Text style={styles.dangerButtonText}>حذف دائمی حساب</Text>
          </Pressable>
        </View>

        {savingLabel ? <Text style={styles.savingText}>{savingLabel}</Text> : null}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
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
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  sectionLabel: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  label: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.textPrimary,
    backgroundColor: '#F8F4EB',
    fontFamily: typography.regular,
    fontSize: 14,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: typography.regular,
  },
  minutesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  minuteButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#F8F4EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  minuteButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: '#BFD9D6',
  },
  minuteText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  minuteTextActive: {
    color: colors.accentDark,
  },
  primaryButton: {
    marginTop: 2,
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.bold,
  },
  secondaryButton: {
    backgroundColor: '#F6F2E9',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.bold,
  },
  dangerCard: {
    borderColor: '#E7B8B4',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.bold,
  },
  savingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 13,
  },
});

