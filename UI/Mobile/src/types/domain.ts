export type RoleCode = 'a' | 'c' | 't';
export type RoleName = 'admin' | 'farmer' | 'supplier';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleCode;
  roleName: RoleName;
  firstName?: string;
  lastName?: string;
  nationalIdMasked?: string;
  companyId?: number;
  farm?: string;
  phone?: string;
  accountStatusName?: string;
  companyStatusName?: string;
  companyRoleName?: string;
  companyTypeName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  cityName?: string;
  districtName?: string;
  region?: string;
  raw?: unknown;
}

export interface AuthResult {
  token?: string;
  user: User;
}

export interface QrScanResult {
  type: 'cow' | 'sensor' | 'shipment' | 'unknown';
  targetId: string;
  message: string;
  cowId?: string;
  info?: string;
}

export interface MilkValues {
  cowId: string;
  cowName: string;
  liters: number;
  fat: number;
  protein: number;
  scc: number;
  temperature: number;
  timestamp: string;
  qualitySource?: string;
}

export interface MilkRecord {
  id: number;
  liters: number;
  timestamp: string;
  machineId?: number | null;
}

export interface CowSummary {
  id: number;
  qr: string;
  displayName: string;
  breed?: string;
  lifecycle?: string;
  reproductionStatus?: string;
  latestMilkLiters?: number;
  latestMilkAt?: string;
  milkAverage7?: number;
  companyName?: string;
}

export interface FeedStock {
  id: number;
  feedName: string;
  amountKg: number;
  isLow: boolean;
  updatedAt?: string;
  companyName?: string;
}

export interface ShipmentSummary {
  id: number;
  code: string;
  status?: string;
  totalKg: number;
  expectedDeliveryAt?: string;
  farmerCompanyName?: string;
  supplierCompanyName?: string;
}

export type AdminApplicationType = 'company' | 'feed';
export type WorkflowDecision = 'approve' | 'reject';

export interface AdminApplication {
  id: string;
  type: AdminApplicationType;
  targetId: number;
  title: string;
  subtitle?: string;
  status?: string;
  statusName?: string;
  companyTypeName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  companyName?: string;
  isCustomFeed?: boolean;
  unitPrice?: number | null;
  minOrderKg?: number | null;
  maxOrderKg?: number | null;
  description?: string;
  rejectedBefore?: number;
  rejectedReason?: string;
}

export interface SupplierOrder {
  id: number;
  offerId?: number;
  title: string;
  farmerCompanyName?: string;
  feedName?: string;
  amountKg: number;
  unitPrice: number;
  totalAmount: number;
  date?: string;
  status?: string;
  statusName?: string;
  sourceType?: string;
  canApprove?: boolean;
  canReject?: boolean;
}

export interface SupplierOffer {
  id: number;
  auctionId?: number;
  title: string;
  feedName?: string;
  amountKg: number;
  unitPrice: number;
  totalAmount: number;
  date?: string;
  status?: string;
  statusName?: string;
  auctionStatus?: string;
  auctionStatusName?: string;
  auctionStartsAt?: string;
  auctionEndsAt?: string;
  requestedKg?: number;
  remainingKg?: number;
  canWithdraw?: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  severity: Severity;
}

export interface DashboardMetric {
  label: string;
  value: string;
  icon?: string;
}

export interface DashboardSummary {
  title: string;
  primaryCowId?: string;
  metrics: DashboardMetric[];
  notes: string[];
}

export const roleLabels: Record<RoleCode, string> = {
  a: 'Admin',
  c: 'Ciftci',
  t: 'Tedarikci',
};

export const roleNames: Record<RoleCode, RoleName> = {
  a: 'admin',
  c: 'farmer',
  t: 'supplier',
};
