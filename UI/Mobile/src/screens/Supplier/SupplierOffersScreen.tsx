import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getSupplierOffers, withdrawSupplierOffer } from '../../api/workflows';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SupplierOffer } from '../../types/domain';

export function SupplierOffersScreen({ navigation }: MainScreenProps<'SupplierOffers'>) {
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [selected, setSelected] = useState<SupplierOffer | undefined>();
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setOffers(await getSupplierOffers());
    } catch (offerError) {
      setError(getApiMessage(offerError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const withdrawOffer = async () => {
    if (!selected) {
      return;
    }

    setActing(true);
    setError('');

    try {
      await withdrawSupplierOffer(selected.id);
      setSelected(undefined);
      await loadOffers();
    } catch (withdrawError) {
      setSelected(undefined);
      setError(getApiMessage(withdrawError));
    } finally {
      setActing(false);
    }
  };

  const pendingCount = offers.filter((offer) => offer.status === 'b').length;
  const totalAmount = offers.reduce((sum, offer) => sum + offer.totalAmount, 0);

  return (
    <AppScreen>
      <Header title="Teklifler" eyebrow="Tedarikci" />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Teklif Takibi</Text>
        <Text style={styles.heroText}>Ihalelere verdigin teklifleri, durumlarini ve cekilebilir kayitlari takip et.</Text>
        <View style={styles.summaryRow}>
          <SummaryPill icon="time-outline" label="Bekleyen" value={pendingCount} />
          <SummaryPill icon="cash-outline" label="Teklif TL" value={formatCompactMoney(totalAmount)} />
        </View>
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : null}

      <PremiumCard>
        <SectionTitle title="Teklif Listesi" count={offers.length} />
        {loading && offers.length === 0 ? <LoadingRow /> : null}
        {!loading && offers.length === 0 ? <Text style={styles.emptyText}>Teklif kaydi bulunamadi.</Text> : null}
        <View style={styles.list}>
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} onPress={() => setSelected(offer)} />
          ))}
        </View>
      </PremiumCard>

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadOffers} />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>

      <OfferModal offer={selected} acting={acting} onClose={() => !acting && setSelected(undefined)} onWithdraw={withdrawOffer} />
    </AppScreen>
  );
}

function OfferRow({ offer, onPress }: { offer: SupplierOffer; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
      <View style={styles.listIcon}>
        <Ionicons name="pricetag-outline" size={20} color={colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {offer.title}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {offer.feedName || 'Yem'} | {formatDate(offer.date)}
        </Text>
        <Text numberOfLines={1} style={styles.listMetaSoft}>
          {offer.amountKg.toFixed(0)} kg | {formatMoney(offer.totalAmount)}
        </Text>
      </View>
      <View style={[styles.statusChip, offer.status === 'b' && styles.statusChipPending]}>
        <Text numberOfLines={1} style={styles.statusText}>
          {offer.statusName || '-'}
        </Text>
      </View>
    </Pressable>
  );
}

function OfferModal({
  offer,
  acting,
  onClose,
  onWithdraw,
}: {
  offer?: SupplierOffer;
  acting: boolean;
  onClose: () => void;
  onWithdraw: () => void;
}) {
  if (!offer) {
    return null;
  }

  const canWithdraw = Boolean(offer.canWithdraw);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Ionicons name="pricetag-outline" size={24} color={colors.emerald} />
              <View style={styles.modalTitleText}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {offer.title}
                </Text>
                <Text style={styles.modalSubtitle}>{offer.feedName || 'Teklif detayi'}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.details}>
            <DetailRow label="Teklif Durumu" value={offer.statusName || '-'} />
            <DetailRow label="Ihale Durumu" value={offer.auctionStatusName || '-'} />
            <DetailRow label="Tarih" value={formatDate(offer.date)} />
            <DetailRow label="Miktar" value={`${offer.amountKg.toFixed(0)} kg`} />
            <DetailRow label="Birim Fiyat" value={formatMoney(offer.unitPrice)} />
            <DetailRow label="Toplam" value={formatMoney(offer.totalAmount)} />
            <DetailRow label="Talep" value={formatOptionalKg(offer.requestedKg)} />
            <DetailRow label="Kalan" value={formatOptionalKg(offer.remainingKg)} />
            <DetailRow label="Bitis" value={formatDate(offer.auctionEndsAt)} />
          </View>

          {!canWithdraw ? <Text style={styles.emptyText}>Bu teklif artik geri cekilebilir durumda degil.</Text> : null}

          <View style={styles.modalActions}>
            <AppButton
              label="Geri Cek"
              icon="return-down-back-outline"
              variant="danger"
              loading={acting}
              disabled={!canWithdraw}
              onPress={onWithdraw}
              style={styles.modalButton}
            />
            <AppButton label="Kapat" icon="close-outline" variant="secondary" disabled={acting} onPress={onClose} style={styles.modalButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryPill({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={18} color={colors.emerald} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.summaryValue}>
        {value}
      </Text>
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
      <Text numberOfLines={2} style={styles.detailValue}>
        {value || '-'}
      </Text>
    </View>
  );
}

function LoadingRow() {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.emerald} />
      <Text style={styles.emptyText}>Teklifler yukleniyor...</Text>
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
}

function formatMoney(value?: number) {
  return value === undefined ? '-' : `${value.toFixed(2)} TL`;
}

function formatCompactMoney(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toFixed(0);
}

function formatOptionalKg(value?: number) {
  return value === undefined ? '-' : `${value.toFixed(0)} kg`;
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
    maxWidth: 92,
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
  },
  statusChipPending: {
    backgroundColor: 'rgba(215, 196, 134, 0.14)',
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
    padding: spacing.lg,
  },
  modalCard: {
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
