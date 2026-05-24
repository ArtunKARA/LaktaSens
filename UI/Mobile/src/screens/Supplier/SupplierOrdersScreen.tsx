import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { actOnSupplierOrder, getSupplierOrders } from '../../api/workflows';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SupplierOrder, WorkflowDecision } from '../../types/domain';

export function SupplierOrdersScreen({ navigation }: MainScreenProps<'SupplierOrders'>) {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [selected, setSelected] = useState<SupplierOrder | undefined>();
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setOrders(await getSupplierOrders());
    } catch (orderError) {
      setError(getApiMessage(orderError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const submitDecision = async (action: WorkflowDecision) => {
    if (!selected) {
      return;
    }

    setActing(true);
    setError('');

    try {
      await actOnSupplierOrder(selected.id, action);
      setSelected(undefined);
      await loadOrders();
    } catch (decisionError) {
      setSelected(undefined);
      setError(getApiMessage(decisionError));
    } finally {
      setActing(false);
    }
  };

  const pendingCount = orders.filter((order) => order.status === 'b').length;
  const totalKg = orders.reduce((sum, order) => sum + order.amountKg, 0);

  return (
    <AppScreen>
      <Header title="Siparisler" eyebrow="Tedarikci" />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Siparis Akisi</Text>
        <Text style={styles.heroText}>Ciftcilerden gelen siparisleri inceleyip onayla veya reddet.</Text>
        <View style={styles.summaryRow}>
          <SummaryPill icon="time-outline" label="Bekleyen" value={pendingCount} />
          <SummaryPill icon="cube-outline" label="Toplam Kg" value={totalKg.toFixed(0)} />
        </View>
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : null}

      <PremiumCard>
        <SectionTitle title="Siparis Listesi" count={orders.length} />
        {loading && orders.length === 0 ? <LoadingRow /> : null}
        {!loading && orders.length === 0 ? <Text style={styles.emptyText}>Siparis kaydi bulunamadi.</Text> : null}
        <View style={styles.list}>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onPress={() => setSelected(order)} />
          ))}
        </View>
      </PremiumCard>

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadOrders} />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>

      <OrderModal
        order={selected}
        acting={acting}
        onClose={() => !acting && setSelected(undefined)}
        onApprove={() => submitDecision('approve')}
        onReject={() => submitDecision('reject')}
      />
    </AppScreen>
  );
}

function OrderRow({ order, onPress }: { order: SupplierOrder; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
      <View style={styles.listIcon}>
        <Ionicons name="cart-outline" size={20} color={colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {order.title}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {order.farmerCompanyName || 'Ciftci'} | {formatDate(order.date)}
        </Text>
        <Text numberOfLines={1} style={styles.listMetaSoft}>
          {order.amountKg.toFixed(0)} kg | {formatMoney(order.totalAmount)}
        </Text>
      </View>
      <View style={[styles.statusChip, order.status === 'b' && styles.statusChipPending]}>
        <Text numberOfLines={1} style={styles.statusText}>
          {order.statusName || '-'}
        </Text>
      </View>
    </Pressable>
  );
}

function OrderModal({
  order,
  acting,
  onClose,
  onApprove,
  onReject,
}: {
  order?: SupplierOrder;
  acting: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!order) {
    return null;
  }

  const canAct = Boolean(order.canApprove || order.canReject);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Ionicons name="cart-outline" size={24} color={colors.emerald} />
              <View style={styles.modalTitleText}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {order.title}
                </Text>
                <Text style={styles.modalSubtitle}>{order.farmerCompanyName || 'Ciftci siparisi'}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.details}>
            <DetailRow label="Durum" value={order.statusName || '-'} />
            <DetailRow label="Tarih" value={formatDate(order.date)} />
            <DetailRow label="Kaynak" value={order.sourceType || '-'} />
            <DetailRow label="Miktar" value={`${order.amountKg.toFixed(0)} kg`} />
            <DetailRow label="Birim Fiyat" value={formatMoney(order.unitPrice)} />
            <DetailRow label="Toplam" value={formatMoney(order.totalAmount)} />
            {order.offerId ? <DetailRow label="Teklif" value={`#${order.offerId}`} /> : null}
          </View>

          {!canAct ? <Text style={styles.emptyText}>Bu siparis icin islem beklenmiyor.</Text> : null}

          <View style={styles.modalActions}>
            <AppButton
              label="Onayla"
              icon="checkmark-outline"
              loading={acting}
              disabled={!canAct}
              onPress={onApprove}
              style={styles.modalButton}
            />
            <AppButton
              label="Reddet"
              icon="close-outline"
              variant="danger"
              loading={acting}
              disabled={!canAct}
              onPress={onReject}
              style={styles.modalButton}
            />
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
      <Text style={styles.emptyText}>Siparisler yukleniyor...</Text>
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
