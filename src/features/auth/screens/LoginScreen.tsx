import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

export const LoginScreen = () => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSignupMode = mode === 'signup';

  const handleSubmit = async () => {
    if (isSignupMode && !name.trim()) {
      setErrorMessage('نام را وارد کنید.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('ایمیل و رمز عبور را وارد کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      if (isSignupMode) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isSignupMode
            ? 'ثبت‌نام ناموفق بود.'
            : 'ورود ناموفق بود.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.kicker}>گفتان</Text>
          <Text style={styles.title}>{isSignupMode ? 'ساخت حساب کاربری' : 'ورود کاربر'}</Text>
          <Text style={styles.subtitle}>
            {isSignupMode
              ? 'برای شروع، نام، ایمیل و رمز عبور را وارد کنید.'
              : 'برای دسترسی به برنامه، ایمیل و رمز عبور خود را وارد کنید.'}
          </Text>

          <View style={styles.form}>
            {isSignupMode ? (
              <>
                <Text style={styles.label}>نام</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                  placeholder="نام شما"
                  placeholderTextColor={colors.textSecondary}
                  textAlign="left"
                  editable={!isSubmitting}
                />
              </>
            ) : null}

            <Text style={styles.label}>ایمیل</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              textAlign="left"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>رمز عبور</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              textAlign="left"
              editable={!isSubmitting}
              onSubmitEditing={() => void handleSubmit()}
            />
          </View>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Pressable style={styles.loginButton} onPress={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>{isSignupMode ? 'ثبت‌نام' : 'ورود'}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode((prevMode) => (prevMode === 'login' ? 'signup' : 'login'));
              setErrorMessage(null);
            }}
            disabled={isSubmitting}
          >
            <Text style={styles.switchMode}>
              {isSignupMode ? 'حساب دارید؟ ورود' : 'حساب ندارید؟ ثبت‌نام'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8,
  },
  kicker: {
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 0.8,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  form: {
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundAccent,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    color: colors.danger,
    fontFamily: typography.regular,
    fontSize: 13,
    textAlign: 'left',
  },
  switchMode: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.accent,
    fontFamily: typography.bold,
    fontSize: 14,
  },
});
