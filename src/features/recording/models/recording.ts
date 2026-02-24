export type RecordingStatus =
  | 'idle'
  | 'requestingPermission'
  | 'permissionDenied'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'error';

export type RecordingResult = {
  localUri: string;
  durationMs: number;
};
