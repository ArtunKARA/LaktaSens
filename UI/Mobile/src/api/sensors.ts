import { apiClient } from './client';
import { SensorSummary } from '../types/domain';

function toNumber(value: unknown, fallback: number | null = null) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeSensor(data: Record<string, unknown>): SensorSummary {
  return {
    id: Number(data.id ?? data.makineID ?? 0),
    qr: String(data.qr ?? data.QR ?? ''),
    name: data.name || data.makineAd ? String(data.name ?? data.makineAd) : null,
    tankCapacity: toNumber(data.tankCapacity ?? data.hazneHacmi),
    companyId: toNumber(data.companyId ?? data.firmaID) ?? undefined,
    companyName: data.companyName ? String(data.companyName) : undefined,
    latestMilkLiters: toNumber(data.latestMilkLiters ?? data.sutMiktar),
    latestMilkAt: data.latestMilkAt ? String(data.latestMilkAt) : null,
    latestCowId: data.latestCowId ? String(data.latestCowId) : undefined,
  };
}

export async function getSensors(): Promise<SensorSummary[]> {
  const response = await apiClient.get('/api/mobile/sensors');
  const items: unknown[] = Array.isArray(response.data?.items) ? response.data.items : [];

  return items.map((item) => normalizeSensor((item ?? {}) as Record<string, unknown>));
}

export async function createSensor(input: { name: string; qr: string; tankCapacity?: number }): Promise<SensorSummary> {
  const response = await apiClient.post('/api/mobile/sensors', input);
  const rawSensor = (response.data?.sensor ?? response.data ?? {}) as Record<string, unknown>;

  return normalizeSensor(rawSensor);
}
