import type { Meeting } from '../features/meetings/models/meeting';

export type AppStackParamList = {
  HomeTabs: undefined;
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

export type HomeTabParamList = {
  MeetingsList: undefined;
  Analytics: undefined;
  Settings: undefined;
};
