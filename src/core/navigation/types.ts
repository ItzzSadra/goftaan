import type { Meeting } from '../../features/meetings/models/meeting';

export type AppStackParamList = {
  MeetingsList: undefined;
  AddMeeting: undefined;
  MeetingDetail: {
    meeting: Meeting;
  };
  Recording: {
    meeting: Meeting;
  };
};

export type AuthStackParamList = {
  Login: undefined;
};
