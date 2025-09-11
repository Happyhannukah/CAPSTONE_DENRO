// utils/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_KEY = 'denro:user';

export type DenroUser = {
  id: number;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  region_id: number | null;
  penro_id: number | null;
  cenro_id: number | null;
};

export async function saveUser(u: DenroUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
}

export async function getCurrentUser(): Promise<DenroUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as DenroUser) : null;
}

export async function signOutLocal() {
  await AsyncStorage.removeItem(USER_KEY);
}