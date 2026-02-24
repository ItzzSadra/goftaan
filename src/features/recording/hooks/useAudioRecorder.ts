import { useCallback, useEffect, useState } from 'react';
import {
  type AudioRecorder,
  type RecorderState,
  RecordingPresets,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import type { RecordingResult, RecordingStatus } from '../models/recording';
import { audioRecordingService } from '../services/audioRecordingService';

type UseAudioRecorderResult = {
  status: RecordingStatus;
  durationMs: number;
  result: RecordingResult | null;
  errorMessage: string | null;
  interruptionMessage: string | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
};

const DEFAULT_ERROR = 'ضبط صدا ناموفق بود. دوباره تلاش کنید.';

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const useAudioRecorder = (meetingId: string): UseAudioRecorderResult => {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY) as AudioRecorder;
  const recorderState = useAudioRecorderState(recorder, 250);

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interruptionMessage, setInterruptionMessage] = useState<string | null>(null);

  const durationMs = recorderState.durationMillis ?? 0;

  useEffect(() => {
    if (status !== 'recording' && status !== 'paused') {
      return;
    }

    if (recorderState.isRecording) {
      setStatus('recording');
      setInterruptionMessage(null);
      return;
    }

    if (!recorderState.isRecording && status === 'recording' && recorderState.canRecord) {
      setStatus('paused');
      return;
    }

    if (!recorderState.canRecord && !recorderState.isRecording) {
      setStatus('paused');
      setInterruptionMessage('ضبط قطع شد. وقتی دسترسی به صدا برقرار شد می‌توانید ادامه دهید.');
    }
  }, [recorderState.canRecord, recorderState.isRecording, status]);

  const start = useCallback(async () => {
    try {
      setStatus('requestingPermission');
      setErrorMessage(null);
      setInterruptionMessage(null);
      setResult(null);

      const granted = await audioRecordingService.requestPermission();
      if (!granted) {
        setStatus('permissionDenied');
        return;
      }

      await audioRecordingService.configureAudioMode();

      await recorder.prepareToRecordAsync();
      recorder.record();
      await wait(450);

      const currentStatus: RecorderState = recorder.getStatus();
      if (!currentStatus.isRecording) {
        throw new Error('امکان شروع ضبط میکروفون نیست. دسترسی میکروفون را بررسی کنید.');
      }

      setStatus('recording');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR);
    }
  }, [recorder]);

  const pause = useCallback(async () => {
    try {
      recorder.pause();
      await wait(120);
      setStatus('paused');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR);
    }
  }, [recorder]);

  const resume = useCallback(async () => {
    try {
      recorder.record();
      await wait(120);
      setStatus('recording');
      setInterruptionMessage(null);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR);
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      setStatus('stopping');
      await recorder.stop();

      const finalStatus = recorder.getStatus();
      const sourceUri = recorder.uri;
      if (!sourceUri) {
        throw new Error('فایل ضبط ایجاد نشد.');
      }

      const localUri = await audioRecordingService.persistRecordingUri(sourceUri, meetingId);

      try {
        await audioRecordingService.resetAudioMode();
      } catch {
        // Ignore mode reset failure if recording is already saved.
      }

      setResult({
        localUri,
        durationMs: finalStatus.durationMillis ?? durationMs,
      });
      setStatus('completed');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR);
    }
  }, [durationMs, meetingId, recorder]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setInterruptionMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          await audioRecordingService.resetAudioMode();
        } catch {
          // Ignore cleanup failures.
        }
      };

      void cleanup();
    };
  }, []);

  return {
    status,
    durationMs,
    result,
    errorMessage,
    interruptionMessage,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};
