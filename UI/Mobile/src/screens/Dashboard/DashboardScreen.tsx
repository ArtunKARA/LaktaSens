import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getCowList } from '../../api/cows';
import { getDashboardSummary } from '../../api/dashboard';
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
import { CowSummary, DashboardSummary, FeedStock, RoleCode, ShipmentSummary } from '../../types/domain';

const fallbackTitles = {
  a: 'Admin Ozeti',
  c: 'Ciftlik Ozeti',
  t: 'Tedarik Ozeti',
};

const lifecycleLabels: Record<string, string> = {
  milking: 'Sagimda',
  dry: 'Kuruda',
  unknown: 'Bilinmiyor',
};

const shipmentStatusLabels: Record<string, string> = {
  h: 'Hazirlik',
  y: 'Yolda',
  t: 'Teslim',
  i: 'Iptal',
};

interface DashboardInsights {
  cows: CowSummary[];
  stocks: FeedStock[];
  shipments: ShipmentSummary[];
}

interface BarDatum {
  label: string;
  value: number;
  detail?: string;
  color?: string;
}

const emptyInsights: DashboardInsights = {
  cows: [],
  stocks: [],
  shipments: [],
};

function iconName(value: string | undefined, fallback: keyof typeof Ionicons.glyphMap) {
  return (value || fallback) as keyof typeof Ionicons.glyphMap;
}

function percentWidth(value: number) {
  return `${Math.max(4, Math.min(100, value))}%` as `${number}%`;
}

function average(values: Array<number | undefined>) {
  const clean = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!clean.length) {
    return 0;
  }

  return clean.reduce((total, value) => total + value, 0) / clean.length;
}

