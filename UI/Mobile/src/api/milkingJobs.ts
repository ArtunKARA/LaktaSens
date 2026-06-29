import { apiClient } from './client';
import { MilkingJob } from '../types/domain';

function toNumber(value: unknown, fallback: number | null = null) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeMilkingJob(data: Record<string, unknown>): MilkingJob {
  return {
    id: Number(data.id ?? data.isEmriID ?? 0),
    sensorQr: String(data.sensorQr ?? data.sensorQR ?? data.SensorQR ?? ''),
    machineId: toNumber(data.machineId ?? data.makineID),
    machineName: data.machineName || data.makineAd ? String(data.machineName ?? data.makineAd) : null,
    cowId: String(data.cowId ?? data.inekQR ?? ''),
    cowInternalId: toNumber(data.cowInternalId ?? data.inekID) ?? undefined,
    cowName: data.cowName ? String(data.cowName) : undefined,
    companyId: toNumber(data.companyId ?? data.firmaID) ?? undefined,
    companyName: data.companyName ? String(data.companyName) : undefined,
    status: (data.status as MilkingJob['status']) || 'unknown',
    statusCode: data.statusCode ? String(data.statusCode) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : null,
    startedAt: data.startedAt ? String(data.startedAt) : null,
    lastSeenAt: data.lastSeenAt ? String(data.lastSeenAt) : null,
    completedAt: data.completedAt ? String(data.completedAt) : null,
    liters: toNumber(data.liters),
    temperature: toNumber(data.temperature),
    note: data.note ? String(data.note) : undefined,
    isOpen: Boolean(data.isOpen),
  };
}

function extractJob(data: Record<string, unknown>): MilkingJob {
  const rawJob = (data.job ?? data) as Record<string, unknown>;
  return normalizeMilkingJob(rawJob);
}

export async function createMilkingJob(input: { sensorQr: string; cowId: string }): Promise<MilkingJob> {
  const response = await apiClient.post('/api/mobile/milking-jobs', input);
  return extractJob(response.data ?? {});
}

export async function getMilkingJob(jobId: number): Promise<MilkingJob> {
  const response = await apiClient.get(`/api/mobile/milking-jobs/${jobId}`);
  return extractJob(response.data ?? {});
}

export async function cancelMilkingJob(jobId: number): Promise<MilkingJob> {
  const response = await apiClient.post(`/api/mobile/milking-jobs/${jobId}/cancel`);
  return extractJob(response.data ?? {});
}
