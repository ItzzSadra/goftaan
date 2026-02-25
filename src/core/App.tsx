import { I18nManager, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider } from '../features/auth/context/AuthContext';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const App = () => {
  const [fontsLoaded] = useFonts({
    'Vazir-Regular': require('../../assets/fonts/Vazir-Regular.ttf'),
    'Vazir-Bold': require('../../assets/fonts/Vazir-Bold.ttf'),
  });

  if (!fontsLoaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
