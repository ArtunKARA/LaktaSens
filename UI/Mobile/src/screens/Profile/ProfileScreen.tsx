import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getCowList } from '../../api/cows';
import { getFeedStocks, getShipments } from '../../api/operations';
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
import { CowSummary, FeedStock, RoleCode, ShipmentSummary, roleLabels } from '../../types/domain';

const lifecycleLabels: Record<string, string> = {
  milking: 'Sagimda',
  dry: 'Kuruda',
  unknown: 'Bilinmiyor',
};

const reproductionLabels: Record<string, string> = {
  pregnant: 'Gebe',
  service: 'Serviste',
  waiting: 'Beklemede',
  unknown: 'Bilinmiyor',
};

const shipmentStatusLabels: Record<string, string> = {
  h: 'Hazirlik',
  y: 'Yolda',
  t: 'Teslim',
  i: 'Iptal',
};

export function ProfileScreen({ navigation }: MainScreenProps<'Profile'>) {
  const { user, signOut } = useAuth();
  const role = user?.role ?? 'c';
  const location = [user?.districtName, user?.cityName].filter(Boolean).join(' / ');
  const [cows, setCows] = useState<CowSummary[]>([]);
  const [stocks, setStocks] = useState<FeedStock[]>([]);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProfileData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (role === 't') {
        const [stockItems, shipmentItems] = await Promise.all([getFeedStocks(8), getShipments(6)]);
        setStocks(stockItems);
        setShipments(shipmentItems);
        setCows([]);
      } else {
        const cowItems = await getCowList(role === 'a' ? 20 : 12);
        setCows(cowItems);
        setStocks([]);
        setShipments([]);
      }
    } catch (profileError) {
      setError(getApiMessage(profileError));
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  return (
    <AppScreen>
      <Header title="Profil" eyebrow="Hesap" right={user ? <RoleBadge role={user.role} /> : undefined} />

      <PremiumCard accent>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email || '-'}</Text>
        <View style={styles.identityRow}>
          <InfoPill icon="shield-checkmark-outline" value={roleLabels[role]} />
          <InfoPill icon="business-outline" value={user?.farm || 'Firma yok'} />
        </View>
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="person-outline" title="Kisi Bilgileri" />
        <InfoRow label="Ad Soyad" value={user?.name} />
        <InfoRow label="Rol" value={roleLabels[role]} />
        <InfoRow label="Yetki" value={user?.companyRoleName || '-'} />
        <InfoRow label="Hesap Durumu" value={user?.accountStatusName || '-'} />
        <InfoRow label="E-posta" value={user?.email || '-'} />
        <InfoRow label="Telefon" value={user?.phone || '-'} />
        <InfoRow label="TC Kimlik" value={user?.nationalIdMasked || '-'} />
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="business-outline" title="Firma Bilgileri" />
        <InfoRow label="Firma" value={user?.farm || '-'} />
        <InfoRow label="Firma Turu" value={user?.companyTypeName || '-'} />
        <InfoRow label="Firma Durumu" value={user?.companyStatusName || '-'} />
        <InfoRow label="Firma E-posta" value={user?.companyEmail || '-'} />
        <InfoRow label="Firma Telefon" value={user?.companyPhone || '-'} />
        <InfoRow label="Adres" value={user?.companyAddress || '-'} />
        <InfoRow label="Bolge" value={location || user?.region || '-'} />
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <SectionTitle icon="alert-circle-outline" title="Veriler Alinamadi" />
          <Text style={styles.error}>{error}</Text>
          <AppButton label="Tekrar Dene" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadProfileData} />
        </PremiumCard>
      ) : role === 't' ? (
        <SupplierProfile loading={loading} stocks={stocks} shipments={shipments} />
      ) : (
        <CowProfile
          role={role}
          loading={loading}
          cows={cows}
          onCowPress={(cow) => navigation.navigate('MilkResult', { cowId: cow.qr })}
          onCowSuggest={(cow) => navigation.navigate('AISuggestions', { cowId: cow.qr })}
        />
      )}

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" variant="secondary" loading={loading} onPress={loadProfileData} />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
        <AppButton label="Cikis Yap" icon="log-out-outline" variant="danger" onPress={signOut} />
      </View>
    </AppScreen>
  );
}

function CowProfile({
  role,
  loading,
  cows,
  onCowPress,
  onCowSuggest,
}: {
  role: RoleCode;
  loading: boolean;
  cows: CowSummary[];
  onCowPress: (cow: CowSummary) => void;
  onCowSuggest: (cow: CowSummary) => void;
}) {
  const title = role === 'a' ? 'Sistemdeki Inekler' : 'Ineklerim';

  return (
    <PremiumCard>
      <SectionTitle icon="leaf-outline" title={title} meta={`${cows.length} kayit`} />
      {loading && cows.length === 0 ? <LoadingRow /> : null}
      {!loading && cows.length === 0 ? <EmptyState text="Listelenecek inek kaydi bulunamadi." /> : null}
      {cows.map((cow) => (
        <CowCard key={`${cow.id}-${cow.qr}`} cow={cow} onPress={() => onCowPress(cow)} onSuggest={() => onCowSuggest(cow)} />
      ))}
    </PremiumCard>
  );
}

