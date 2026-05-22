import { apiClient } from './client';
import { AuthResult, RoleCode, User, roleNames } from '../types/domain';

interface LoginCredentials {
  email: string;
  password: string;
}

function normalizeRole(value: unknown): RoleCode {
  if (value === 'a' || value === 'admin') {
    return 'a';
  }

  if (value === 't' || value === 'supplier' || value === 'tedarikci') {
    return 't';
  }

  return 'c';
}

function normalizeUser(data: Record<string, unknown>): User {
  const role = normalizeRole(data.kullaniciTuru ?? data.role);
  const firstName = String(data.isim ?? data.name ?? '').trim();
  const lastName = String(data.soyisim ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || String(data.email ?? data.eposta ?? 'LaktaSense User');

  return {
    id: String(data.kullaniciID ?? data.id),
    name: fullName,
    email: String(data.eposta ?? data.email ?? ''),
    role,
    roleName: roleNames[role],
    companyId: typeof data.firmaID === 'number' ? data.firmaID : Number(data.firmaID) || undefined,
    farm: data.farm ? String(data.farm) : data.firmaAdi ? String(data.firmaAdi) : undefined,
    phone: data.telefonNo ? String(data.telefonNo) : undefined,
    raw: data,
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  const response = await apiClient.post('/api/mobile/login', {
    email: credentials.email,
    password: credentials.password,
  });
  const userData = response.data?.user ?? response.data ?? {};

  return {
    token: response.data?.token,
    user: normalizeUser(userData),
  };
}

export async function getProfile(): Promise<User> {
  const response = await apiClient.get('/api/mobile/me');
  return normalizeUser(response.data?.user ?? response.data ?? {});
}
