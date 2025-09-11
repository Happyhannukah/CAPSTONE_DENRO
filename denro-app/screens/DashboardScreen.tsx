// screens/DashboardScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SettingsMenu from '../components/SettingsMenu';
import { loadProfile } from '../utils/profile'; // expects { firstName, lastName, role? }

export default function DashboardScreen() {
  const router = useRouter();

  // Settings gear modal (same as HomeScreen)
  const [menuVisible, setMenuVisible] = useState(false);

  // Display name + role loaded from local profile
  const [displayName, setDisplayName] = useState('User');
  const [role, setRole] = useState<string>(''); // optional

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await loadProfile(); // { firstName, lastName, role? }
        const full = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        setDisplayName(full || 'User');
        setRole(typeof (p as any).role === 'string' ? (p as any).role : '');
      })();
    }, [])
  );

  const handleLogout = () => router.replace('/login');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Image source={require('../assets/images/denr-logo.png')} style={styles.logo} />
        <Text style={styles.appName}>DENR GeoCam</Text>

        {/* Gear opens the same Settings modal used on Home */}
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
          style={styles.settingsIcon}
          accessibilityLabel="Open settings menu"
        >
          <Ionicons name="settings-sharp" size={24} color="black" />
        </Pressable>
      </View>

      {/* Navigation Links */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.push('/home')}>
          <Text style={styles.navLink}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/dashboard')}>
          <Text style={styles.navLink}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/form')}>
          <Text style={styles.navLink}>Form</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.navLink}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Stats */}
      <View style={styles.dashboardSection}>
        <Text style={styles.welcomeText}>Dashboard</Text>
        <Text style={styles.username}>
          {displayName}{role ? ` — ${role}` : ''}
        </Text>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>New Evaluation entries</Text>
          <Text style={styles.statValue}>8</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Evaluation entries</Text>
          <Text style={styles.statValue}>30</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Approved</Text>
          <Text style={styles.statValue}>15</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Rejected</Text>
          <Text style={styles.statValue}>5</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Pending</Text>
          <Text style={styles.statValue}>10</Text>
        </View>

        <TouchableOpacity style={styles.importButton}>
          <Text style={styles.importText}>Import file</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom nav tiles */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navIcon}
          onPress={() => router.push('/FormStartSubmission')}
        >
          <Entypo name="list" size={24} color="black" />
          <Text>Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navIcon, styles.activeIcon]}
          onPress={() => router.push('/camera')}
          accessibilityLabel="Open camera"
        >
          <Ionicons name="camera" size={24} color="black" />
          <Text>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navIcon}
          onPress={() => router.push('/CollectionScreen')}
        >
          <FontAwesome name="image" size={24} color="black" />
          <Text>Collection</Text>
        </TouchableOpacity>
      </View>

      {/* Settings modal (same component as Home) */}
      <SettingsMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    margin: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 40, height: 40, resizeMode: 'contain' },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  settingsIcon: { alignSelf: 'flex-end' },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  navLink: { color: '#008B8B', fontSize: 14, fontWeight: '600' },

  dashboardSection: { alignItems: 'center', marginTop: 10 },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    marginRight: 230,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginBottom: 20,
    marginRight: 200,
  },

  statBox: {
    backgroundColor: '#DFFFD8',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  importButton: { padding: 10, borderRadius: 10, backgroundColor: '#008B8B' },
  importText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  navIcon: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    width: 90,
  },
  activeIcon: { backgroundColor: '#DFFFD8' },
});
