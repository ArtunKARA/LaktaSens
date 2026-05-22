export type RoleCode = 'a' | 'c' | 't';
export type RoleName = 'admin' | 'farmer' | 'supplier';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleCode;
  roleName: RoleName;
  companyId?: number;
  farm?: string;
  phone?: string;
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
