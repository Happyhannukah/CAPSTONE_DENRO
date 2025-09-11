import AsyncStorage from '@react-native-async-storage/async-storage';

export async function dumpAllAsyncStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    // Turn into an object for easy reading
    const obj: Record<string, any> = {};
    for (const [k, v] of pairs) {
      try { obj[k] = JSON.parse(v ?? 'null'); }
      catch { obj[k] = v; }
    }
    console.log('== ASYNC STORAGE DUMP ==');
    console.log(JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('Failed to dump AsyncStorage', e);
  }
}
