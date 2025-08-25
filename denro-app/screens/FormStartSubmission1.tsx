import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function FormStartSubmission1() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();

  // Labels to render
  const labels = [
    'A. Major Facilities',
    'B. Government Buildings & Structures',
    'C. Other Buildings & Structures',
    'D. Residential',
  ] as const;

  // Matching routes by index (no item.route usage)
  const routes = ['/FormA', '/FormB', '/FormC', '/FormD'] as const;

  return (
    <View style={styles.container}>
      {/* success banner when returning from FormD */}
      {status === 'ok' && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Submission successful!</Text>
        </View>
      )}

      <Text style={styles.title}>Select a Category</Text>

      {labels.map((label, index) => (
        <TouchableOpacity
          key={label}
          style={styles.button}
          onPress={() => router.push(routes[index])}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80, backgroundColor: '#fff' },
  successBanner: {
    backgroundColor: '#E7F7ED',
    borderColor: '#2E7D32',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  successText: { color: '#2E7D32', fontWeight: '700', textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 32, textAlign: 'center', color: '#333' },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '500' },
});
