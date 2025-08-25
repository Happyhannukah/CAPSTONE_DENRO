// screens/CollectionDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PhotoRecord = {
  id: number;
  uri: string;
  lat: number;
  lon: number;
  acc?: number | null;
  createdAt: string;
  // sessionId?: string; // optional in your DB
};

const PHOTOS_KEY = 'photos';

// 🔑 Put your Google Static Maps API key here (and enable the API in Google Cloud)
const STATIC_MAPS_KEY = 'AIzaSyCIlnJh1gEJROqM0jnh4SyWnoh9g9CiKF0'; // e.g. 'AIza...'

// Build a crisp Static Maps URL (retina via scale=2)
function buildStaticMapUrl(
  lat: number,
  lon: number,
  w = 220,
  h = 140,
  zoom = 16
): string | null {
  if (!STATIC_MAPS_KEY) return null;

  const size = `${Math.round(w)}x${Math.round(h)}`;
  // red pin at the exact coordinate
  const markers = encodeURIComponent(`color:red|${lat},${lon}`);
  // roadmap with higher zoom looks clearer
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lon}` +
    `&zoom=${zoom}` +
    `&size=${size}` +
    `&scale=2` +
    `&maptype=roadmap` +
    `&markers=${markers}` +
    `&key=${STATIC_MAPS_KEY}`
  );
}

// We still use the "day key" (YYYY-MM-DD) as the folder/session id.
// If you switched to custom session ids, filter by p.sessionId === sessionId instead.
type Props = { sessionId: string };

export default function CollectionDetailScreen({ sessionId }: Props) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PHOTOS_KEY);
      const all: PhotoRecord[] = raw ? JSON.parse(raw) : [];

      // Group by local day (same as your CollectionScreen)
      const list = all.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === sessionId
      );

      // Oldest -> newest (vertical reading)
      list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      setPhotos(list);
    })();
  }, [sessionId]);

  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 90 }}>
      {photos.map((p) => {
        const mapUrl = buildStaticMapUrl(p.lat, p.lon, 220, 140, 16);
        return (
          <View key={p.id} style={styles.card}>
            <Image source={{ uri: p.uri }} style={styles.photo} />

            {/* bottom overlay: text left + crisp static map right */}
            <View style={styles.overlayRow}>
              <View style={styles.infoPill}>
                <Text style={styles.meta}>Latitude: {p.lat.toFixed(7)}</Text>
                <Text style={styles.meta}>Longitude: {p.lon.toFixed(7)}</Text>
                <Text style={styles.meta}>
                  {new Date(p.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.meta}>© DENR GeoCam app</Text>
              </View>

              <View style={styles.mapWrap}>
                {mapUrl ? (
                  <Image source={{ uri: mapUrl }} style={styles.mapImg} />
                ) : (
                  <View style={styles.mapFallback}>
                    <Text style={styles.fallbackText}>Map unavailable</Text>
                    <Text style={styles.fallbackHint}>Add API key</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  photo: {
    width: '100%',
    height: 460, // give the image more height so the layout matches your mock
    resizeMode: 'cover',
  },

  overlayRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  infoPill: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: '60%',
  },
  meta: { color: '#fff', fontSize: 12, lineHeight: 16 },

  mapWrap: {
    width: 220,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapImg: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  fallbackText: { color: '#222', fontSize: 12, fontWeight: '600' },
  fallbackHint: { color: '#999', fontSize: 10, marginTop: 2 },
});
