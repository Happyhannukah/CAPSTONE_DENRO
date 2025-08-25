import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type PhotoRecord = {
  id: number;
  uri: string;
  lat: number;
  lon: number;
  acc?: number | null;
  createdAt: string;   // ISO
  sessionId?: string;  // NEW
};

const PHOTOS_KEY = 'photos';
const { width } = Dimensions.get('window');
const CARD_W = width - 24;

function niceDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function CollectionScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PHOTOS_KEY);
      const list: PhotoRecord[] = raw ? JSON.parse(raw) : [];
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); // newest first
      setItems(list);
    })();
  }, []);

  // Group by sessionId. If a legacy photo has no sessionId,
  // make each such photo its own folder.
  const folders = useMemo(() => {
    const map = new Map<string, PhotoRecord[]>();
    for (const p of items) {
      const key = p.sessionId ?? `legacy-${p.id}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return [...map.entries()]
      .map(([id, arr]) => {
        const newest = arr[0]; // because items is newest-first
        return { id, cover: newest.uri, when: newest.createdAt, count: arr.length };
      })
      .sort((a, b) => +new Date(b.when) - +new Date(a.when));
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/images/denr-logo.png')} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>DENR GeoCam</Text>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => router.push('/home')}><Text style={styles.link}>Home</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/dashboard')}><Text style={styles.link}>Dashboard</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/form')}><Text style={styles.link}>Form</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/login')}><Text style={styles.link}>Logout</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Folder list */}
      <FlatList
        data={folders}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text>No photos yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const openDetails = () =>
            router.push({ pathname: '/CollectionDetailScreen', params: { id: item.id } });

          return (
            <View style={styles.folderCard}>
              <TouchableOpacity onPress={openDetails} accessibilityRole="button">
                <Text style={styles.folderTitle}>{niceDateTime(item.when)}</Text>
                <View style={styles.folderBody}>
                  <TouchableOpacity onPress={openDetails} accessibilityRole="imagebutton">
                    <Image source={{ uri: item.cover }} style={styles.thumb} />
                  </TouchableOpacity>
                  <Text style={styles.count}>
                    {item.count} photo{item.count > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/FormStartSubmission')}>
          <Text style={styles.navText}>Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/camera')}>
          <Text style={styles.navText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, styles.navActive]} onPress={() => router.push('/CollectionScreen')}>
          <Text style={styles.navText}>Collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  logo: { width: 42, height: 42, resizeMode: 'contain' },
  appName: { fontWeight: '700' },
  linksRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  link: { color: '#008B8B' },

  folderCard: {
    width: CARD_W,
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8c8c8',
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#fff',
  },
  folderTitle: { fontWeight: '700', marginBottom: 8 },
  folderBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#eee' },
  count: { color: '#444' },

  bottomNav: {
    position: 'absolute', left: 0, right: 0, bottom: 10,
    flexDirection: 'row', justifyContent: 'space-around',
  },
  navBtn: {
    paddingVertical: 10, paddingHorizontal: 18,
    borderWidth: 2, borderColor: '#2e7d32', borderRadius: 10, backgroundColor: '#fff',
  },
  navActive: { backgroundColor: '#DFFFD8' },
  navText: { color: '#2e7d32', fontWeight: '600' },
});
