import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email ve sifre gerekli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email.trim(), password);
    } catch (loginError) {
      setError(getApiMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen contentStyle={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.hero}>
          <View style={styles.markGlow}>
            <View style={styles.mark}>
              <Text style={styles.markText}>LS</Text>
            </View>
          </View>
          <Text style={styles.title}>LaktaSense</Text>
          <Text style={styles.subtitle}>Akilli ciftlik operasyonlari</Text>
        </View>

        <PremiumCard accent>
          <View style={styles.formHeader}>
            <Text style={styles.cardTitle}>Giris</Text>
            <Text style={styles.cardText}>Saha ekibi, ciftlik ve tedarik operasyonlari icin.</Text>
          </View>

          <View style={styles.form}>
            <TextField
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              icon="lock-closed-outline"
              placeholder="Sifre"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton label="Giris Yap" icon="arrow-forward" loading={loading} onPress={handleLogin} />
        </PremiumCard>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  markGlow: {
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  markText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  formHeader: {
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
  },
  cardText: {
    ...typography.body,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
});