function SupplierProfile({
  loading,
  stocks,
  shipments,
}: {
  loading: boolean;
  stocks: FeedStock[];
  shipments: ShipmentSummary[];
}) {
  return (
    <>
      <PremiumCard>
        <SectionTitle icon="cube-outline" title="Yem Stoklari" meta={`${stocks.length} kayit`} />
        {loading && stocks.length === 0 ? <LoadingRow /> : null}
        {!loading && stocks.length === 0 ? <EmptyState text="Stok kaydi bulunamadi." /> : null}
        {stocks.map((stock) => (
          <StockRow key={stock.id} stock={stock} />
        ))}
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="trail-sign-outline" title="Sevkiyatlar" meta={`${shipments.length} kayit`} />
        {loading && shipments.length === 0 ? <LoadingRow /> : null}
        {!loading && shipments.length === 0 ? <EmptyState text="Sevkiyat kaydi bulunamadi." /> : null}
        {shipments.map((shipment) => (
          <ShipmentRow key={shipment.id} shipment={shipment} />
        ))}
      </PremiumCard>
    </>
  );
}

function CowCard({ cow, onPress, onSuggest }: { cow: CowSummary; onPress: () => void; onSuggest: () => void }) {
  const lifecycle = cow.lifecycle ? lifecycleLabels[cow.lifecycle] ?? cow.lifecycle : '-';
  const reproduction = cow.reproductionStatus ? reproductionLabels[cow.reproductionStatus] ?? cow.reproductionStatus : '-';
  const milk = cow.latestMilkLiters === undefined ? '-' : `${cow.latestMilkLiters.toFixed(1)} L`;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
      <View style={styles.listIcon}>
        <Ionicons name="leaf-outline" size={20} color={colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {cow.displayName}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {cow.qr} | {cow.breed || 'Irk yok'} | {cow.companyName || 'Firma'}
        </Text>
        <View style={styles.chipRow}>
          <MiniChip text={lifecycle} />
          <MiniChip text={reproduction} />
          <MiniChip text={milk} strong />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="AI Onerileri"
        onPress={(event) => {
          event.stopPropagation();
          onSuggest();
        }}
        style={styles.inlineIconButton}
      >
        <Ionicons name="sparkles-outline" size={18} color={colors.text} />
      </Pressable>
    </Pressable>
  );
}

function StockRow({ stock }: { stock: FeedStock }) {
  return (
    <View style={styles.listItem}>
      <View style={[styles.listIcon, stock.isLow && styles.warningIcon]}>
        <Ionicons name={stock.isLow ? 'alert-outline' : 'cube-outline'} size={20} color={stock.isLow ? colors.warning : colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {stock.feedName}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {stock.companyName || 'Firma'} | {formatDate(stock.updatedAt)}
        </Text>
      </View>
      <Text style={[styles.amountText, stock.isLow && styles.warningText]}>{stock.amountKg.toFixed(0)} kg</Text>
    </View>
  );
}

function ShipmentRow({ shipment }: { shipment: ShipmentSummary }) {
  const status = shipment.status ? shipmentStatusLabels[shipment.status] ?? shipment.status : '-';

  return (
    <View style={styles.listItem}>
      <View style={styles.listIcon}>
        <Ionicons name="trail-sign-outline" size={20} color={colors.emerald} />
      </View>
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {shipment.code}
        </Text>
        <Text numberOfLines={1} style={styles.listMeta}>
          {shipment.farmerCompanyName || shipment.supplierCompanyName || 'Firma'} | {formatDate(shipment.expectedDeliveryAt)}
        </Text>
      </View>
      <View style={styles.shipmentBadge}>
        <Text style={styles.shipmentBadgeText}>{status}</Text>
        <Text style={styles.shipmentKg}>{shipment.totalKg.toFixed(0)} kg</Text>
      </View>
    </View>
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

function InfoPill({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={15} color={colors.emerald} />
      <Text numberOfLines={1} style={styles.infoPillText}>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ icon, title, meta }: { icon: keyof typeof Ionicons.glyphMap; title: string; meta?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name={icon} size={21} color={colors.emerald} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

function MiniChip({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <View style={[styles.miniChip, strong && styles.miniChipStrong]}>
      <Text numberOfLines={1} style={[styles.miniChipText, strong && styles.miniChipTextStrong]}>
        {text}
      </Text>
    </View>
  );
}

function LoadingRow() {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.emerald} />
      <Text style={styles.listMeta}>Veriler yukleniyor...</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('tr-TR') : '-';
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
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoPill: {
    minHeight: 32,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
  },
  infoPillText: {
    ...typography.caption,
    color: colors.text,
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
  listItem: {
    minHeight: 76,
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
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
  },
  warningIcon: {
    backgroundColor: 'rgba(215, 196, 134, 0.14)',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  miniChip: {
    minHeight: 24,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
  },
  miniChipStrong: {
    backgroundColor: 'rgba(159, 190, 167, 0.14)',
  },
  miniChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  miniChipTextStrong: {
    color: colors.emerald,
  },
  inlineIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  amountText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  warningText: {
    color: colors.warning,
  },
  shipmentBadge: {
    minWidth: 66,
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  shipmentBadgeText: {
    ...typography.caption,
    color: colors.emerald,
  },
  shipmentKg: {
    ...typography.caption,
    color: colors.textMuted,
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
