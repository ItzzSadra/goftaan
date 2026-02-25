import { useEffect } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import type { AppStackParamList } from '../../../core/navigation/types';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { formatDuration, formatMeetingTime } from '../../../shared/utils/date';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type { RecordingStatus } from '../models/recording';

type Props = NativeStackScreenProps<AppStackParamList, 'Recording'>;

const canStop = (status: RecordingStatus): boolean => status === 'recording' || status === 'paused';

export const RecordingScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;
  const { status, durationMs, result, errorMessage, interruptionMessage, start, pause, resume, stop, reset } =
    useAudioRecorder(meeting.id);
  const player = useAudioPlayer(result?.localUri ?? null, { updateInterval: 250 });
  const playbackStatus = useAudioPlayerStatus(player);
  const playbackCurrentMs = Math.floor((playbackStatus.currentTime ?? 0) * 1000);
  const playbackDurationMs = Math.floor((playbackStatus.duration ?? 0) * 1000);
  const isPlaying = playbackStatus.playing && playbackStatus.isLoaded;
  const stateLabel: Record<RecordingStatus, string> = {
    idle: 'آماده',
    requestingPermission: 'در حال گرفتن مجوز',
    permissionDenied: 'بدون دسترسی',
    recording: 'در حال ضبط',
    paused: 'مکث شده',
    stopping: 'در حال ذخیره',
    completed: 'ذخیره شد',
    error: 'خطا',
  };

  useEffect(() => {
    if (status === 'completed' && result?.localUri) {
      return;
    }

    try {
      player.pause();
    } catch {
      // Ignore player pause errors during source transitions.
    }
  }, [player, result?.localUri, status]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{meeting.title}</Text>
        <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>مدت ضبط</Text>
          <Text style={styles.timerValue}>{formatDuration(durationMs)}</Text>
          <Text style={styles.stateText}>وضعیت: {stateLabel[status]}</Text>
        </View>

        {status === 'permissionDenied' ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>دسترسی میکروفون لازم است.</Text>
            <Pressable style={styles.secondaryButton} onPress={() => void Linking.openSettings()}>
              <Text style={styles.secondaryButtonText}>باز کردن تنظیمات</Text>
            </Pressable>
          </View>
        ) : null}

        {interruptionMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.warningText}>{interruptionMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {status === 'completed' && result ? (
          <View style={styles.messageCard}>
            <Text style={styles.successTitle}>ضبط ذخیره شد</Text>
            <Text style={styles.uriText}>{result.localUri}</Text>
            <Text style={styles.successMeta}>مدت: {formatDuration(result.durationMs)}</Text>
            <View style={styles.playbackMetaRow}>
              <Text style={styles.playbackMetaLabel}>پخش</Text>
              <Text style={styles.playbackMetaValue}>
                {formatDuration(playbackCurrentMs)} / {formatDuration(playbackDurationMs)}
              </Text>
            </View>
            <View style={styles.row}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  if (isPlaying) {
                    try {
                      player.pause();
                    } catch {
                      // Ignore pause failures if player is not ready.
                    }
                    return;
                  }
                  try {
                    player.play();
                  } catch {
                    // Ignore play failures if player is not ready.
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>{isPlaying ? 'مکث پخش' : 'پخش ضبط'}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  const replay = async () => {
                    try {
                      await player.seekTo(0);
                      player.play();
                    } catch {
                      // Ignore replay failures if player is not ready.
                    }
                  };

                  void replay();
                }}
              >
                <Text style={styles.secondaryButtonText}>پخش دوباره</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.controls}>
          {status === 'idle' ||
          status === 'permissionDenied' ||
          status === 'error' ||
          status === 'requestingPermission' ? (
            <Pressable
              style={[styles.primaryButton, status === 'requestingPermission' ? styles.disabledButton : null]}
              onPress={() => void start()}
              disabled={status === 'requestingPermission'}
            >
              <Text style={styles.primaryButtonText}>
                {status === 'requestingPermission' ? 'در حال دریافت مجوز...' : 'شروع ضبط'}
              </Text>
            </Pressable>
          ) : null}

          {status === 'recording' ? (
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={() => void pause()}>
                <Text style={styles.secondaryButtonText}>مکث</Text>
              </Pressable>
              <Pressable style={styles.dangerButton} onPress={() => void stop()}>
                <Text style={styles.dangerButtonText}>پایان</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'paused' ? (
            <View style={styles.row}>
              <Pressable style={styles.primaryButton} onPress={() => void resume()}>
                <Text style={styles.primaryButtonText}>ادامه</Text>
              </Pressable>
              <Pressable style={styles.dangerButton} onPress={() => void stop()}>
                <Text style={styles.dangerButtonText}>پایان</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'completed' ? (
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={reset}>
                <Text style={styles.secondaryButtonText}>ضبط دوباره</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.primaryButtonText}>بازگشت به جلسه</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'stopping' ? <Text style={styles.helperText}>در حال ذخیره ضبط...</Text> : null}
          {!canStop(status) && status === 'requestingPermission' ? (
            <Text style={styles.helperText}>در حال درخواست دسترسی میکروفون...</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8,
  },
  timerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerValue: {
    fontSize: 38,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  stateText: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: typography.bold,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  warningText: {
    color: '#935D00',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  successMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  playbackMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playbackMetaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  playbackMetaValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  uriText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  controls: {
    marginTop: 18,
    paddingBottom: 10,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: 15,
  },
  dangerButton: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  helperText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.regular,
  },
});
