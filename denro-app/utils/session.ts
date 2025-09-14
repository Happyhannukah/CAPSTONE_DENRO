// utils/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_KEY = 'denro:user';
export const TOKEN_KEY = 'denro:token';

export type DenroUser = {
  id: number;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  region: string | null;
  id_number: string | null;
};

export async function saveUser(u: DenroUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getCurrentUser(): Promise<DenroUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as DenroUser) : null;
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function signOutLocal() {
  await AsyncStorage.removeItem(USER_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}
