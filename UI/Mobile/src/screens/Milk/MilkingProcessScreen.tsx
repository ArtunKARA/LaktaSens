import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getCowList } from '../../api/cows';
import { cancelMilkingJob, createMilkingJob, getMilkingJob } from '../../api/milkingJobs';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { TextField } from '../../components/ui/TextField';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CowSummary, MilkingJob } from '../../types/domain';

const statusText: Record<string, string> = {
  active: 'Sensor bekleniyor',
  processing: 'Olcum yapiliyor',
  completed: 'Tamamlandi',
  canceled: 'Iptal edildi',
  unknown: 'Bilinmiyor',
};

const statusIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  active: 'radio-outline',
  processing: 'sync-outline',
  completed: 'checkmark-circle-outline',
  canceled: 'close-circle-outline',
  unknown: 'help-circle-outline',
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('tr-TR') : '-';
}

export function MilkingProcessScreen({ navigation, route }: MainScreenProps<'MilkingProcess'>) {
  const [sensorQr, setSensorQr] = useState(route.params?.sensorQr ?? '');
  const [cowId, setCowId] = useState(route.params?.cowId ?? '');
  const [cows, setCows] = useState<CowSummary[]>([]);
  const [job, setJob] = useState<MilkingJob | undefined>();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');

  const selectedCow = useMemo(() => cows.find((cow) => cow.qr === cowId), [cowId, cows]);
  const canStart = Boolean(sensorQr.trim() && cowId.trim() && !loading);
  const jobOpen = job?.status === 'active' || job?.status === 'processing';

  const loadCows = useCallback(async () => {
    try {
      const items = await getCowList(50);
      setCows(items);
      setCowId((current) => current || items[0]?.qr || '');
    } catch (cowError) {
      setError(getApiMessage(cowError));
    }
  }, []);

  const refreshJob = useCallback(async () => {
    if (!job?.id) {
      return;
    }

    setPolling(true);

    try {
      const nextJob = await getMilkingJob(job.id);
      setJob(nextJob);
      if (nextJob.status === 'completed') {
        setCowId(nextJob.cowId);
      }
    } catch (jobError) {
      setError(getApiMessage(jobError));
    } finally {
      setPolling(false);
    }
  }, [job?.id]);

  async function startJob() {
    if (!canStart) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await createMilkingJob({ sensorQr: sensorQr.trim(), cowId: cowId.trim() });
      setJob(nextJob);
    } catch (startError) {
      setJob(undefined);
      setError(getApiMessage(startError));
    } finally {
      setLoading(false);
    }
  }

  async function cancelJob() {
    if (!job?.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await cancelMilkingJob(job.id);
      setJob(nextJob);
    } catch (cancelError) {
      setError(getApiMessage(cancelError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCows();
  }, [loadCows]);

  useEffect(() => {
    if (route.params?.sensorQr) {
      setSensorQr(route.params.sensorQr);
    }

    if (route.params?.cowId) {
      setCowId(route.params.cowId);
    }
  }, [route.params?.cowId, route.params?.sensorQr]);

  useEffect(() => {
    if (!jobOpen) {
      return undefined;
    }

    const timer = setInterval(() => {
      refreshJob();
    }, 4000);

    return () => clearInterval(timer);
  }, [jobOpen, refreshJob]);

  return (
    <AppScreen>
      <Header title="Sagim Sureci" eyebrow={job ? `Is emri #${job.id}` : 'Sensor esleme'} />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Sensor, inek ve is emri</Text>
        <Text style={styles.heroText}>
          Sensor QR ve inek QR eslestirilince sunucuda acik is emri olusur. NodeMCU bu emri sorgular, olcumu gonderir ve is emri kapanir.
        </Text>
      </PremiumCard>

      <PremiumCard>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="hardware-chip-outline" size={22} color={colors.emerald} />
            <Text style={styles.sectionTitle}>Sensor</Text>
          </View>
          <AppButton label="QR Tara" icon="qr-code-outline" variant="ghost" onPress={() => navigation.navigate('QRScanner')} />
        </View>
        <TextField icon="radio-outline" value={sensorQr} onChangeText={setSensorQr} placeholder="Sensor QR veya makine QR" autoCapitalize="none" />
      </PremiumCard>

      <PremiumCard>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="scan-outline" size={22} color={colors.emerald} />
            <Text style={styles.sectionTitle}>Inek</Text>
          </View>
          <AppButton label="Inek QR" icon="qr-code-outline" variant="ghost" onPress={() => navigation.navigate('QRScanner')} />
        </View>
        <TextField icon="paw-outline" value={cowId} onChangeText={setCowId} placeholder="Inek QR" autoCapitalize="none" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cowScroll}>
          {cows.map((cow) => {
            const selected = cow.qr === cowId;
            return (
              <Pressable
                key={`${cow.id}-${cow.qr}`}
                accessibilityRole="button"
                onPress={() => setCowId(cow.qr)}
                style={({ pressed }) => [styles.cowChip, selected && styles.cowChipSelected, pressed && styles.pressed]}
              >
                <Text numberOfLines={1} style={[styles.cowTitle, selected && styles.cowTextSelected]}>
                  {cow.displayName}
                </Text>
                <Text style={[styles.cowMeta, selected && styles.cowTextSelected]}>{cow.qr}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!cows.length ? <Text style={styles.metaText}>Inek listesi bos veya henuz yuklenemedi.</Text> : null}
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <Text style={styles.errorTitle}>Islem tamamlanamadi</Text>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : null}

      {job ? <JobStatusCard job={job} polling={polling} /> : null}

      <View style={styles.actions}>
        <AppButton label="Is Emri Olustur" icon="play-outline" loading={loading} disabled={!canStart} onPress={startJob} />
        {jobOpen ? <AppButton label="Is Emrini Iptal Et" icon="close-outline" variant="danger" loading={loading} onPress={cancelJob} /> : null}
        {job ? <AppButton label="Durumu Yenile" icon="refresh-outline" variant="secondary" loading={polling} onPress={refreshJob} /> : null}
        {job?.status === 'completed' ? (
          <AppButton label="Sonucu Gor" icon="water-outline" variant="secondary" onPress={() => navigation.navigate('MilkResult', { cowId: job.cowId })} />
        ) : null}
        <AppButton
          label="AI Onerileri"
          icon="sparkles-outline"
          variant="ghost"
          disabled={!cowId && !selectedCow?.qr}
          onPress={() => navigation.navigate('AISuggestions', { cowId: cowId || selectedCow?.qr })}
        />
      </View>
    </AppScreen>
  );
}

function JobStatusCard({ job, polling }: { job: MilkingJob; polling: boolean }) {
  return (
    <PremiumCard>
      <View style={styles.jobHeader}>
        <View style={styles.statusBadge}>
          <Ionicons name={statusIcon[job.status] ?? 'help-circle-outline'} size={18} color={colors.black} />
          <Text style={styles.statusText}>{statusText[job.status] ?? 'Bilinmiyor'}</Text>
        </View>
        {polling ? <ActivityIndicator color={colors.emerald} /> : null}
      </View>

      <DetailRow label="Is Emri" value={`#${job.id}`} />
      <DetailRow label="Sensor" value={job.machineName ? `${job.machineName} (${job.sensorQr})` : job.sensorQr} />
      <DetailRow label="Inek" value={job.cowName || job.cowId} />
      <DetailRow label="Olusturma" value={formatDateTime(job.createdAt)} />
      <DetailRow label="Son Yoklama" value={formatDateTime(job.lastSeenAt)} />
      {job.completedAt ? <DetailRow label="Kapanis" value={formatDateTime(job.completedAt)} /> : null}
      {job.liters ? <DetailRow label="Miktar" value={`${job.liters.toFixed(1)} L`} /> : null}
      {job.temperature ? <DetailRow label="Sicaklik" value={`${job.temperature.toFixed(1)} C`} /> : null}
    </PremiumCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
  sectionHeader: {
    minHeight: 40,
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
  },
  cowScroll: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  cowChip: {
    width: 150,
    minHeight: 82,
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  cowChipSelected: {
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
  },
  pressed: {
    opacity: 0.78,
  },
  cowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  cowMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cowTextSelected: {
    color: colors.black,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSoft,
  },
  errorTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusBadge: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    backgroundColor: colors.emerald,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    color: colors.black,
    fontWeight: '900',
  },
  detailRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.md,
  },
});
