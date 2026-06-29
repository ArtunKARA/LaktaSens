import { apiClient } from './client';
import { QrScanResult } from '../types/domain';

function normalizeQrResult(data: Record<string, unknown>, code: string): QrScanResult {
  return {
    type: (data.type as QrScanResult['type']) || 'unknown',
    targetId: String(data.targetId ?? data.id ?? code),
    message: String(data.message ?? 'QR kaydi bulundu.'),
    cowId: data.cowId ? String(data.cowId) : undefined,
    info: data.info ? String(data.info) : undefined,
    data: data.data,
  };
}

export async function scanQr(code: string): Promise<QrScanResult> {
  const response = await apiClient.post('/api/mobile/qr/scan', { code });
  return normalizeQrResult(response.data ?? {}, code);
}
