import { apiClient } from './client';
import { MilkValues } from '../types/domain';

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
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

export async function getMilkValues(cowId: string): Promise<MilkValues> {
  const response = await apiClient.get(`/api/mobile/cows/${encodeURIComponent(cowId)}/milk-values`);
  return normalizeMilkValues(response.data ?? {}, cowId);
}
