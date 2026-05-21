import { apiClient } from './client';
import { Severity, Suggestion } from '../types/domain';

const severities: Severity[] = ['low', 'medium', 'high', 'critical'];

function normalizeSeverity(value: unknown): Severity {
  return severities.includes(value as Severity) ? (value as Severity) : 'medium';
}

function normalizeSuggestion(data: Record<string, unknown>, index: number): Suggestion {
  return {
    id: String(data.id ?? `suggestion-${index}`),
    title: String(data.title ?? data.baslik ?? 'Operasyon onerisi'),
    description: String(data.description ?? data.aciklama ?? 'Detayli takip onerilir.'),
    severity: normalizeSeverity(data.severity ?? data.oncelik),
  };
}

export async function getAISuggestions(cowId: string): Promise<Suggestion[]> {
  const response = await apiClient.get(`/api/mobile/cows/${encodeURIComponent(cowId)}/ai-suggestions`);
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map((item, index) => normalizeSuggestion(item, index));
}
