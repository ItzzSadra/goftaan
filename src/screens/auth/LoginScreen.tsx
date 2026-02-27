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

import { useAuth } from '../../features/auth/context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

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
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brandRow}>
          <Text style={styles.brandDot}>●</Text>
          <Text style={styles.brandText}>Goftaan</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>گفتان</Text>
          <Text style={styles.title}>{isSignupMode ? 'ساخت حساب کاربری' : 'ورود کاربر'}</Text>
          <Text style={styles.subtitle}>
            {isSignupMode
              ? 'برای شروع، نام، ایمیل و رمز عبور را وارد کنید.'
              : 'برای دسترسی به برنامه، ایمیل و رمز عبور خود را وارد کنید.'}
          </Text>

          <View style={styles.modeSwitch}>
            <Pressable
              style={[styles.modeTab, !isSignupMode ? styles.modeTabActive : null]}
              onPress={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.modeTabText, !isSignupMode ? styles.modeTabTextActive : null]}>ورود</Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, isSignupMode ? styles.modeTabActive : null]}
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.modeTabText, isSignupMode ? styles.modeTabTextActive : null]}>ثبت‌نام</Text>
            </Pressable>
          </View>

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
  bgOrbTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: colors.accentSoft,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 140,
    backgroundColor: '#EFE3CC',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandDot: {
    color: colors.accentDark,
    fontSize: 18,
    lineHeight: 20,
  },
  brandText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: 20,
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    color: colors.accentDark,
    letterSpacing: 1,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 30,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  modeSwitch: {
    marginTop: 6,
    flexDirection: 'row',
    borderRadius: 13,
    backgroundColor: colors.backgroundAccent,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 9,
  },
  modeTabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  modeTabTextActive: {
    color: colors.textPrimary,
  },
  form: {
    gap: 7,
    marginTop: 2,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#F7F2E8',
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 14,
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
});
