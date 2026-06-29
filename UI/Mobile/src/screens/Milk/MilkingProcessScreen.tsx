import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getCowList } from '../../api/cows';
import { cancelMilkingJob, createMilkingJob, finishMilkingJob, getMilkingJob, submitMilkingJob } from '../../api/milkingJobs';
import { scanQr } from '../../api/qr';
import { getSensors } from '../../api/sensors';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { TextField } from '../../components/ui/TextField';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CowSummary, MilkingJob, QrScanResult, SensorSummary } from '../../types/domain';

type StepKey = 'sensor' | 'cow' | 'review' | 'measuring' | 'ready' | 'submitted';

const stepLabels: Record<StepKey, string> = {
  sensor: 'Sensor',
  cow: 'Inek',
  review: 'Onay',
  measuring: 'Olcum',
  ready: 'Gonder',
  submitted: 'Sonuc',
};

const statusText: Record<string, string> = {
  active: 'Sensor bekleniyor',
  processing: 'Olcum yapiliyor',
  ready: 'Gonderim bekliyor',
  completed: 'Tamamlandi',
  canceled: 'Iptal edildi',
  unknown: 'Bilinmiyor',
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('tr-TR') : '-';
}

function sensorFromQr(result: QrScanResult): SensorSummary {
  const data = (result.data ?? {}) as Record<string, unknown>;
  return {
    id: Number(data.id ?? 0),
    qr: String(data.qr ?? result.targetId),
    name: data.name ? String(data.name) : result.info,
    tankCapacity: Number.isFinite(Number(data.tankCapacity)) ? Number(data.tankCapacity) : null,
    companyId: Number.isFinite(Number(data.companyId)) ? Number(data.companyId) : undefined,
    companyName: data.companyName ? String(data.companyName) : undefined,
  };
}

function cowFromQr(result: QrScanResult): CowSummary {
  const data = (result.data ?? {}) as Record<string, unknown>;
  const qr = String(data.qr ?? result.cowId ?? result.targetId);
  return {
    id: Number(data.id ?? 0),
    qr,
    displayName: String(data.displayName ?? data.cowName ?? result.info ?? `Inek ${qr}`),
    breed: data.breed ? String(data.breed) : undefined,
    lifecycle: data.lifecycle ? String(data.lifecycle) : undefined,
    reproductionStatus: data.reproductionStatus ? String(data.reproductionStatus) : undefined,
    latestMilkLiters: Number.isFinite(Number(data.latestMilkLiters)) ? Number(data.latestMilkLiters) : undefined,
    latestMilkAt: data.latestMilkAt ? String(data.latestMilkAt) : undefined,
    milkAverage7: Number.isFinite(Number(data.milkAverage7)) ? Number(data.milkAverage7) : undefined,
    companyName: data.companyName ? String(data.companyName) : undefined,
  };
}

