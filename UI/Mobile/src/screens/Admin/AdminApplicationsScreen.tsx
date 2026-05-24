import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { actOnAdminApplication, getAdminApplications } from '../../api/workflows';
import { getApiMessage } from '../../api/client';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { AdminApplication, WorkflowDecision } from '../../types/domain';

export function AdminApplicationsScreen({ navigation }: MainScreenProps<'AdminApplications'>) {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [selected, setSelected] = useState<AdminApplication | undefined>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setApplications(await getAdminApplications());
    } catch (applicationError) {
      setError(getApiMessage(applicationError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const openApplication = (application: AdminApplication) => {
    setSelected(application);
    setReason('');
  };

  const closeModal = () => {
    if (!acting) {
      setSelected(undefined);
      setReason('');
    }
  };

  const submitDecision = async (action: WorkflowDecision) => {
    if (!selected) {
      return;
    }

    setActing(true);
    setError('');

    try {
      await actOnAdminApplication(selected.type, selected.targetId, action, reason);
      setSelected(undefined);
      setReason('');
      await loadApplications();
    } catch (decisionError) {
      setSelected(undefined);
      setError(getApiMessage(decisionError));
    } finally {
      setActing(false);
    }
  };

  return (
    <AppScreen>
      <Header title="Basvurular" eyebrow="Admin" />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Bekleyen Basvurular</Text>
        <Text style={styles.heroText}>Firma ve yem basvurularini inceleyip tek dokunusla karara bagla.</Text>
        <View style={styles.summaryRow}>
          <SummaryPill icon="business-outline" label="Firma" value={applications.filter((item) => item.type === 'company').length} />
          <SummaryPill icon="leaf-outline" label="Yem" value={applications.filter((item) => item.type === 'feed').length} />
        </View>
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : null}

      <PremiumCard>
        <SectionTitle title="Basvuru Listesi" count={applications.length} />
        {loading && applications.length === 0 ? <LoadingRow /> : null}
        {!loading && applications.length === 0 ? <Text style={styles.emptyText}>Bekleyen basvuru bulunamadi.</Text> : null}
        <View style={styles.list}>
          {applications.map((application) => (
            <ApplicationRow key={application.id} application={application} onPress={() => openApplication(application)} />
          ))}
        </View>
      </PremiumCard>

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadApplications} />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>

      <ApplicationModal
        application={selected}
        reason={reason}
        acting={acting}
        onReasonChange={setReason}
        onClose={closeModal}
        onApprove={() => submitDecision('approve')}
        onReject={() => submitDecision('reject')}
      />
    </AppScreen>
  );
}

function ApplicationRow({ application, onPress }: { application: AdminApplication; onPress: () => void }) {
  const isFeed = application.type === 'feed';
  const location = [application.district, application.city].filter(Boolean).join(' / ');

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
      <View style={styles.listIcon}>
        <Ionicons name={isFeed ? 'leaf-outline' : 'business-outline'} size={20} color={colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {application.title}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {application.subtitle || (isFeed ? 'Yem basvurusu' : 'Firma basvurusu')}
        </Text>
        <Text numberOfLines={1} style={styles.listMetaSoft}>
          {isFeed ? application.description || application.companyName || 'Detay yok' : location || application.email || 'Detay yok'}
        </Text>
      </View>
      <View style={styles.statusChip}>
        <Text numberOfLines={1} style={styles.statusText}>
          {application.statusName || 'Beklemede'}
        </Text>
      </View>
    </Pressable>
  );
}

function ApplicationModal({
  application,
  reason,
  acting,
  onReasonChange,
  onClose,
  onApprove,
  onReject,
}: {
  application?: AdminApplication;
  reason: string;
  acting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!application) {
    return null;
  }

  const isFeed = application.type === 'feed';
  const location = [application.district, application.city].filter(Boolean).join(' / ');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Ionicons name={isFeed ? 'leaf-outline' : 'business-outline'} size={24} color={colors.emerald} />
              <View style={styles.modalTitleText}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {application.title}
                </Text>
                <Text style={styles.modalSubtitle}>{application.subtitle || (isFeed ? 'Yem basvurusu' : 'Firma basvurusu')}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.details}>
            <DetailRow label="Durum" value={application.statusName || 'Beklemede'} />
            {isFeed ? (
              <>
                <DetailRow label="Firma" value={application.companyName || '-'} />
                <DetailRow label="Birim Fiyat" value={formatMoney(application.unitPrice)} />
                <DetailRow label="Min Siparis" value={formatKg(application.minOrderKg)} />
                <DetailRow label="Max Siparis" value={formatKg(application.maxOrderKg)} />
                <DetailRow label="Aciklama" value={application.description || '-'} />
              </>
            ) : (
              <>
                <DetailRow label="Firma Turu" value={application.companyTypeName || application.subtitle || '-'} />
                <DetailRow label="Telefon" value={application.phone || '-'} />
                <DetailRow label="E-posta" value={application.email || '-'} />
                <DetailRow label="Bolge" value={location || '-'} />
                <DetailRow label="Adres" value={application.address || '-'} />
              </>
            )}
            <DetailRow label="Onceki Red" value={`${application.rejectedBefore || 0}`} />
            {application.rejectedReason ? <DetailRow label="Son Red Nedeni" value={application.rejectedReason} /> : null}
          </View>

          <TextInput
            value={reason}
            onChangeText={onReasonChange}
            multiline
            placeholder="Red nedeni yazilabilir"
            placeholderTextColor={colors.textSoft}
            style={styles.reasonInput}
          />

          <View style={styles.modalActions}>
            <AppButton label="Onayla" icon="checkmark-outline" loading={acting} onPress={onApprove} style={styles.modalButton} />
            <AppButton label="Reddet" icon="close-outline" variant="danger" loading={acting} onPress={onReject} style={styles.modalButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryPill({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={18} color={colors.emerald} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name="list-outline" size={21} color={colors.emerald} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionMeta}>{count} kayit</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={3} style={styles.detailValue}>
        {value || '-'}
      </Text>
    </View>
  );
}

function LoadingRow() {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.emerald} />
      <Text style={styles.emptyText}>Basvurular yukleniyor...</Text>
    </View>
  );
}

function formatKg(value?: number | null) {
  return value === undefined || value === null ? '-' : `${value.toFixed(0)} kg`;
}

function formatMoney(value?: number | null) {
  return value === undefined || value === null ? '-' : `${value.toFixed(2)} TL`;
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryPill: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
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
  list: {
    gap: spacing.md,
  },
  listItem: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  listItemPressed: {
    opacity: 0.78,
  },
  listIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
  },
  listBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  listTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  listMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  listMetaSoft: {
    ...typography.caption,
    color: colors.textSoft,
  },
  statusChip: {
    maxWidth: 88,
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: 'rgba(159, 190, 167, 0.14)',
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.emerald,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
    padding: spacing.lg,
  },
  modalCard: {
    maxHeight: '88%',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  modalHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitleText: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.text,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  reasonInput: {
    minHeight: 82,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    color: colors.text,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  loadingRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
