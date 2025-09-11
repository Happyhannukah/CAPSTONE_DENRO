import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional (Expo): export JSON to a file and share it
let FileSystem: any = null;
let Sharing: any = null;
try {
  // These will exist if you're on Expo
  // (if you're bare RN, you can remove export feature or use RN Share API)
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
} catch {}

type KV = { key: string; value: string };

export default function StorageInspector() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<KV[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rows = await AsyncStorage.multiGet(keys);
      const data: KV[] = rows.map(([k, v]) => ({ key: k, value: v ?? '' }));
      // show keys alphabetically (photos will still be easy to find)
      data.sort((a, b) => a.key.localeCompare(b.key));
      setPairs(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to read AsyncStorage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter(p =>
      p.key.toLowerCase().includes(q) ||
      (p.value ?? '').toLowerCase().includes(q)
    );
  }, [pairs, search]);

  const pretty = (value: string) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  const shortPreview = (value: string) => {
    // Try to show something helpful without expanding
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return `Array(${parsed.length})`;
      if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        return `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', …' : ''}}`;
      }
    } catch {}
    return value.length > 60 ? value.slice(0, 60) + '…' : value || '(empty)';
  };

  const toggleItem = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const deleteKey = async (key: string) => {
    Alert.alert('Delete key?', `"${key}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(key);
          await load();
        }
      }
    ]);
  };

  const clearAll = async () => {
    Alert.alert('Clear ALL AsyncStorage?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          await load();
        }
      }
    ]);
  };

  const exportJson = async () => {
    const obj: Record<string, any> = {};
    for (const kv of pairs) {
      try {
        obj[kv.key] = JSON.parse(kv.value);
      } catch {
        obj[kv.key] = kv.value;
      }
    }
    const payload = JSON.stringify(obj, null, 2);

    // If Expo is available, save to a temp file and share
    if (FileSystem && Sharing) {
      const path = `${FileSystem.cacheDirectory}asyncstorage-dump.json`;
      await FileSystem.writeAsStringAsync(path, payload, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert('Exported', `Saved to: ${path}`);
      }
      return;
    }

    // Fallback: show in alert (trim if huge)
    if (payload.length < 60000) {
      Alert.alert('AsyncStorage JSON', payload);
    } else {
      Alert.alert('Export too large', 'Install Expo FileSystem/Sharing to export to a file.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AsyncStorage Inspector</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Search key or value… (e.g. photos, 2025-03-20)"
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={load} style={styles.btn}>
          <Text style={styles.btnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={exportJson} style={[styles.btn, styles.secondary]}>
          <Text style={styles.btnText}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAll} style={[styles.btn, styles.danger]}>
          <Text style={styles.btnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isOpen = !!expanded[item.key];
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.keyText}>{item.key}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => toggleItem(item.key)} style={[styles.smallBtn]}>
                      <Text style={styles.smallBtnText}>{isOpen ? 'Hide' : 'View'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteKey(item.key)} style={[styles.smallBtn, styles.danger]}>
                      <Text style={styles.smallBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.previewText}>
                  {isOpen ? pretty(item.value) : shortPreview(item.value)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text>No keys found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  search: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: Platform.select({ ios: 10, android: 8 })
  },
  btn: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#2e7d32'
  },
  secondary: { backgroundColor: '#0066cc' },
  danger: { backgroundColor: '#d32f2f' },
  btnText: { color: '#fff', fontWeight: '700' },

  card: {
    borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10,
    padding: 10, marginBottom: 10, backgroundColor: '#fafafa'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  keyText: { fontWeight: '700' },
  previewText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any, fontSize: 12 },
  smallBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#2e7d32'
  },
  smallBtnText: { color: '#fff', fontWeight: '700' }
});
