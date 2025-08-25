import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;

  /** routes for the three shortcuts */
  templatePath?: string;   // default: '/FormStartSubmission'
  cameraPath?: string;     // default: '/camera'
  collectionPath?: string; // default: '/collection'
};

export function BottomNav({
  onBack,
  onNext,
  nextLabel = 'Next',
  templatePath = '/FormStartSubmission',
  cameraPath = '/camera',
  collectionPath = '/CollectionScreen',
}: Props) {
  const router = useRouter();
  const go = (path: string) => router.push(path as any);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.edgeBtn}
        onPress={onBack ?? (() => router.back())}
        accessibilityLabel="Go back"
      >
        <Text style={styles.edgeText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.centerRow}>
        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => go(templatePath)}
          accessibilityLabel="Open template"
        >
          <Text style={styles.centerText}>Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.centerBtn, styles.active]}
          onPress={() => go(cameraPath)}
          accessibilityLabel="Open camera"
        >
          <Text style={styles.centerText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => go(collectionPath)}
          accessibilityLabel="Open collection"
        >
          <Text style={styles.centerText}>Collection</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.edgeBtn}
        onPress={onNext}
        accessibilityLabel={nextLabel}
      >
        <Text style={styles.edgeText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,        // smaller
  },
  edgeBtn: {
    paddingHorizontal: 12,     // smaller
    paddingVertical: 6,        // smaller
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,           // smaller
  },
  edgeText: { fontSize: 12, fontWeight: '600' }, // smaller

  centerRow: { flexDirection: 'row', gap: 6 },   // tighter gap
  centerBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,        // smaller
    paddingHorizontal: 10,     // smaller
    borderRadius: 6,           // smaller
    borderWidth: 1.5,          // slimmer border
    borderColor: '#2e7d32',
    minWidth: 80,              // narrower
  },
  active: { backgroundColor: '#DFFFD8' },
  centerText: { color: '#2e7d32', fontWeight: '600', fontSize: 12 }, // smaller
});