export function MilkingProcessScreen({ navigation, route }: MainScreenProps<'MilkingProcess'>) {
  const [step, setStep] = useState<StepKey>(route.params?.sensorQr ? 'cow' : 'sensor');
  const [sensorCode, setSensorCode] = useState(route.params?.sensorQr ?? '');
  const [cowCode, setCowCode] = useState(route.params?.cowId ?? '');
  const [sensor, setSensor] = useState<SensorSummary | undefined>();
  const [cow, setCow] = useState<CowSummary | undefined>();
  const [sensors, setSensors] = useState<SensorSummary[]>([]);
  const [cows, setCows] = useState<CowSummary[]>([]);
  const [job, setJob] = useState<MilkingJob | undefined>();
  const [loading, setLoading] = useState(false);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [sensorDropdownOpen, setSensorDropdownOpen] = useState(false);
  const refreshingRef = useRef(false);

  const selectedSensorFromList = useMemo(() => sensors.find((item) => item.qr === sensorCode), [sensorCode, sensors]);
  const selectedCowFromList = useMemo(() => cows.find((item) => item.qr === cowCode), [cowCode, cows]);
  const canCreate = Boolean(sensor?.qr && cow?.qr && !loading);
  const shouldAutoRefresh = Boolean(job?.id && step === 'measuring' && job.status !== 'completed' && job.status !== 'canceled');

  const loadSensors = useCallback(async () => {
    setSensorLoading(true);

    try {
      const items = await getSensors();
      setSensors(items);
    } catch (sensorError) {
      setError(getApiMessage(sensorError));
    } finally {
      setSensorLoading(false);
    }
  }, []);

  const loadCows = useCallback(async () => {
    try {
      const items = await getCowList(50);
      setCows(items);
    } catch (cowError) {
      setError(getApiMessage(cowError));
    }
  }, []);

  const refreshJob = useCallback(async () => {
    if (!job?.id || refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;
    setPolling(true);

    try {
      const nextJob = await getMilkingJob(job.id);
      setJob(nextJob);
      if (nextJob.status === 'ready') {
        setStep('ready');
      }
      if (nextJob.status === 'completed') {
        setStep('submitted');
      }
    } catch (jobError) {
      setError(getApiMessage(jobError));
    } finally {
      refreshingRef.current = false;
      setPolling(false);
    }
  }, [job?.id]);

  useEffect(() => {
    loadSensors();
    loadCows();
  }, [loadCows, loadSensors]);

  useEffect(() => {
    if (route.params?.sensorQr && !sensor) {
      validateSensor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!shouldAutoRefresh) {
      return undefined;
    }

    refreshJob();
    const timer = setInterval(() => {
      refreshJob();
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldAutoRefresh, refreshJob]);

  async function validateSensor() {
    const selectedSensor = selectedSensorFromList || sensor;

    if (selectedSensor?.qr) {
      setSensor(selectedSensor);
      setSensorCode(selectedSensor.qr);
      setSensorDropdownOpen(false);
      setError('');
      setStep('cow');
      return;
    }

    if (!sensorCode.trim()) {
      setError('Sensor secimi gerekli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await scanQr(sensorCode.trim());
      if (result.type !== 'sensor') {
        setError('Okunan QR sensor kaydi degil.');
        return;
      }

      const nextSensor = sensorFromQr(result);
      setSensor(nextSensor);
      setSensorCode(nextSensor.qr);
      setStep('cow');
    } catch (scanError) {
      setError(getApiMessage(scanError));
    } finally {
      setLoading(false);
    }
  }

  async function validateCow(code = cowCode) {
    if (!code.trim()) {
      setError('Inek QR gerekli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await scanQr(code.trim());
      if (result.type !== 'cow') {
        setError('Okunan QR inek kaydi degil.');
        return;
      }

      const nextCow = cowFromQr(result);
      setCow(nextCow);
      setCowCode(nextCow.qr);
      setStep('review');
    } catch (scanError) {
      setError(getApiMessage(scanError));
    } finally {
      setLoading(false);
    }
  }

  function selectSensorOption(nextSensor: SensorSummary) {
    setSensor(nextSensor);
    setSensorCode(nextSensor.qr);
    setSensorDropdownOpen(false);
    setError('');
  }

  async function startJob() {
    if (!canCreate || !sensor || !cow) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await createMilkingJob({ sensorQr: sensor.qr, cowId: cow.qr });
      setJob(nextJob);
      setStep('measuring');
    } catch (startError) {
      setError(getApiMessage(startError));
    } finally {
      setLoading(false);
    }
  }

  async function finishJob() {
    if (!job?.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await finishMilkingJob(job.id, { liters: job.liters, temperature: job.temperature });
      setJob(nextJob);
      setStep('ready');
    } catch (finishError) {
      setError(getApiMessage(finishError));
    } finally {
      setLoading(false);
    }
  }

  async function submitJob() {
    if (!job?.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await submitMilkingJob(job.id);
      setJob(nextJob);
      setStep('submitted');
    } catch (submitError) {
      setError(getApiMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  async function cancelJob() {
    if (!job?.id) {
      setStep('review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextJob = await cancelMilkingJob(job.id);
      setJob(nextJob);
      setStep('review');
    } catch (cancelError) {
      setError(getApiMessage(cancelError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <Header title="Sagim Sureci" eyebrow={job ? `Is emri #${job.id}` : stepLabels[step]} />

      <StepBar step={step} />

      {error ? (
        <PremiumCard>
          <Text style={styles.errorTitle}>Islem tamamlanamadi</Text>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : null}

      {step === 'sensor' ? (
        <PremiumCard accent>
          <Text style={styles.heroTitle}>1. Sensor Secimi</Text>
          <Text style={styles.heroText}>Sagim icin kullanilacak sensoru listeden sec.</Text>
          <SensorComboBox
            sensors={sensors}
            selectedSensor={selectedSensorFromList || sensor}
            open={sensorDropdownOpen}
            loading={sensorLoading}
            onToggle={() => setSensorDropdownOpen((current) => !current)}
            onSelect={selectSensorOption}
            onRefresh={loadSensors}
          />
          <AppButton label="Sensoru Onayla" icon="checkmark-outline" loading={loading} disabled={!sensorCode && !sensor} onPress={validateSensor} />
          <AppButton label="Sensor Ekle" icon="add-circle-outline" variant="secondary" onPress={() => navigation.navigate('SensorAdd')} />
        </PremiumCard>
      ) : null}

      {step === 'cow' ? (
        <PremiumCard accent>
          <Text style={styles.heroTitle}>2. Inek QR</Text>
          <Text style={styles.heroText}>Sensor onaylandi. Simdi sagim yapilacak inegi sec.</Text>
          <SelectionMiniCard title="Secili Sensor" value={sensor?.name || sensor?.qr || '-'} onPress={() => setStep('sensor')} />
          <TextField icon="scan-outline" value={cowCode} onChangeText={setCowCode} placeholder="Inek QR" autoCapitalize="none" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cowScroll}>
            {cows.map((item) => {
              const selected = item.qr === cowCode;
              return (
                <Pressable
                  key={`${item.id}-${item.qr}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setCowCode(item.qr);
                    setCow(item);
                  }}
                  style={({ pressed }) => [styles.cowChip, selected && styles.cowChipSelected, pressed && styles.pressed]}
                >
                  <Text numberOfLines={1} style={[styles.cowTitle, selected && styles.cowTextSelected]}>
                    {item.displayName}
                  </Text>
                  <Text style={[styles.cowMeta, selected && styles.cowTextSelected]}>{item.qr}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <AppButton label="Inegi Onayla" icon="checkmark-outline" loading={loading} onPress={() => validateCow(selectedCowFromList?.qr || cowCode)} />
        </PremiumCard>
      ) : null}

      {step === 'review' ? (
        <>
          <PremiumCard accent>
            <Text style={styles.heroTitle}>3. Secimleri Onayla</Text>
            <Text style={styles.heroText}>Duzeltmek icin sensor veya inek kartina bas.</Text>
            <View style={styles.reviewGrid}>
              <SelectionCard icon="hardware-chip-outline" title="Sensor" value={sensor?.name || sensor?.qr || '-'} detail={sensor?.qr} onPress={() => setStep('sensor')} />
              <SelectionCard icon="paw-outline" title="Inek" value={cow?.displayName || cowCode || '-'} detail={cow?.qr} onPress={() => setStep('cow')} />
            </View>
          </PremiumCard>
          <View style={styles.actions}>
            <AppButton label="Devam Et" icon="play-outline" loading={loading} disabled={!canCreate} onPress={startJob} />
          </View>
        </>
      ) : null}

      {step === 'measuring' ? (
        <>
          <MeasurementCard job={job} polling={polling} />
          <View style={styles.actions}>
            <AppButton label="Bitir" icon="stop-circle-outline" loading={loading} onPress={finishJob} />
            <AppButton label="Durumu Yenile" icon="refresh-outline" variant="secondary" loading={polling} onPress={refreshJob} />
            <AppButton label="Iptal" icon="close-outline" variant="danger" loading={loading} onPress={cancelJob} />
          </View>
        </>
      ) : null}

      {step === 'ready' ? (
        <>
          <MeasurementCard job={job} polling={polling} />
          <PremiumCard>
            <Text style={styles.sectionTitle}>Olcum bitti</Text>
            <Text style={styles.metaText}>Veri henuz sutOlcum tablosuna yazilmadi. Kontrol edip Gonder butonuna bas.</Text>
          </PremiumCard>
          <View style={styles.actions}>
            <AppButton label="Gonder" icon="cloud-upload-outline" loading={loading} disabled={!job?.liters} onPress={submitJob} />
            <AppButton label="Olcume Don" icon="return-up-back-outline" variant="secondary" onPress={() => setStep('measuring')} />
          </View>
        </>
      ) : null}

      {step === 'submitted' ? (
        <>
          <MeasurementCard job={job} polling={false} />
          <PremiumCard accent>
            <Text style={styles.heroTitle}>Kayit tamamlandi</Text>
            <Text style={styles.heroText}>Olcum verisi veritabanina kaydedildi. Sonuc ekrani veya sut takip sayfasi bu kaydi okuyabilir.</Text>
          </PremiumCard>
          <View style={styles.actions}>
            <AppButton label="Sonucu Gor" icon="water-outline" onPress={() => navigation.navigate('MilkResult', { cowId: job?.cowId })} />
            <AppButton label="Yeni Olcum" icon="add-circle-outline" variant="secondary" onPress={() => {
              setJob(undefined);
              setCow(undefined);
              setCowCode('');
              setStep('cow');
            }} />
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

function StepBar({ step }: { step: StepKey }) {
  const keys: StepKey[] = ['sensor', 'cow', 'review', 'measuring', 'ready', 'submitted'];
  const currentIndex = keys.indexOf(step);

  return (
    <View style={styles.stepBar}>
      {keys.map((key, index) => {
        const active = index <= currentIndex;
        return (
          <View key={key} style={[styles.stepPill, active && styles.stepPillActive]}>
            <Text style={[styles.stepText, active && styles.stepTextActive]}>{stepLabels[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SensorComboBox({
  sensors,
  selectedSensor,
  open,
  loading,
  onToggle,
  onSelect,
  onRefresh,
}: {
  sensors: SensorSummary[];
  selectedSensor?: SensorSummary;
  open: boolean;
  loading: boolean;
  onToggle: () => void;
  onSelect: (sensor: SensorSummary) => void;
  onRefresh: () => void;
}) {
  return (
    <View style={styles.comboWrapper}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.comboButton, pressed && styles.pressed]}>
        <View style={styles.comboMain}>
          <Ionicons name="hardware-chip-outline" size={22} color={colors.emerald} />
          <View style={styles.comboTextArea}>
            <Text style={styles.comboTitle}>Sensor</Text>
            <Text numberOfLines={1} style={[styles.comboValue, !selectedSensor && styles.comboPlaceholder]}>
              {selectedSensor?.name || selectedSensor?.qr || 'Sensor sec'}
            </Text>
            {selectedSensor?.qr ? <Text numberOfLines={1} style={styles.comboMeta}>{selectedSensor.qr}</Text> : null}
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.emerald} />
        ) : (
          <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={22} color={colors.textMuted} />
        )}
      </Pressable>

      {open ? (
        <View style={styles.comboMenu}>
          {sensors.length ? (
            <ScrollView nestedScrollEnabled style={styles.comboScroll} contentContainerStyle={styles.comboOptions}>
              {sensors.map((item) => {
                const selected = item.qr === selectedSensor?.qr;
                return (
                  <Pressable
                    key={`${item.id}-${item.qr}`}
                    accessibilityRole="button"
                    onPress={() => onSelect(item)}
                    style={({ pressed }) => [styles.comboOption, selected && styles.comboOptionSelected, pressed && styles.pressed]}
                  >
                    <View style={styles.comboOptionIcon}>
                      <Ionicons name={selected ? 'checkmark-circle-outline' : 'radio-button-off-outline'} size={20} color={selected ? colors.black : colors.emerald} />
                    </View>
                    <View style={styles.comboTextArea}>
                      <Text numberOfLines={1} style={[styles.comboOptionTitle, selected && styles.comboOptionTextSelected]}>
                        {item.name || `Sensor #${item.id || item.qr}`}
                      </Text>
                      <Text numberOfLines={1} style={[styles.comboOptionMeta, selected && styles.comboOptionTextSelected]}>
                        {item.qr}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.comboEmpty}>
              <Text style={styles.comboEmptyTitle}>Kayitli sensor yok</Text>
              <Text style={styles.comboEmptyText}>Once sensor ekleyip listeyi yenileyin.</Text>
            </View>
          )}

          <Pressable accessibilityRole="button" onPress={onRefresh} style={({ pressed }) => [styles.comboRefresh, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={18} color={colors.text} />
            <Text style={styles.comboRefreshText}>{loading ? 'Yenileniyor' : 'Listeyi Yenile'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SelectionMiniCard({ title, value, onPress }: { title: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.miniSelection, pressed && styles.pressed]}>
      <Text style={styles.miniSelectionTitle}>{title}</Text>
      <Text style={styles.miniSelectionValue}>{value}</Text>
    </Pressable>
  );
}

function SelectionCard({
  icon,
  title,
  value,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.selectionCard, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={colors.emerald} />
      <Text style={styles.selectionTitle}>{title}</Text>
      <Text numberOfLines={2} style={styles.selectionValue}>{value}</Text>
      {detail ? <Text style={styles.selectionDetail}>{detail}</Text> : null}
    </Pressable>
  );
}

function MeasurementCard({ job, polling }: { job?: MilkingJob; polling: boolean }) {
  return (
    <PremiumCard accent>
      <View style={styles.measureHeader}>
        <View>
          <Text style={styles.heroTitle}>{job?.liters ? `${job.liters.toFixed(2)} L` : '0.00 L'}</Text>
          <Text style={styles.heroText}>{job?.status ? statusText[job.status] : 'Is emri bekleniyor'}</Text>
        </View>
        {polling ? <ActivityIndicator color={colors.emerald} /> : <Ionicons name="water-outline" size={34} color={colors.emerald} />}
      </View>
      <DetailRow label="Is Emri" value={job?.id ? `#${job.id}` : '-'} />
      <DetailRow label="Sensor" value={job?.machineName ? `${job.machineName} (${job.sensorQr})` : job?.sensorQr || '-'} />
      <DetailRow label="Inek" value={job?.cowName || job?.cowId || '-'} />
      <DetailRow label="Son Sensor Verisi" value={formatDateTime(job?.lastSeenAt)} />
      <DetailRow label="Bitis" value={formatDateTime(job?.completedAt)} />
      {job?.temperature ? <DetailRow label="Sicaklik" value={`${job.temperature.toFixed(1)} C`} /> : null}
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
  stepBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stepPill: {
    minHeight: 30,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  stepPillActive: {
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
  },
  stepText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  stepTextActive: {
    color: colors.black,
  },
  heroTitle: {
    ...typography.heading,
    color: colors.text,
  },
  heroText: {
    ...typography.body,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
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
  miniSelection: {
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
    gap: spacing.xs,
  },
  miniSelectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  miniSelectionValue: {
    color: colors.text,
    fontWeight: '900',
  },
  comboWrapper: {
    gap: spacing.sm,
  },
  comboButton: {
    minHeight: 74,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  comboMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  comboTextArea: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  comboTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  comboValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  comboPlaceholder: {
    color: colors.textSoft,
  },
  comboMeta: {
    ...typography.caption,
    color: colors.textSoft,
  },
  comboMenu: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    overflow: 'hidden',
  },
  comboScroll: {
    maxHeight: 240,
  },
  comboOptions: {
    gap: 1,
  },
  comboOption: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceDeep,
  },
  comboOptionSelected: {
    backgroundColor: colors.emerald,
  },
  comboOptionIcon: {
    width: 24,
    alignItems: 'center',
  },
  comboOptionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  comboOptionMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  comboOptionTextSelected: {
    color: colors.black,
  },
  comboEmpty: {
    minHeight: 84,
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  comboEmptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  comboEmptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  comboRefresh: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  comboRefreshText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  reviewGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  selectionCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
    gap: spacing.sm,
  },
  selectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  selectionValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  selectionDetail: {
    ...typography.caption,
    color: colors.textSoft,
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
  pressed: {
    opacity: 0.78,
  },
  measureHeader: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
