import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

function isLocalHost(host?: string) {
  return !host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
}

function extractHost(value: unknown) {
  if (!value) {
    return undefined;
  }

  const text = String(value);
  const urlMatch = text.match(/^[a-z]+:\/\/(?:[^@/]+@)?\[?([^/:\\\]]+)\]?:\d+/i);
  const hostPortMatch = text.match(/^([^/:\\\]]+):\d+$/);
  const host = urlMatch?.[1] || hostPortMatch?.[1];

  if (isLocalHost(host)) {
    return undefined;
  }

  return host;
}

function getWebHost() {
  const location = (globalThis as { location?: { hostname?: string } }).location;
  const host = location?.hostname;

  return isLocalHost(host) ? undefined : host;
}

function getDevServerHost() {
  const nativeModules = NativeModules as {
    SourceCode?: { scriptURL?: string; bundleURL?: string };
    PlatformConstants?: { ServerHost?: string };
    DevSettings?: { settings?: { host?: string } };
  };

  const candidates = [
    nativeModules.SourceCode?.scriptURL,
    nativeModules.SourceCode?.bundleURL,
    nativeModules.PlatformConstants?.ServerHost,
    nativeModules.DevSettings?.settings?.host,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  return undefined;
}

function getFallbackUrl() {
  if (Platform.OS === 'web') {
    const webHost = getWebHost();
    return `http://${webHost ?? 'localhost'}:3030`;
  }

  const devHost = getDevServerHost();
  if (devHost) {
    return `http://${devHost}:3030`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3030';
  }

  return 'http://localhost:3030';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getFallbackUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | undefined;

export function setAuthToken(token?: string) {
  authToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${authToken}`;
  }

  return config;
});

export function getApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    const responseMessage =
      typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error;

    if (error.response?.status === 404) {
      const messageText = responseMessage ? String(responseMessage) : '';

      if (messageText.includes('Cannot GET') || messageText.includes('<!DOCTYPE html>')) {
        return 'Bu API adresi calisan sunucuda yok. API sunucusunu yeniden baslatip tekrar deneyin.';
      }

      return 'API adresi bulunamadi. Sunucuyu yeniden baslatip tekrar deneyin.';
    }

    if (responseMessage) {
      return String(responseMessage);
    }

    if (error.code === 'ECONNABORTED') {
      return 'Istek zaman asimina ugradi.';
    }

    if (!error.response) {
      return 'API sunucusuna ulasilamadi.';
    }

    return `API hatasi: ${error.response.status}`;
  }

  return 'Beklenmeyen bir hata olustu.';
}
