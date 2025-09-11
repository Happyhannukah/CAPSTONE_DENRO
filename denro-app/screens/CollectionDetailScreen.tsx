// screens/CollectionDetailScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

type PhotoRecord = {
  id: number;
  uri: string;
  lat: number;
  lon: number;
  acc?: number | null;
  createdAt: string;   // ISO
  sessionId?: string;
};

const PHOTOS_KEY = 'photos';

// ---- Mapbox / OSM -----------------------------------------------------------
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/** Mapbox Static Image (uses LON,LAT order in the URL). */
function buildMapboxStatic(
  lat: number,
  lon: number,
  w = 120,
  h = 84,
  zoom = 16
) {
  if (!MAPBOX_TOKEN) return null;

  const style = 'mapbox/streets-v12';
  const marker = `pin-s+ff0000(${lon},${lat})`; // lon,lat
  const size = `${Math.round(w)}x${Math.round(h)}@2x`;

  return (
    `https://api.mapbox.com/styles/v1/${style}/static/` +
    `${marker}/` +
    `${lon},${lat},${zoom},0,0/` +
    `${size}` +
    `?access_token=${MAPBOX_TOKEN}`
  );
}

/** OpenStreetMap static fallback (lat,lon order here). */
function buildOSMStatic(
  lat: number,
  lon: number,
  w = 120,
  h = 84,
  zoom = 16
) {
  return (
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${lat},${lon}` +
    `&zoom=${zoom}` +
    `&size=${Math.round(w)}x${Math.round(h)}` +
    `&markers=${lat},${lon},lightblue1`
  );
}

function openInGoogleMaps(lat: number, lon: number) {
  const q = `${lat},${lon}`;
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
}
// ---------------------------------------------------------------------------

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const sessionId = id ?? '';

  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [fallbackIds, setFallbackIds] = useState<Record<number, boolean>>({});
  const [mapLoading, setMapLoading] = useState<Record<number, boolean>>({});
  const shotRefs = useRef<Record<number, ViewShot | null>>({});

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PHOTOS_KEY);
      const all: PhotoRecord[] = raw ? JSON.parse(raw) : [];

      const bySession = all.some(p => p.sessionId === sessionId)
        ? all.filter(p => p.sessionId === sessionId)
        : all.filter(p => dayKey(p.createdAt) === sessionId);

      bySession.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      setPhotos(bySession);
    })();
  }, [sessionId]);

  const ensureLibPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to save images.');
      return false;
    }
    return true;
  };

  const saveCardToGallery = async (photoId: number) => {
    const ok = await ensureLibPermission();
    if (!ok) return;

    const node = shotRefs.current[photoId];
    try {
      if (!node) throw new Error('Nothing to capture yet');

      // small delay so static map finishes rendering
      await new Promise((r) => setTimeout(r, 140));

      const uri = await captureRef(node, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Image with coordinates and map was saved to your gallery.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Could not save image.');
    }
  };

  if (!sessionId) {
    return <View style={styles.emptyWrap}><Text>No session chosen.</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 90 }}>
      {photos.map((p) => {
        // Smaller map dimensions (centralized here)
        const mapW = 120;
        const mapH = 84;
        const mbUrl = buildMapboxStatic(p.lat, p.lon, mapW, mapH, 16);
        const useOSM = fallbackIds[p.id] || !mbUrl;
        const mapUrl = useOSM ? buildOSMStatic(p.lat, p.lon, mapW, mapH, 16) : mbUrl!;

        return (
          <View key={p.id} style={styles.cardContainer}>
            <ViewShot
              ref={(r) => { shotRefs.current[p.id] = r; }}
              style={styles.card}
            >
              <Image source={{ uri: p.uri }} style={styles.photo} />

              {/* Single translucent block that contains BOTH text and the smaller map */}
              <View style={styles.infoOverlay}>
                <View style={styles.infoLeft}>
                  <Text style={styles.meta}>Latitude: {p.lat.toFixed(7)}</Text>
                  <Text style={styles.meta}>Longitude: {p.lon.toFixed(7)}</Text>
                  <Text style={styles.meta}>{new Date(p.createdAt).toLocaleString()}</Text>
                  <Text style={styles.meta}>© DENR GeoCam app</Text>
                </View>

                <TouchableOpacity
                  style={styles.infoMapWrap}
                  activeOpacity={0.85}
                  onPress={() => openInGoogleMaps(p.lat, p.lon)}
                >
                  <Image
                    source={{ uri: mapUrl }}
                    style={styles.infoMapImg}
                    onLoadStart={() => setMapLoading((s) => ({ ...s, [p.id]: true }))}
                    onLoadEnd={() => setMapLoading((s) => ({ ...s, [p.id]: false }))}
                    onError={() => {
                      setFallbackIds(prev => ({ ...prev, [p.id]: true }));
                      setMapLoading((s) => ({ ...s, [p.id]: false }));
                    }}
                  />
                  {mapLoading[p.id] && (
                    <View style={styles.mapSpinner}>
                      <Text style={{ color: '#111' }}>Loading…</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ViewShot>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveCardToGallery(p.id)}>
                <Text style={styles.saveText}>Save to device</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.openBtn} onPress={() => openInGoogleMaps(p.lat, p.lon)}>
                <Text style={styles.openText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  cardContainer: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  card: { overflow: 'hidden', borderRadius: 16, backgroundColor: '#000' },
  photo: { width: '100%', height: 460, resizeMode: 'cover' },

  infoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  meta: { color: '#fff', fontSize: 12, lineHeight: 16 },

  infoMapWrap: {
    width: 120,
    height: 84,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  infoMapImg: { width: '100%', height: '100%' },
  mapSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  saveBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8, backgroundColor: '#2e7d32',
  },
  saveText: { color: '#fff', fontWeight: '700' },

  openBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1, borderColor: '#2e7d32',
    backgroundColor: '#fff',
  },
  openText: { color: '#2e7d32', fontWeight: '700' },
});
