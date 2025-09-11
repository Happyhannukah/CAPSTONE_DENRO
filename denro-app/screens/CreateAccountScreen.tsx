// screens/CreateAccountScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function CreateAccountScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CENRO' | 'Evaluator' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!API_URL) {
      Alert.alert('Config error', 'EXPO_PUBLIC_API_URL is not set.');
      return;
    }
    if (!email || !username || !password || !role) {
      Alert.alert('Missing info', 'Please fill email, username, password and role.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, role }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Registration failed');
      }

      Alert.alert('Success', 'Account created. You can now log in.', [
        { text: 'OK', onPress: () => router.back() }, // <— no hard-coded path
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <Image source={require('../assets/images/DENR.png')} style={styles.logo} />

      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <TextInput
          placeholder="Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        {/* Role selector */}
        <View style={styles.roleRow}>
          {(['CENRO', 'Evaluator'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
        </TouchableOpacity>

        {/* No hard-coded path — just go back to whatever screen opened this (your Login screen) */}
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ textAlign: 'center', color: '#005288' }}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    width,
    height,
    resizeMode: 'contain',
    opacity: 0.9,
    bottom: 160,
  },
  container: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    padding: 25,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    color: '#333',
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  roleChip: {
    borderWidth: 1,
    borderColor: '#005288',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  roleChipActive: { backgroundColor: '#005288' },
  roleText: { color: '#005288', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#005288',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 1 },
});
