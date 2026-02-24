import type { Meeting } from '../../features/meetings/models/meeting';

export type RootStackParamList = {
  MeetingsList: undefined;
  AddMeeting: undefined;
  MeetingDetail: {
    meeting: Meeting;
  };
  Recording: {
    meeting: Meeting;
  };
};
