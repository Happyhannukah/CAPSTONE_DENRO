// utils/debug.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const dumpAsyncStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  const obj: Record<string, any> = {};
  for (const [k, v] of entries) {
    try { obj[k] = JSON.parse(v ?? 'null'); } catch { obj[k] = v; }
  }
  console.log('ASYNCSTORAGE DUMP', obj);
};
