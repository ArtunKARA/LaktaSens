import { apiClient } from './client';
import { FeedStock, ShipmentSummary } from '../types/domain';

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeFeedStock(data: Record<string, unknown>): FeedStock {
  return {
    id: toNumber(data.id, 0),
    feedName: String(data.feedName ?? data.yemAdi ?? 'Yem'),
    amountKg: toNumber(data.amountKg ?? data.miktarKg, 0),
    isLow: Boolean(data.isLow),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    companyName: data.companyName ? String(data.companyName) : undefined,
  };
}

function normalizeShipment(data: Record<string, unknown>): ShipmentSummary {
  return {
    id: toNumber(data.id, 0),
    code: String(data.code ?? `SHIP-${data.id ?? ''}`),
    status: data.status ? String(data.status) : undefined,
    totalKg: toNumber(data.totalKg, 0),
    expectedDeliveryAt: data.expectedDeliveryAt ? String(data.expectedDeliveryAt) : undefined,
    farmerCompanyName: data.farmerCompanyName ? String(data.farmerCompanyName) : undefined,
    supplierCompanyName: data.supplierCompanyName ? String(data.supplierCompanyName) : undefined,
  };
}

export async function getFeedStocks(limit = 10): Promise<FeedStock[]> {
  const response = await apiClient.get('/api/mobile/feed-stocks', {
    params: { limit },
  });
  const items: unknown[] = Array.isArray(response.data?.items) ? response.data.items : [];

  return items.map((item) => normalizeFeedStock((item ?? {}) as Record<string, unknown>));
}

export async function getShipments(limit = 10): Promise<ShipmentSummary[]> {
  const response = await apiClient.get('/api/mobile/shipments', {
    params: { limit },
  });
  const items: unknown[] = Array.isArray(response.data?.items) ? response.data.items : [];

  return items.map((item) => normalizeShipment((item ?? {}) as Record<string, unknown>));
}
