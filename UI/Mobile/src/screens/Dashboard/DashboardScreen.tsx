import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getDashboardSummary } from '../../api/dashboard';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { useAuth } from '../../hooks/useAuth';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { DashboardSummary } from '../../types/domain';

const fallbackTitles = {
  a: 'Admin Ozeti',
  c: 'Ciftlik Ozeti',
  t: 'Tedarik Ozeti',
};

function iconName(value: string | undefined, fallback: keyof typeof Ionicons.glyphMap) {
  return (value || fallback) as keyof typeof Ionicons.glyphMap;
}

export function DashboardScreen({ navigation }: MainScreenProps<'Dashboard'>) {
  const { user } = useAuth();
  const role = user?.role ?? 'c';
  const [summary, setSummary] = useState<DashboardSummary | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setSummary(await getDashboardSummary());
    } catch (dashboardError) {
      setError(getApiMessage(dashboardError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const targetId = summary?.primaryCowId;

  return (
    <AppScreen>
      <Header title="Dashboard" eyebrow={user?.name} right={<RoleBadge role={role} />} />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>{summary?.title ?? fallbackTitles[role]}</Text>
        <Text style={styles.heroText}>Canli backend verileriyle bugunun kritik akislarini takip et.</Text>

        {loading && !summary ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.emerald} />
            <Text style={styles.heroText}>Veriler yukleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
            <AppButton label="Tekrar Dene" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadDashboard} />
          </View>
        ) : (
          <View style={styles.metricRow}>
            {(summary?.metrics ?? []).map((metric, index) => (
              <View key={`${metric.label}-${index}`} style={styles.metric}>
                <Ionicons name={iconName(metric.icon, 'analytics-outline')} size={20} color={colors.emerald} />
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricLabel}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </PremiumCard>

      <View style={styles.actions}>
        {role === 'c' ? (
          <>
            <AppButton label="QR Tara" icon="qr-code-outline" onPress={() => navigation.navigate('QRScanner')} />
            <AppButton
              label="Sut Sonuclari"
              icon="water-outline"
              variant="secondary"
              disabled={!targetId}
              onPress={() => navigation.navigate('MilkResult', { cowId: targetId })}
            />
            <AppButton
              label="AI Onerileri"
              icon="sparkles-outline"
              variant="secondary"
              disabled={!targetId}
              onPress={() => navigation.navigate('AISuggestions', { cowId: targetId })}
            />
          </>
        ) : role === 't' ? (
          <>
            <AppButton label="Teslimat QR" icon="qr-code-outline" onPress={() => navigation.navigate('QRScanner')} />
            <AppButton
              label="Operasyon Onerileri"
              icon="bar-chart-outline"
              variant="secondary"
              onPress={() => navigation.navigate('AISuggestions', { cowId: targetId ?? 'SHIP-1' })}
            />
            <AppButton label="Profil" icon="person-circle-outline" variant="secondary" onPress={() => navigation.navigate('Profile')} />
          </>
        ) : (
          <>
            <AppButton label="Yonetim Onerileri" icon="document-text-outline" onPress={() => navigation.navigate('AISuggestions', { cowId: 'ADMIN' })} />
            <AppButton label="QR Kontrol" icon="qr-code-outline" variant="secondary" onPress={() => navigation.navigate('QRScanner')} />
            <AppButton label="Profil" icon="person-circle-outline" variant="secondary" onPress={() => navigation.navigate('Profile')} />
          </>
        )}
      </View>

      <PremiumCard>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles-outline" size={22} color={colors.emerald} />
          <Text style={styles.sectionTitle}>Canli Notlar</Text>
        </View>
        {(summary?.notes ?? []).map((note) => (
          <Text key={note} style={styles.note}>
            {note}
          </Text>
        ))}
        {!summary?.notes?.length && !loading ? <Text style={styles.note}>Backend notu bulunamadi.</Text> : null}
      </PremiumCard>

      <AppButton label="Yenile" icon="refresh-outline" variant="ghost" loading={loading} onPress={loadDashboard} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    ...typography.heading,
    color: colors.text,
  },
  heroText: {
    ...typography.body,
    color: colors.textMuted,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minHeight: 104,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  note: {
    ...typography.body,
    color: colors.textMuted,
  },
  loadingRow: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorBox: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
});
