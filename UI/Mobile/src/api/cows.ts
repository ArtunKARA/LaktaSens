import { apiClient } from './client';
import { CowSummary, MilkRecord, MilkValues } from '../types/domain';

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function optionalNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeCowSummary(data: Record<string, unknown>): CowSummary {
  const qr = String(data.qr ?? data.inekQR ?? data.cowId ?? data.id ?? '');

  return {
    id: toNumber(data.id ?? data.inekID, 0),
    qr,
    displayName: String(data.displayName ?? data.cowName ?? data.ad ?? `Inek ${qr}`),
    breed: data.breed || data.irk ? String(data.breed ?? data.irk) : undefined,
    lifecycle: data.lifecycle ? String(data.lifecycle) : undefined,
    reproductionStatus: data.reproductionStatus ? String(data.reproductionStatus) : undefined,
    latestMilkLiters: optionalNumber(data.latestMilkLiters ?? data.liters),
    latestMilkAt: data.latestMilkAt ? String(data.latestMilkAt) : undefined,
    milkAverage7: optionalNumber(data.milkAverage7 ?? data.average7Liters),
    companyName: data.companyName ? String(data.companyName) : undefined,
  };
}

function normalizeMilkValues(data: Record<string, unknown>, cowId: string): MilkValues {
  return {
    cowId,
    cowName: String(data.cowName ?? data.ad ?? `Inek ${cowId}`),
    liters: toNumber(data.liters ?? data.sutHacmi, 0),
    fat: toNumber(data.fat ?? data.yag, 0),
    protein: toNumber(data.protein, 0),
    scc: toNumber(data.scc ?? data.somatikHucre, 0),
    temperature: toNumber(data.temperature ?? data.sicaklik, 0),
    timestamp: String(data.timestamp ?? data.tarih ?? ''),
    qualitySource: data.qualitySource ? String(data.qualitySource) : undefined,
  };
}

function normalizeMilkRecord(data: Record<string, unknown>): MilkRecord {
  const machineId = optionalNumber(data.machineId ?? data.makineID);

  return {
    id: toNumber(data.id ?? data.olcumID, 0),
    liters: toNumber(data.liters ?? data.sutMiktar, 0),
    timestamp: String(data.timestamp ?? data.sagimTarihi ?? ''),
    machineId: machineId ?? null,
  };
}

export async function getMilkValues(cowId: string): Promise<MilkValues> {
  const response = await apiClient.get(`/api/mobile/cows/${encodeURIComponent(cowId)}/milk-values`);
  return normalizeMilkValues(response.data ?? {}, cowId);
}

export async function getMilkHistory(cowId: string, limit = 12): Promise<MilkRecord[]> {
  const response = await apiClient.get(`/api/mobile/cows/${encodeURIComponent(cowId)}/milk-history`, {
    params: { limit },
  });
  const items: unknown[] = Array.isArray(response.data?.items) ? response.data.items : [];

  return items.map((item) => normalizeMilkRecord((item ?? {}) as Record<string, unknown>));
}

export async function getCowList(limit = 20): Promise<CowSummary[]> {
  const response = await apiClient.get('/api/mobile/cows', {
    params: { limit },
  });
  const items: unknown[] = Array.isArray(response.data?.items) ? response.data.items : [];

  return items.map((item) => normalizeCowSummary((item ?? {}) as Record<string, unknown>));
}
