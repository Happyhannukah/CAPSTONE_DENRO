// screens/CollectionScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
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

type FolderRow = {
  id: string;            // sessionId or legacy-<photoId>
  cover: string;         // preview image uri
  when: string;          // newest createdAt in the folder
  count: number;         // photo count
  memberIds: number[];   // ids of photos in this folder
  displayDate: string;   // toLocaleDateString of "when" (for search)
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

  // toolbar state
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'largest' | 'smallest'>('newest');

  // selection state
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );
  const selecting = selectedIds.length > 0;

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PHOTOS_KEY);
      const list: PhotoRecord[] = raw ? JSON.parse(raw) : [];
      // newest first
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      setItems(list);
    })();
  }, []);

  // Group by sessionId. If a legacy photo has no sessionId,
  // make each such photo its own folder.
  const folders: FolderRow[] = useMemo(() => {
    const map = new Map<string, PhotoRecord[]>();
    for (const p of items) {
      const key = p.sessionId ?? `legacy-${p.id}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }

    const rows: FolderRow[] = [];
    for (const [id, arr] of map) {
      // newest first inside a folder
      arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      const newest = arr[0];
      rows.push({
        id,
        cover: newest.uri,
        when: newest.createdAt,
        count: arr.length,
        memberIds: arr.map((p) => p.id),
        displayDate: new Date(newest.createdAt).toLocaleDateString(),
      });
    }

    // default sort here; can be changed later by sortMode
    rows.sort((a, b) => +new Date(b.when) - +new Date(a.when));
    return rows;
  }, [items]);

  // Filter by search query (date)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => {
      const isoDay = new Date(f.when).toISOString().slice(0, 10); // YYYY-MM-DD
      return (
        f.displayDate.toLowerCase().includes(q) ||
        niceDateTime(f.when).toLowerCase().includes(q) ||
        isoDay.includes(q)
      );
    });
  }, [folders, query]);

  // Apply sort
  const visible = useMemo(() => {
    const arr = [...filtered];
    switch (sortMode) {
      case 'newest':
        arr.sort((a, b) => +new Date(b.when) - +new Date(a.when));
        break;
      case 'oldest':
        arr.sort((a, b) => +new Date(a.when) - +new Date(b.when));
        break;
      case 'largest':
        arr.sort((a, b) => b.count - a.count || +new Date(b.when) - +new Date(a.when));
        break;
      case 'smallest':
        arr.sort((a, b) => a.count - b.count || +new Date(b.when) - +new Date(a.when));
        break;
    }
    return arr;
  }, [filtered, sortMode]);

  const toggleSelect = (folderId: string) =>
    setSelected((prev) => ({ ...prev, [folderId]: !prev[folderId] }));

  const clearSelection = () => setSelected({});

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Delete folders?',
      `This will permanently delete ${selectedIds.length} folder${selectedIds.length > 1 ? 's' : ''} and their photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const idsSet = new Set(selectedIds);
            const nextItems = items.filter((p) => {
              const key = p.sessionId ?? `legacy-${p.id}`;
              return !idsSet.has(key);
            });
            setItems(nextItems);
            await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(nextItems));
            clearSelection();
          },
        },
      ]
    );
  };

  const openDetails = (folderId: string) =>
    router.push({ pathname: '/CollectionDetailScreen', params: { id: folderId } });

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

      {/* Toolbar: search + sort + delete */}
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search date (e.g., 2025-08-27)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortOpen((s) => !s)}
        >
          <Text style={styles.sortText}>Sort</Text>
        </TouchableOpacity>
        {selecting && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSelected}>
            <Text style={styles.deleteText}>Delete ({selectedIds.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {sortOpen && (
        <View style={styles.sortSheet}>
          {(['newest', 'oldest', 'largest', 'smallest'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => {
                setSortMode(mode);
                setSortOpen(false);
              }}
              style={[
                styles.sortItem,
                sortMode === mode && styles.sortItemActive,
              ]}
            >
              <Text style={styles.sortItemText}>
                {mode === 'newest' && 'Newest first'}
                {mode === 'oldest' && 'Oldest first'}
                {mode === 'largest' && 'Largest (most photos)'}
                {mode === 'smallest' && 'Smallest (fewest photos)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Folder list */}
      <FlatList
        data={visible}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text>No photos yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const checked = !!selected[item.id];

          const onPress = () => {
            if (selecting) toggleSelect(item.id);
            else openDetails(item.id);
          };

          return (
            <View style={styles.folderCard}>
              <TouchableOpacity
                onPress={onPress}
                onLongPress={() => toggleSelect(item.id)}
                accessibilityRole="button"
              >
                <Text style={styles.folderTitle}>{niceDateTime(item.when)}</Text>
                <View style={styles.folderBody}>
                  <TouchableOpacity onPress={onPress} accessibilityRole="imagebutton">
                    <Image source={{ uri: item.cover }} style={styles.thumb} />
                  </TouchableOpacity>

                  <Text style={styles.count}>
                    {item.count} photo{item.count > 1 ? 's' : ''}
                  </Text>

                  {/* checkbox on the right */}
                  <TouchableOpacity
                    style={[styles.checkBox, checked && styles.checkBoxOn]}
                    onPress={() => toggleSelect(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                  </TouchableOpacity>
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

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#2e7d32',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sortText: { color: '#2e7d32', fontWeight: '600' },

  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#d32f2f',
  },
  deleteText: { color: '#fff', fontWeight: '700' },

  sortSheet: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sortItem: { paddingVertical: 10, paddingHorizontal: 12 },
  sortItemActive: { backgroundColor: '#DFFFD8' },
  sortItemText: { color: '#2e7d32', fontWeight: '600' },

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
  count: { color: '#444', flex: 1 },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkBoxOn: { backgroundColor: '#2e7d32' },
  checkMark: { color: '#fff', fontWeight: '800' },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  navActive: { backgroundColor: '#DFFFD8' },
  navText: { color: '#2e7d32', fontWeight: '600' },
});
