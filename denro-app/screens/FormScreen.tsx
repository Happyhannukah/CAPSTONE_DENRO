// screens/FormScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { loadProfile } from '../utils/profile'; // <- uses AsyncStorage

export default function FormScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('User');
  const [role, setRole] = useState('Evaluator'); // fallback if you don’t store role

  // Reload name each time this screen is focused
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await loadProfile(); // { firstName, lastName, ... }
        const full = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        setDisplayName(full || 'User');

        // If you later store role in the profile, prefer it:
        const maybeRole = (p as any).role;
        setRole(maybeRole && typeof maybeRole === 'string' ? maybeRole : 'Evaluator');
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Back button (top-left, floating) */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Welcome to Form</Text>
      <Text style={styles.subTitle}>{displayName} — {role}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/FormStartSubmission')}
      >
        <Text style={styles.buttonText}>Start New Submission</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/ViewPreviousEntries')}
      >
        <Text style={styles.buttonText}>View Previous Entries</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
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
  },
  backArrow: { fontSize: 18, marginRight: 6, color: '#333' },
  backText: { fontSize: 16, color: '#333', fontWeight: '600' },

  title: { fontSize: 22, fontWeight: 'bold', color: 'teal', marginBottom: 8 },
  subTitle: { fontSize: 14, color: '#555', marginBottom: 20 },

  button: {
    backgroundColor: '#d4fcd4',
    borderWidth: 1,
    borderColor: 'green',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginVertical: 8,
    width: '90%',
    alignItems: 'center',
  },
  buttonText: { color: 'green', fontSize: 16, fontWeight: 'bold' },
});
