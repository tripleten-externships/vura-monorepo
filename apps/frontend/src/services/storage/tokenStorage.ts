import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type EncryptedStorageModule = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
};

const AUTH_TOKEN_FALLBACK_MEMORY = new Map<string, string>();
const isWeb = Platform.OS === 'web';

let encryptedStorage: EncryptedStorageModule | undefined;

try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  encryptedStorage = require('react-native-encrypted-storage').default;
} catch {
  encryptedStorage = undefined;
}

const getBrowserStorage = (): Storage | null => {
  if (!isWeb || typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const AUTH_TOKEN_KEY = 'vura.authToken';
export const JWT_TOKEN_KEY = 'vura.jwtToken';

async function getNativeItem(key: string): Promise<string | null> {
  if (encryptedStorage) {
    try {
      const value = await encryptedStorage.getItem(key);
      if (value) {
        return value;
      }
    } catch {
      // noop: fallback to async storage
    }
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return AUTH_TOKEN_FALLBACK_MEMORY.get(key) ?? null;
  }
}

async function setNativeItem(key: string, value: string): Promise<void> {
  if (encryptedStorage) {
    try {
      await encryptedStorage.setItem(key, value);
      return;
    } catch {
      // noop: fallback to async storage
    }
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    AUTH_TOKEN_FALLBACK_MEMORY.set(key, value);
  }
}

async function removeNativeItem(key: string): Promise<void> {
  if (encryptedStorage) {
    try {
      await encryptedStorage.removeItem(key);
      return;
    } catch {
      // noop: fallback to async storage
    }
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    AUTH_TOKEN_FALLBACK_MEMORY.delete(key);
  }
}

export async function getStoredToken(): Promise<string | null> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    return browserStorage.getItem(AUTH_TOKEN_KEY);
  }
  return getNativeItem(AUTH_TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  await setNativeItem(AUTH_TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  await removeNativeItem(AUTH_TOKEN_KEY);
}

export async function getStoredJwt(): Promise<string | null> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    return browserStorage.getItem(JWT_TOKEN_KEY);
  }
  return getNativeItem(JWT_TOKEN_KEY);
}

export async function setStoredJwt(token: string): Promise<void> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.setItem(JWT_TOKEN_KEY, token);
    return;
  }
  await setNativeItem(JWT_TOKEN_KEY, token);
}

export async function clearStoredJwt(): Promise<void> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.removeItem(JWT_TOKEN_KEY);
    return;
  }
  await removeNativeItem(JWT_TOKEN_KEY);
}
