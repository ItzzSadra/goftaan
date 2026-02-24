import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings`;

const ensureRecordingsDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(RECORDINGS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
  }
};

const sanitizeMeetingId = (meetingId: string): string => {
  return meetingId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

const buildRecordingUri = (meetingId: string): string => {
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  return `${RECORDINGS_DIR}/${sanitizeMeetingId(meetingId)}-${timestamp}.m4a`;
};

export const audioRecordingService = {
  async requestPermission(): Promise<boolean> {
    const existing = await getRecordingPermissionsAsync();
    if (existing.granted) {
      return true;
    }

    const requested = await requestRecordingPermissionsAsync();
    return requested.granted;
  },

  async configureAudioMode(): Promise<void> {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  },

  async resetAudioMode(): Promise<void> {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  },

  async persistRecordingUri(sourceUri: string, meetingId: string): Promise<string> {
    await ensureRecordingsDir();
    const destinationUri = buildRecordingUri(meetingId);

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  },
};
