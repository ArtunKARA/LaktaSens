import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getMilkValues } from '../../api/cows';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { MilkValues } from '../../types/domain';

export function MilkResultScreen({ navigation, route }: MainScreenProps<'MilkResult'>) {
  const cowId = route.params?.cowId;
  const [milkValues, setMilkValues] = useState<MilkValues | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMilkValues = useCallback(async () => {
    if (!cowId) {
      setError('Sut sonucu icin once QR ile inek secilmeli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const values = await getMilkValues(cowId);
      setMilkValues(values);
    } catch (milkError) {
      setMilkValues(undefined);
      setError(getApiMessage(milkError));
    } finally {
      setLoading(false);
    }
  }, [cowId]);

  useEffect(() => {
    loadMilkValues();
  }, [loadMilkValues]);

  return (
    <AppScreen>
      <Header title="Sut Sonucu" eyebrow={cowId} />

      {error ? (
        <PremiumCard>
          <Text style={styles.cowName}>Sut sonucu alinamadi</Text>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : loading && !milkValues ? (
        <PremiumCard style={styles.loadingCard}>
          <ActivityIndicator color={colors.emerald} />
        </PremiumCard>
      ) : milkValues ? (
        <>
          <PremiumCard accent>
            <Text style={styles.cowName}>{milkValues.cowName}</Text>
            <Text style={styles.date}>{milkValues.timestamp ? new Date(milkValues.timestamp).toLocaleString('tr-TR') : '-'}</Text>
            {milkValues.qualitySource ? <Text style={styles.source}>{milkValues.qualitySource}</Text> : null}
          </PremiumCard>

          <View style={styles.grid}>
            <Metric icon="water-outline" label="Hacim" value={`${milkValues.liters.toFixed(1)} L`} />
            <Metric icon="flask-outline" label="Yag" value={`%${milkValues.fat.toFixed(1)}`} />
            <Metric icon="nutrition-outline" label="Protein" value={`%${milkValues.protein.toFixed(2)}`} />
            <Metric icon="pulse-outline" label="SCC" value={milkValues.scc.toLocaleString('tr-TR')} />
            <Metric icon="thermometer-outline" label="Sicaklik" value={`${milkValues.temperature.toFixed(1)} C`} />
            <Metric icon="checkmark-circle-outline" label="Durum" value="Izlemede" />
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" loading={loading} disabled={!cowId} onPress={loadMilkValues} />
        <AppButton
          label="AI Onerileri"
          icon="sparkles-outline"
          variant="secondary"
          disabled={!cowId}
          onPress={() => navigation.navigate('AISuggestions', { cowId })}
        />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>
    </AppScreen>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <PremiumCard style={styles.metric}>
      <Ionicons name={icon} size={22} color={colors.emerald} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cowName: {
    ...typography.heading,
    color: colors.text,
  },
  date: {
    ...typography.body,
    color: colors.textMuted,
  },
  source: {
    ...typography.caption,
    color: colors.textSoft,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    width: '47%',
    minHeight: 128,
    borderRadius: radii.md,
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
});
