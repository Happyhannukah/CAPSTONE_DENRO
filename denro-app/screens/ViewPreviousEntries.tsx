import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type Entry = { id: number; form: string; note?: string; createdAt: string };
type Group = { id: number; createdAt: string; title: string; entries: Entry[] };

// “Start” marks the beginning of a submission session
const isStart = (e: Entry) => e.form?.toLowerCase().startsWith('start');

export default function ViewPreviousEntries() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem('submissions');
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    setEntries(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem('submissions');
    setEntries([]);
    setExpanded({});
  };

  // ---- Group entries by each “Start” into separate folders -----------------
  const groups: Group[] = useMemo(() => {
    if (!entries.length) return [];

    // Work in oldest → newest order for correct grouping
    const sorted = [...entries].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
    );

    const result: Group[] = [];
    let current: Group | null = null;

    const makeTitleFromStart = (start: Entry) => {
      const nameFromNote =
        start.note && start.note.includes('•')
          ? start.note.split('•')[0].trim()
          : start.note?.trim();
      return nameFromNote && nameFromNote.length > 0
        ? nameFromNote
        : `Submission ${new Date(start.createdAt).toLocaleDateString()}`;
    };

    for (const e of sorted) {
      if (isStart(e)) {
        if (current) result.push(current);
        current = {
          id: e.id,
          createdAt: e.createdAt,
          title: makeTitleFromStart(e),
          entries: [e],
        };
      } else {
        if (!current) {
          // No Start encountered yet — create a fallback group
          current = {
            id: e.id,
            createdAt: e.createdAt,
            title: `Submission ${new Date(e.createdAt).toLocaleDateString()}`,
            entries: [e],
          };
        } else {
          current.entries.push(e);
        }
      }
    }
    if (current) result.push(current);

    // Show newest session first
    result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return result;
  }, [entries]);
  // -------------------------------------------------------------------------

  const toggle = (id: number) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Previous Entries</Text>

      {groups.length === 0 ? (
        <Text>No submissions yet.</Text>
      ) : (
        <>
          <FlatList
            data={groups}
            keyExtractor={(g) => String(g.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item: g }) => {
              const isOpen = !!expanded[g.id];
              // Inside each folder show entries oldest → newest
              const content = [...g.entries].sort(
                (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
              );

              return (
                <View style={styles.folderCard}>
                  <TouchableOpacity onPress={() => toggle(g.id)} style={styles.folderHeader}>
                    <Text style={styles.folderIcon}>{isOpen ? '📂' : '📁'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.folderTitle}>{g.title}</Text>
                      <Text style={styles.folderMeta}>
                        {new Date(g.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.folderBody}>
                      {content.map((e) => (
                        <View key={e.id} style={styles.entryRow}>
                          <Text style={styles.entryForm}>{e.form}</Text>
                          <Text style={styles.entryTime}>
                            {new Date(e.createdAt).toLocaleString()}
                          </Text>
                          {e.note ? <Text style={styles.entryNote}>{e.note}</Text> : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />

          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  // Back button
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 2,
  },
  backArrow: { fontSize: 18, marginRight: 6, color: '#333' },
  backText: { fontSize: 16, color: '#333', fontWeight: '600' },

  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, marginTop: 48 },

  folderCard: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  folderIcon: { fontSize: 18 },
  folderTitle: { fontWeight: '700' },
  folderMeta: { fontSize: 12, color: '#666' },
  chevron: { fontSize: 12, color: '#666' },

  folderBody: { borderTopWidth: 1, borderTopColor: '#eee', padding: 10, gap: 10 },
  entryRow: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  entryForm: { fontWeight: '600' },
  entryTime: { fontSize: 12, color: '#666', marginBottom: 2 },
  entryNote: { fontSize: 14 },

  clearBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#999',
  },
  clearText: { fontWeight: '600' },
});
