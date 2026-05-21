import { StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../api/client';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { useAuth } from '../../hooks/useAuth';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function ProfileScreen({ navigation }: MainScreenProps<'Profile'>) {
  const { user, token, signOut } = useAuth();

  return (
    <AppScreen>
      <Header title="Profil" eyebrow="Hesap" right={user ? <RoleBadge role={user.role} /> : undefined} />

      <PremiumCard accent>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email || '-'}</Text>
      </PremiumCard>

      <PremiumCard>
        <InfoRow label="Kullanici ID" value={user?.id} />
        <InfoRow label="Firma ID" value={user?.companyId ? String(user.companyId) : '-'} />
        <InfoRow label="API" value={API_BASE_URL} />
        <InfoRow label="Oturum" value={token ? 'Aktif' : 'Token yok'} />
      </PremiumCard>

      <View style={styles.actions}>
        <AppButton label="Dashboard" icon="home-outline" variant="secondary" onPress={() => navigation.navigate('Dashboard')} />
        <AppButton label="Cikis Yap" icon="log-out-outline" variant="danger" onPress={signOut} />
      </View>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.rowValue}>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    ...typography.heading,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.textMuted,
  },
  row: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.md,
  },
});
