import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getCowList, getMilkHistory, getMilkValues } from '../../api/cows';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CowSummary, MilkRecord, MilkValues } from '../../types/domain';

function percentWidth(value: number) {
  return `${Math.max(4, Math.min(100, value))}%` as `${number}%`;
}

export function MilkResultScreen({ navigation, route }: MainScreenProps<'MilkResult'>) {
  const initialCowId = route.params?.cowId;
  const [selectedCowId, setSelectedCowId] = useState(initialCowId);
  const [cows, setCows] = useState<CowSummary[]>([]);
  const [milkValues, setMilkValues] = useState<MilkValues | undefined>();
  const [milkHistory, setMilkHistory] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [cowLoading, setCowLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCowOptions = useCallback(async () => {
    setCowLoading(true);

    try {
      const cowItems = await getCowList(50);
      setCows(cowItems);
      setSelectedCowId((current) => current || cowItems[0]?.qr);
    } catch (cowError) {
      setError(getApiMessage(cowError));
    } finally {
      setCowLoading(false);
    }
  }, []);

  const loadMilkValues = useCallback(async (cowCode?: string) => {
    if (!cowCode) {
      setError('Sut sonucu icin once bir inek secilmeli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [values, history] = await Promise.all([getMilkValues(cowCode), getMilkHistory(cowCode, 12)]);
      setMilkValues(values);
      setMilkHistory(history);
    } catch (milkError) {
      setMilkValues(undefined);
      setMilkHistory([]);
      setError(getApiMessage(milkError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCowOptions();
  }, [loadCowOptions]);

  useEffect(() => {
    if (initialCowId) {
      setSelectedCowId(initialCowId);
    }
  }, [initialCowId]);

  useEffect(() => {
    if (selectedCowId) {
      loadMilkValues(selectedCowId);
    }
  }, [loadMilkValues, selectedCowId]);

  const refreshScreen = useCallback(async () => {
    await loadCowOptions();
    await loadMilkValues(selectedCowId);
  }, [loadCowOptions, loadMilkValues, selectedCowId]);

  return (
    <AppScreen>
      <Header title="Sut Sonucu" eyebrow={selectedCowId || 'Inek sec'} />

      <CowSelector
        cows={cows}
        selectedCowId={selectedCowId}
        loading={cowLoading}
        onSelect={(cow) => setSelectedCowId(cow.qr)}
      />

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

          <MilkHistoryCard records={milkHistory} />
        </>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" loading={loading || cowLoading} disabled={!selectedCowId} onPress={refreshScreen} />
        <AppButton
          label="AI Onerileri"
          icon="sparkles-outline"
          variant="secondary"
          disabled={!selectedCowId}
          onPress={() => navigation.navigate('AISuggestions', { cowId: selectedCowId })}
        />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>
    </AppScreen>
  );
}

function CowSelector({
  cows,
  selectedCowId,
  loading,
  onSelect,
}: {
  cows: CowSummary[];
  selectedCowId?: string;
  loading: boolean;
  onSelect: (cow: CowSummary) => void;
}) {
  return (
    <PremiumCard>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Ionicons name="list-outline" size={22} color={colors.emerald} />
          <Text style={styles.sectionTitle}>Inek Sec</Text>
        </View>
        <Text style={styles.sectionMeta}>{cows.length} inek</Text>
      </View>

      {loading && cows.length === 0 ? (
        <View style={styles.selectorLoading}>
          <ActivityIndicator color={colors.emerald} />
          <Text style={styles.source}>Inekler yukleniyor...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {cows.map((cow) => {
            const selected = cow.qr === selectedCowId;
            return (
              <Pressable
                key={`${cow.id}-${cow.qr}`}
                accessibilityRole="button"
                onPress={() => onSelect(cow)}
                style={({ pressed }) => [styles.cowOption, selected && styles.cowOptionSelected, pressed && styles.cowOptionPressed]}
              >
                <Text numberOfLines={1} style={[styles.cowOptionTitle, selected && styles.cowOptionTitleSelected]}>
                  {cow.displayName}
                </Text>
                <Text style={styles.cowOptionQr}>{cow.qr}</Text>
                <View style={styles.cowOptionMetric}>
                  <Ionicons name="water-outline" size={14} color={selected ? colors.black : colors.emerald} />
                  <Text style={[styles.cowOptionMilk, selected && styles.cowOptionMilkSelected]}>
                    {cow.latestMilkLiters === undefined ? '-' : `${cow.latestMilkLiters.toFixed(1)} L`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {!loading && cows.length === 0 ? <Text style={styles.source}>Inek kaydi bulunamadi.</Text> : null}
    </PremiumCard>
  );
}

function MilkHistoryCard({ records }: { records: MilkRecord[] }) {
  const total = records.reduce((sum, record) => sum + record.liters, 0);
  const average = records.length ? total / records.length : 0;
  const max = Math.max(...records.map((record) => record.liters), 1);

  return (
    <PremiumCard>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Ionicons name="bar-chart-outline" size={22} color={colors.emerald} />
          <Text style={styles.sectionTitle}>Inek Bazli Kayitlar</Text>
        </View>
        <Text style={styles.sectionMeta}>{records.length} olcum</Text>
      </View>

      {records.length ? (
        <>
          <View style={styles.historySummary}>
            <MiniMetric label="Toplam" value={`${total.toFixed(1)} L`} />
            <MiniMetric label="Ortalama" value={`${average.toFixed(1)} L`} />
            <MiniMetric label="En Yuksek" value={`${max.toFixed(1)} L`} />
          </View>

          <View style={styles.historyList}>
            {records.map((record) => (
              <View key={record.id} style={styles.historyRow}>
                <View style={styles.historyText}>
                  <Text style={styles.historyDate}>{formatDateTime(record.timestamp)}</Text>
                  <Text style={styles.historyMachine}>{record.machineId ? `Makine ${record.machineId}` : 'Makine bilgisi yok'}</Text>
                </View>
                <View style={styles.historyBarWrap}>
                  <View style={styles.historyBarTrack}>
                    <View style={[styles.historyBarFill, { width: percentWidth((record.liters / max) * 100) }]} />
                  </View>
                  <Text style={styles.historyValue}>{record.liters.toFixed(1)} L</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.source}>Bu inek icin sut olcum kaydi bulunamadi.</Text>
      )}
    </PremiumCard>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.miniMetricValue}>
        {value}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.miniMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

function formatDateTime(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('tr-TR') : '-';
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
  selectorLoading: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectorScroll: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  cowOption: {
    width: 154,
    minHeight: 96,
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  cowOptionSelected: {
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
  },
  cowOptionPressed: {
    opacity: 0.78,
  },
  cowOptionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  cowOptionTitleSelected: {
    color: colors.black,
  },
  cowOptionQr: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cowOptionMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cowOptionMilk: {
    ...typography.caption,
    color: colors.text,
  },
  cowOptionMilkSelected: {
    color: colors.black,
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
  sectionHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.textSoft,
  },
  historySummary: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniMetric: {
    flex: 1,
    minHeight: 78,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  miniMetricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  miniMetricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historyList: {
    gap: spacing.md,
  },
  historyRow: {
    minHeight: 62,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyDate: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  historyMachine: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historyBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  historyBarFill: {
    height: '100%',
    borderRadius: radii.sm,
    backgroundColor: colors.emerald,
  },
  historyValue: {
    ...typography.caption,
    color: colors.text,
    minWidth: 48,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.md,
  },
});
