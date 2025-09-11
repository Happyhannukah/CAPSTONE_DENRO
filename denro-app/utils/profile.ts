// utils/profile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const PROFILE_KEY = 'profile.v1';

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUri?: string; // app-private file path
};

export const defaultProfile: Profile = {
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  email: '',
  phone: '',
  avatarUri: '',
};

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(p: Profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/** Copy picked image into app's private folder so it persists & is readable later. */
export async function saveAvatarToAppFiles(srcUri: string): Promise<string> {
  const folder = FileSystem.documentDirectory + 'profile';
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

  const extGuess = srcUri.split('?')[0].split('.').pop() || 'jpg';
  const dest = `${folder}/avatar-${Date.now()}.${extGuess}`; // unique

  await FileSystem.copyAsync({ from: srcUri, to: dest });
  return dest; // store this in AsyncStorage
}

/** Optional: delete an old avatar file to save space. */
export async function tryDeleteFile(uri?: string) {
  if (!uri) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}