function countBy<T>(items: T[], keyGetter: (item: T) => string | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyGetter(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function loadInsights(role: RoleCode): Promise<DashboardInsights> {
  if (role === 't') {
    const [stocks, shipments] = await Promise.all([getFeedStocks(8), getShipments(8)]);
    return { cows: [], stocks, shipments };
  }

  if (role === 'a') {
    const [cows, stocks, shipments] = await Promise.all([getCowList(24), getFeedStocks(8), getShipments(8)]);
    return { cows, stocks, shipments };
  }

  const cows = await getCowList(16);
  return { cows, stocks: [], shipments: [] };
}

export function DashboardScreen({ navigation }: MainScreenProps<'Dashboard'>) {
  const { user } = useAuth();
  const role = user?.role ?? 'c';
  const [summary, setSummary] = useState<DashboardSummary | undefined>();
  const [insights, setInsights] = useState<DashboardInsights>(emptyInsights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [nextSummary, nextInsights] = await Promise.all([getDashboardSummary(), loadInsights(role)]);
      setSummary(nextSummary);
      setInsights(nextInsights);
    } catch (dashboardError) {
      setError(getApiMessage(dashboardError));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const targetId = summary?.primaryCowId;

  return (
    <AppScreen>
      <Header
        title="Dashboard"
        eyebrow={user?.name}
        right={
          <View style={styles.headerActions}>
            <RoleBadge role={role} />
            <ProfileShortcut onPress={() => navigation.navigate('Profile')} />
          </View>
        }
      />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>{summary?.title ?? fallbackTitles[role]}</Text>
        <Text style={styles.heroText}>Bugunun operasyon sinyalleri ve son kayitlar.</Text>

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
          <MetricStrip metrics={summary?.metrics ?? []} />
        )}
      </PremiumCard>

      <RoleInsights
        role={role}
        loading={loading}
        insights={insights}
        onCowPress={(cow) => navigation.navigate('MilkResult', { cowId: cow.qr })}
      />

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
            <AppButton label="Siparisler" icon="cart-outline" variant="secondary" onPress={() => navigation.navigate('SupplierOrders')} />
            <AppButton label="Teklifler" icon="pricetag-outline" variant="secondary" onPress={() => navigation.navigate('SupplierOffers')} />
            <AppButton
              label="Operasyon Onerileri"
              icon="bar-chart-outline"
              variant="secondary"
              onPress={() => navigation.navigate('AISuggestions', { cowId: targetId ?? 'SHIP-1' })}
            />
          </>
        ) : (
          <>
            <AppButton label="Basvurular" icon="clipboard-outline" onPress={() => navigation.navigate('AdminApplications')} />
            <AppButton label="Yonetim Onerileri" icon="document-text-outline" onPress={() => navigation.navigate('AISuggestions', { cowId: 'ADMIN' })} />
            <AppButton label="QR Kontrol" icon="qr-code-outline" variant="secondary" onPress={() => navigation.navigate('QRScanner')} />
          </>
        )}
      </View>

      <PremiumCard>
        <SectionTitle icon="sparkles-outline" title="Canli Notlar" />
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

function MetricStrip({ metrics }: { metrics: DashboardSummary['metrics'] }) {
  return (
    <View style={styles.metricRow}>
      {metrics.map((metric, index) => (
        <View key={`${metric.label}-${index}`} style={styles.metric}>
          <Ionicons name={iconName(metric.icon, 'analytics-outline')} size={20} color={colors.emerald} />
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricLabel}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RoleInsights({
  role,
  loading,
  insights,
  onCowPress,
}: {
  role: RoleCode;
  loading: boolean;
  insights: DashboardInsights;
  onCowPress: (cow: CowSummary) => void;
}) {
  if (role === 't') {
    return <SupplierInsights loading={loading} stocks={insights.stocks} shipments={insights.shipments} />;
  }

  if (role === 'a') {
    return <AdminInsights loading={loading} cows={insights.cows} stocks={insights.stocks} shipments={insights.shipments} />;
  }

  return <FarmerInsights loading={loading} cows={insights.cows} onCowPress={onCowPress} />;
}

function FarmerInsights({ loading, cows, onCowPress }: { loading: boolean; cows: CowSummary[]; onCowPress: (cow: CowSummary) => void }) {
  const lifecycle = countBy(cows, (cow) => cow.lifecycle);
  const pregnantCount = cows.filter((cow) => cow.reproductionStatus === 'pregnant').length;
  const avgMilk = average(cows.map((cow) => cow.latestMilkLiters));
  const topMilk = [...cows]
    .filter((cow) => typeof cow.latestMilkLiters === 'number')
    .sort((left, right) => (right.latestMilkLiters || 0) - (left.latestMilkLiters || 0))
    .slice(0, 5);

  return (
    <>
      <PremiumCard>
        <SectionTitle icon="leaf-outline" title="Suru Durumu" meta={`${cows.length} inek`} />
        {loading && cows.length === 0 ? <SmallLoading /> : null}
        <InsightGrid
          items={[
            { label: 'Ort. Sut', value: `${avgMilk.toFixed(1)} L`, icon: 'water-outline' },
            { label: 'Sagimda', value: lifecycle.milking || 0, icon: 'pulse-outline' },
            { label: 'Gebe', value: pregnantCount, icon: 'heart-outline' },
          ]}
        />
        <DistributionBars
          data={[
            { label: lifecycleLabels.milking, value: lifecycle.milking || 0, color: colors.emerald },
            { label: lifecycleLabels.dry, value: lifecycle.dry || 0, color: colors.gold },
            { label: lifecycleLabels.unknown, value: lifecycle.unknown || 0, color: colors.textSoft },
          ]}
        />
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="bar-chart-outline" title="Sut Liderleri" meta="son olcum" />
        {topMilk.length ? (
          <HorizontalBars
            data={topMilk.map((cow) => ({
              label: cow.displayName,
              value: cow.latestMilkLiters || 0,
              detail: cow.qr,
              color: colors.emerald,
            }))}
            unit="L"
            onPress={(index) => onCowPress(topMilk[index])}
          />
        ) : (
          <EmptyText text="Sut olcum kaydi bulunamadi." />
        )}
      </PremiumCard>
    </>
  );
}

function SupplierInsights({ loading, stocks, shipments }: { loading: boolean; stocks: FeedStock[]; shipments: ShipmentSummary[] }) {
  const totalStock = stocks.reduce((total, stock) => total + stock.amountKg, 0);
  const lowStock = stocks.filter((stock) => stock.isLow).length;
  const shipmentStatus = countBy(shipments, (shipment) => shipment.status);
  const stockBars = [...stocks].sort((left, right) => right.amountKg - left.amountKg).slice(0, 5);

  return (
    <>
      <PremiumCard>
        <SectionTitle icon="cube-outline" title="Stok Ozeti" meta={`${stocks.length} yem`} />
        {loading && stocks.length === 0 ? <SmallLoading /> : null}
        <InsightGrid
          items={[
            { label: 'Toplam', value: `${totalStock.toFixed(0)} kg`, icon: 'cube-outline' },
            { label: 'Kritik', value: lowStock, icon: 'alert-outline' },
            { label: 'Sevkiyat', value: shipments.length, icon: 'trail-sign-outline' },
          ]}
        />
        {stockBars.length ? (
          <HorizontalBars
            data={stockBars.map((stock) => ({
              label: stock.feedName,
              value: stock.amountKg,
              detail: stock.isLow ? 'kritik stok' : stock.companyName,
              color: stock.isLow ? colors.warning : colors.emerald,
            }))}
            unit="kg"
          />
        ) : (
          <EmptyText text="Stok kaydi bulunamadi." />
        )}
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="analytics-outline" title="Sevkiyat Akisi" meta={`${shipments.length} kayit`} />
        <DistributionBars
          data={[
            { label: shipmentStatusLabels.h, value: shipmentStatus.h || 0, color: colors.gold },
            { label: shipmentStatusLabels.y, value: shipmentStatus.y || 0, color: colors.emerald },
            { label: shipmentStatusLabels.t, value: shipmentStatus.t || 0, color: colors.success },
            { label: shipmentStatusLabels.i, value: shipmentStatus.i || 0, color: colors.danger },
          ]}
        />
      </PremiumCard>
    </>
  );
}

function AdminInsights({
  loading,
  cows,
  stocks,
  shipments,
}: {
  loading: boolean;
  cows: CowSummary[];
  stocks: FeedStock[];
  shipments: ShipmentSummary[];
}) {
  const lifecycle = countBy(cows, (cow) => cow.lifecycle);
  const farmCounts = Object.entries(countBy(cows, (cow) => cow.companyName)).sort((left, right) => right[1] - left[1]).slice(0, 5);
  const shipmentStatus = countBy(shipments, (shipment) => shipment.status);
  const totalStock = stocks.reduce((total, stock) => total + stock.amountKg, 0);

  return (
    <>
      <PremiumCard>
        <SectionTitle icon="business-outline" title="Sistem Panorami" meta="canli ozet" />
        {loading && cows.length === 0 ? <SmallLoading /> : null}
        <InsightGrid
          items={[
            { label: 'Inek', value: cows.length, icon: 'leaf-outline' },
            { label: 'Stok', value: `${totalStock.toFixed(0)} kg`, icon: 'cube-outline' },
            { label: 'Sevkiyat', value: shipments.length, icon: 'trail-sign-outline' },
          ]}
        />
        <DistributionBars
          data={[
            { label: lifecycleLabels.milking, value: lifecycle.milking || 0, color: colors.emerald },
            { label: lifecycleLabels.dry, value: lifecycle.dry || 0, color: colors.gold },
            { label: lifecycleLabels.unknown, value: lifecycle.unknown || 0, color: colors.textSoft },
          ]}
        />
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="bar-chart-outline" title="Firma Dagilimi" meta="inek sayisi" />
        {farmCounts.length ? (
          <HorizontalBars
            data={farmCounts.map(([companyName, count]) => ({
              label: companyName === 'unknown' ? 'Firma yok' : companyName,
              value: count,
              detail: `${count} inek`,
              color: colors.emerald,
            }))}
          />
        ) : (
          <EmptyText text="Firma dagilimi icin kayit bulunamadi." />
        )}
      </PremiumCard>

      <PremiumCard>
        <SectionTitle icon="analytics-outline" title="Tedarik Hareketi" meta="durum dagilimi" />
        <DistributionBars
          data={[
            { label: shipmentStatusLabels.h, value: shipmentStatus.h || 0, color: colors.gold },
            { label: shipmentStatusLabels.y, value: shipmentStatus.y || 0, color: colors.emerald },
            { label: shipmentStatusLabels.t, value: shipmentStatus.t || 0, color: colors.success },
            { label: shipmentStatusLabels.i, value: shipmentStatus.i || 0, color: colors.danger },
          ]}
        />
      </PremiumCard>
    </>
  );
}

function InsightGrid({ items }: { items: Array<{ label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }> }) {
  return (
    <View style={styles.insightGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.insightTile}>
          <Ionicons name={item.icon} size={20} color={colors.emerald} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.insightValue}>
            {item.value}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.insightLabel}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DistributionBars({ data }: { data: BarDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.distributionWrap}>
      {data.map((item) => {
        const width = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <View key={item.label} style={styles.distributionRow}>
            <View style={styles.distributionLabelRow}>
              <Text numberOfLines={1} style={styles.barLabel}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: percentWidth(width), backgroundColor: item.color || colors.emerald }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function HorizontalBars({ data, unit, onPress }: { data: BarDatum[]; unit?: string; onPress?: (index: number) => void }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.horizontalBars}>
      {data.map((item, index) => {
        const width = (item.value / max) * 100;
        return (
          <Pressable
            key={`${item.label}-${index}`}
            accessibilityRole={onPress ? 'button' : undefined}
            onPress={onPress ? () => onPress(index) : undefined}
            style={({ pressed }) => [styles.horizontalBarItem, pressed && styles.horizontalBarPressed]}
          >
            <View style={styles.horizontalBarHeader}>
              <Text numberOfLines={1} style={styles.barLabel}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>
                {item.value.toFixed(unit ? 0 : 0)} {unit || ''}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: percentWidth(width), backgroundColor: item.color || colors.emerald }]} />
            </View>
            {item.detail ? (
              <Text numberOfLines={1} style={styles.barDetail}>
                {item.detail}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionTitle({ icon, title, meta }: { icon: keyof typeof Ionicons.glyphMap; title: string; meta?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name={icon} size={22} color={colors.emerald} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

function SmallLoading() {
  return (
    <View style={styles.smallLoading}>
      <ActivityIndicator color={colors.emerald} />
      <Text style={styles.note}>Veriler yukleniyor...</Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return <Text style={styles.note}>{text}</Text>;
}

function ProfileShortcut({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profil"
      onPress={onPress}
      style={({ pressed }) => [styles.profileShortcut, pressed && styles.profileShortcutPressed]}
    >
      <Ionicons name="person-circle-outline" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileShortcut: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  profileShortcutPressed: {
    opacity: 0.76,
  },
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
  insightGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  insightTile: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  insightValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  insightLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  distributionWrap: {
    gap: spacing.md,
  },
  distributionRow: {
    gap: spacing.xs,
  },
  distributionLabelRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  horizontalBars: {
    gap: spacing.md,
  },
  horizontalBarItem: {
    gap: spacing.xs,
  },
  horizontalBarPressed: {
    opacity: 0.78,
  },
  horizontalBarHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  barValue: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
  },
  barDetail: {
    ...typography.caption,
    color: colors.textSoft,
  },
  barTrack: {
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  actions: {
    gap: spacing.md,
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
  smallLoading: {
    minHeight: 42,
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
