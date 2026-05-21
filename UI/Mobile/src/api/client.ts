import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

function getDevServerHost() {
  const sourceCode = NativeModules.SourceCode as { scriptURL?: string } | undefined;
  const scriptURL = sourceCode?.scriptURL;
  const match = scriptURL?.match(/\/\/([^/:]+):\d+\//);
  const host = match?.[1];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return undefined;
  }

  return host;
}

function getFallbackUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:3030';
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
    const responseMessage = error.response?.data?.message || error.response?.data?.error;
    if (responseMessage) {
      return String(responseMessage);
    }

    if (error.code === 'ECONNABORTED') {
      return 'Istek zaman asimina ugradi.';
    }

    if (!error.response) {
      return 'API sunucusuna ulasilamadi.';
    }
  }

  return 'Beklenmeyen bir hata olustu.';
}
