import { Platform } from 'react-native';

export const isDesktopWeb = (): boolean => {
  if (Platform.OS !== 'web') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const hasFinePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
  return hasFinePointer && window.innerWidth >= 1024;
};
