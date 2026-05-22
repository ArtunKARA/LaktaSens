import { apiClient } from './client';
import { DashboardMetric, DashboardSummary } from '../types/domain';

function normalizeMetric(data: Record<string, unknown>): DashboardMetric {
  return {
    label: String(data.label ?? ''),
    value: String(data.value ?? ''),
    icon: data.icon ? String(data.icon) : undefined,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get('/api/mobile/dashboard');
  const data = response.data ?? {};
  const metrics: unknown[] = Array.isArray(data.metrics) ? data.metrics : [];
  const notes: unknown[] = Array.isArray(data.notes) ? data.notes : [];

  return {
    title: String(data.title ?? 'Dashboard'),
    primaryCowId: data.primaryCowId ? String(data.primaryCowId) : undefined,
    metrics: metrics.map((item) => normalizeMetric((item ?? {}) as Record<string, unknown>)),
    notes: notes.map((item) => String(item)),
  };
}
