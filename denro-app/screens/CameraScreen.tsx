// screens/CameraScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PhotoRecord = {
  id: number;
  uri: string;
  lat: number;
  lon: number;
  acc?: number | null;
  createdAt: string;     // ISO
  sessionId?: string;    // groups photos into one folder
};

const PHOTOS_KEY = 'photos';
const formatCoord = (v: number, decimals = 6) =>
  Number.isFinite(v) ? Number(v).toFixed(decimals) : '';

async function addPhotoToDB(rec: PhotoRecord) {
  const raw = await AsyncStorage.getItem(PHOTOS_KEY);
  const list: PhotoRecord[] = raw ? JSON.parse(raw) : [];
  list.unshift(rec);
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(list));
}

export default function CameraScreen() {
  const router = useRouter();

  // Camera permission (expo-camera)
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);

  // Other permissions
  const [locGranted, setLocGranted] = useState(false);
  const [libGranted, setLibGranted] = useState(false);

  // Camera UI
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);

  // Live coords
  const [lat, setLat] = useState('—');
  const [lon, setLon] = useState('—');
  const [acc, setAcc] = useState<number | null>(null);

  // Freeze coords (Pointers)
  const [frozen, setFrozen] = useState(false);
  const [locked, setLocked] = useState<{ lat: string; lon: string } | null>(null);

  // Accuracy threshold (informational) – default 9
  const [accThresh, setAccThresh] = useState(9);

  // Preview confirmation (for the shot we just took)
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  // Last saved photo (for quick preview)
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [lastPreviewUri, setLastPreviewUri] = useState<string | null>(null);

  // Single vs Multi session
  const [multiMode, setMultiMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  // Ask for permissions
  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();

      const lib = await MediaLibrary.requestPermissionsAsync();
      setLibGranted(lib.status === 'granted');

      const loc = await Location.requestForegroundPermissionsAsync();
      const granted = loc.status === 'granted';
      setLocGranted(granted);
      if (!granted) {
        Alert.alert(
          'Location needed',
          'Please enable location so latitude/longitude can be recorded.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load last photo so the gallery thumb is not empty on first launch
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PHOTOS_KEY);
      const list: PhotoRecord[] = raw ? JSON.parse(raw) : [];
      if (list.length > 0) setLastPhotoUri(list[0].uri);
    })();
  }, []);

  // Seed immediate location, then watch continuously
  useEffect(() => {
    if (!locGranted) return;

    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const last = await Location.getLastKnownPositionAsync({});
      if (last && !cancelled && !frozen) {
        setLat(last.coords.latitude.toFixed(7));
        setLon(last.coords.longitude.toFixed(7));
        setAcc(last.coords.accuracy != null ? Math.round(last.coords.accuracy) : null);
      }

      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (cur && !cancelled && !frozen) {
        setLat(cur.coords.latitude.toFixed(7));
        setLon(cur.coords.longitude.toFixed(7));
        setAcc(cur.coords.accuracy != null ? Math.round(cur.coords.accuracy) : null);
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        (loc) => {
          const { latitude, longitude, accuracy } = loc.coords;
          setAcc(accuracy != null ? Math.round(accuracy) : null);
          if (!frozen) {
            setLat(latitude.toFixed(7));
            setLon(longitude.toFixed(7));
          }
        }
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [locGranted, frozen]);

  const toggleMultiMode = (val: boolean) => {
    setMultiMode(val);
    if (val && !sessionId) {
      setSessionId(String(Date.now()));
      setSessionCount(0);
    }
    if (!val) {
      setSessionId(null);
      setSessionCount(0);
    }
  };

  if (!permission) {
    return <View style={styles.center}><Text>Checking camera permission…</Text></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10 }}>Camera permission is required.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleZoom = () => setZoom((z) => (z < 0.2 ? 0.4 : 0));
  const decThresh = () => setAccThresh((v) => Math.max(1, v - 1));
  const incThresh = () => setAccThresh((v) => Math.min(100, v + 1));

  const onToggleFrozen = (val: boolean) => {
    if (val) {
      setFrozen(true);
      setLocked({ lat: lat === '—' ? '' : lat, lon: lon === '—' ? '' : lon });
    } else {
      setFrozen(false);
      setLocked(null);
    }
  };

  // Take photo -> preview (confirm/cancel)
  const takeShot = async () => {
    try {
      if (!camRef.current) return;
      const photo = await camRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) return;
      setPendingUri(photo.uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to take photo.');
    }
  };

  const confirmSave = async () => {
    if (!pendingUri) return;
    try {
      if (libGranted) await MediaLibrary.saveToLibraryAsync(pendingUri);

      const useLat = (locked?.lat ?? lat).replace('—', '');
      const useLon = (locked?.lon ?? lon).replace('—', '');
      const latNum = Number(useLat);
      const lonNum = Number(useLon);

      // normalize to same precision used in maps/text (stored as number)
      const latFixed = Number(formatCoord(latNum, 6));
      const lonFixed = Number(formatCoord(lonNum, 6));

      const sid = multiMode ? (sessionId ?? String(Date.now())) : `single-${Date.now()}`;
      if (multiMode && !sessionId) setSessionId(sid);

      const rec: PhotoRecord = {
        id: Date.now(),
        uri: pendingUri,
        lat: isFinite(latFixed) ? latFixed : 0,
        lon: isFinite(lonFixed) ? lonFixed : 0,
        acc,
        createdAt: new Date().toISOString(),
        sessionId: sid,
      };
      await addPhotoToDB(rec);

      setLastPhotoUri(pendingUri);
      setPendingUri(null);

      if (multiMode) {
        setSessionCount((n) => n + 1);
      } else {
        router.replace('/CollectionScreen');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Save failed.');
    }
  };

  const cancelPreview = () => setPendingUri(null);

  const finishSession = () => {
    if (multiMode && sessionId) {
      router.replace({ pathname: '/CollectionDetailScreen', params: { id: sessionId } });
    } else {
      router.replace('/CollectionScreen');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={camRef}
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        zoom={zoom}
      />

      {/* Torch */}
      <TouchableOpacity onPress={() => setTorch(t => !t)} style={styles.flashBtn}>
        <Text style={{ color: '#fff', fontSize: 18 }}>⚡</Text>
      </TouchableOpacity>

      {/* Zoom bubble */}
      <TouchableOpacity onPress={toggleZoom} style={styles.zoomBubble}>
        <Text style={styles.zoomText}>{zoom < 0.2 ? '1x' : '2x'}</Text>
      </TouchableOpacity>

      {/* Bottom controls */}
      <View style={styles.bottomOverlay}>
        <View style={styles.modeRow}>
          <View style={styles.modeItem}>
            <Text style={styles.label}>Multi</Text>
            <Switch value={multiMode} onValueChange={toggleMultiMode} />
          </View>

          <View style={styles.modeItem}>
            <Text style={styles.label}>Pointers</Text>
            <Switch value={frozen} onValueChange={onToggleFrozen} />
          </View>

          {multiMode && (
            <Text style={styles.sessionBadge}>
              Session: {sessionCount} photo{sessionCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.coordGroup}>
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Lati:</Text>
              <Text style={styles.coordInputText}>{locked?.lat ?? lat}</Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Longi:</Text>
              <Text style={styles.coordInputText}>{locked?.lon ?? lon}</Text>
            </View>
          </View>
        </View>

        <View style={styles.accuracyRow}>
          <Text style={styles.accuracyLabel}>Accuracy Threshold (meters):</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={decThresh} style={styles.stepBtn}><Text style={styles.stepText}>−</Text></TouchableOpacity>
            <Text style={styles.stepValue}>{accThresh}</Text>
            <TouchableOpacity onPress={incThresh} style={styles.stepBtn}><Text style={styles.stepText}>＋</Text></TouchableOpacity>
          </View>
          <Text style={styles.liveAcc}>({acc != null ? `now: ${acc}m` : '—'})</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.photoLabel}>PHOTO</Text>
            <TouchableOpacity onPress={takeShot} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>

          {multiMode ? (
            <TouchableOpacity onPress={finishSession} style={styles.finishBtn}>
              <Text style={styles.finishText}>Finish</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => lastPhotoUri && setLastPreviewUri(lastPhotoUri)}
              style={styles.galleryBtn}
            >
              {lastPhotoUri ? (
                <Image source={{ uri: lastPhotoUri }} style={styles.thumb} />
              ) : (
                <Text style={{ color: '#fff', fontSize: 18 }}>📷</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Preview confirmation overlay (new shot) */}
      {pendingUri && (
        <View style={styles.previewOverlay}>
          <Image source={{ uri: pendingUri }} style={styles.previewImage} />
          <View style={styles.previewBar}>
            <TouchableOpacity style={styles.roundBtn} onPress={cancelPreview}>
              <Text style={{ color: '#fff', fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundBtn, styles.roundConfirm]} onPress={confirmSave}>
              <Text style={{ color: '#fff', fontSize: 20 }}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fullscreen preview of the LAST saved photo */}
      {lastPreviewUri && (
        <View style={styles.previewOverlay}>
          <Image source={{ uri: lastPreviewUri }} style={styles.previewImage} />
          <View style={styles.previewBar}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => setLastPreviewUri(null)}>
              <Text style={{ color: '#fff', fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roundBtn, styles.roundConfirm]}
              onPress={() => {
                setLastPreviewUri(null);
                router.push('/CollectionScreen');
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },

  flashBtn: { position: 'absolute', top: 18, left: 16, padding: 8 },

  zoomBubble: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 140,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  zoomText: { color: '#fff', fontWeight: '700' },

  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 14 },

  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modeItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionBadge: { color: '#fff' },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { color: '#fff' },

  coordGroup: { flex: 1 },
  coordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  coordLabel: { color: '#fff', width: 48, textAlign: 'right', marginRight: 6 },

  coordInputText: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#000',
  },

  accuracyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  accuracyLabel: { color: '#fff', flex: 1.5 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  stepBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  stepText: { color: '#000', fontSize: 16, fontWeight: '700' },
  stepValue: { color: '#000', width: 28, textAlign: 'center', fontWeight: '700' },
  liveAcc: { color: '#fff', marginLeft: 8 },

  bottomBar: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancel: { color: '#fff', fontSize: 16 },

  photoLabel: { color: '#ffcc00', fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  galleryBtn: { width: 42, height: 42, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  thumb: { width: '100%', height: '100%' },

  finishBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#fff',
    backgroundColor: 'rgba(46,125,50,0.9)',
  },
  finishText: { color: '#fff', fontWeight: '700' },

  previewOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  previewImage: { width: '100%', height: '85%', resizeMode: 'contain' },
  previewBar: { position: 'absolute', bottom: 26, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  roundBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  roundConfirm: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
});
