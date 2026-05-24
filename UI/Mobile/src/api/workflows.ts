import { apiClient } from './client';
import { AdminApplication, AdminApplicationType, SupplierOffer, SupplierOrder, WorkflowDecision } from '../types/domain';

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function optionalString(value: unknown) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function normalizeAdminApplication(data: Record<string, unknown>): AdminApplication {
  const type = data.type === 'feed' ? 'feed' : 'company';

  return {
    id: String(data.id ?? `${type}-${data.targetId ?? ''}`),
    type,
    targetId: toNumber(data.targetId, 0),
    title: String(data.title ?? 'Basvuru'),
    subtitle: optionalString(data.subtitle),
    status: optionalString(data.status),
    statusName: optionalString(data.statusName),
    companyTypeName: optionalString(data.companyTypeName),
    phone: optionalString(data.phone),
    email: optionalString(data.email),
    address: optionalString(data.address),
    city: optionalString(data.city),
    district: optionalString(data.district),
    companyName: optionalString(data.companyName),
    isCustomFeed: typeof data.isCustomFeed === 'boolean' ? data.isCustomFeed : undefined,
    unitPrice: optionalNumber(data.unitPrice),
    minOrderKg: optionalNumber(data.minOrderKg),
    maxOrderKg: optionalNumber(data.maxOrderKg),
    description: optionalString(data.description),
    rejectedBefore: optionalNumber(data.rejectedBefore),
    rejectedReason: optionalString(data.rejectedReason),
  };
}

function normalizeSupplierOrder(data: Record<string, unknown>): SupplierOrder {
  return {
    id: toNumber(data.id, 0),
    offerId: optionalNumber(data.offerId),
    title: String(data.title ?? data.feedName ?? 'Siparis'),
    farmerCompanyName: optionalString(data.farmerCompanyName),
    feedName: optionalString(data.feedName),
    amountKg: toNumber(data.amountKg, 0),
    unitPrice: toNumber(data.unitPrice, 0),
    totalAmount: toNumber(data.totalAmount, 0),
    date: optionalString(data.date),
    status: optionalString(data.status),
    statusName: optionalString(data.statusName),
    sourceType: optionalString(data.sourceType),
    canApprove: Boolean(data.canApprove),
    canReject: Boolean(data.canReject),
  };
}

function normalizeSupplierOffer(data: Record<string, unknown>): SupplierOffer {
  return {
    id: toNumber(data.id, 0),
    auctionId: optionalNumber(data.auctionId),
    title: String(data.title ?? 'Teklif'),
    feedName: optionalString(data.feedName),
    amountKg: toNumber(data.amountKg, 0),
    unitPrice: toNumber(data.unitPrice, 0),
    totalAmount: toNumber(data.totalAmount, 0),
    date: optionalString(data.date),
    status: optionalString(data.status),
    statusName: optionalString(data.statusName),
    auctionStatus: optionalString(data.auctionStatus),
    auctionStatusName: optionalString(data.auctionStatusName),
    auctionStartsAt: optionalString(data.auctionStartsAt),
    auctionEndsAt: optionalString(data.auctionEndsAt),
    requestedKg: optionalNumber(data.requestedKg),
    remainingKg: optionalNumber(data.remainingKg),
    canWithdraw: Boolean(data.canWithdraw),
  };
}

function listFromResponse(data: unknown) {
  const payload = data as { items?: unknown[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

export async function getAdminApplications(limit = 80): Promise<AdminApplication[]> {
  const response = await apiClient.get('/api/mobile/admin/applications', {
    params: { limit },
  });

  return listFromResponse(response.data).map((item) => normalizeAdminApplication((item ?? {}) as Record<string, unknown>));
}

export async function actOnAdminApplication(
  type: AdminApplicationType,
  targetId: number,
  action: WorkflowDecision,
  reason?: string,
) {
  await apiClient.post(`/api/mobile/admin/applications/${type}/${targetId}/action`, {
    action,
    reason,
  });
}

export async function getSupplierOrders(limit = 80): Promise<SupplierOrder[]> {
  const response = await apiClient.get('/api/mobile/supplier/orders', {
    params: { limit },
  });

  return listFromResponse(response.data).map((item) => normalizeSupplierOrder((item ?? {}) as Record<string, unknown>));
}

export async function actOnSupplierOrder(orderId: number, action: WorkflowDecision) {
  await apiClient.post(`/api/mobile/supplier/orders/${orderId}/action`, {
    action,
  });
}

export async function getSupplierOffers(limit = 80): Promise<SupplierOffer[]> {
  const response = await apiClient.get('/api/mobile/supplier/offers', {
    params: { limit },
  });

  return listFromResponse(response.data).map((item) => normalizeSupplierOffer((item ?? {}) as Record<string, unknown>));
}

export async function withdrawSupplierOffer(offerId: number) {
  await apiClient.post(`/api/mobile/supplier/offers/${offerId}/action`, {
    action: 'withdraw',
  });
}
