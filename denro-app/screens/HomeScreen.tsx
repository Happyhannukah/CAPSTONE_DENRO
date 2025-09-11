import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { Ionicons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SettingsMenu from '../components/SettingsMenu';
import { loadProfile } from '../utils/profile';

export default function HomeScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [name, setName] = useState('Juan Dela Cruz');
  const [role, setRole] = useState('Evaluator'); // set from auth later if needed

  // Refresh name whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await loadProfile();
        const full = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        setName(full || 'User');
      })();
    }, [])
  );

  const handleLogout = () => router.replace('/login');

  return (
    <View style={styles.container}>
      <View className="top">
        <View style={styles.topBar}>
          <Image source={require('../assets/images/denr-logo.png')} style={styles.logo} />
          <Text style={styles.appName}>DENR GeoCam</Text>
          <Pressable onPress={() => setMenuVisible(true)} hitSlop={12} style={styles.settingsIcon}>
            <Ionicons name="settings-sharp" size={24} color="black" />
          </Pressable>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.push('/home')}><Text style={styles.navLink}>Home</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/dashboard')}><Text style={styles.navLink}>Dashboard</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/form')}><Text style={styles.navLink}>Form</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}><Text style={styles.navLink}>Logout</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>WELCOME!</Text>
        <Text style={styles.username}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navIcon} onPress={() => router.push('/FormStartSubmission')}><Entypo name="list" size={24} color="black" /><Text>Template</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.navIcon, styles.activeIcon]} onPress={() => router.push('/camera')}><Ionicons name="camera" size={24} color="black" /><Text>Camera</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navIcon} onPress={() => router.push('/CollectionScreen')}><FontAwesome name="image" size={24} color="black" /><Text>Collection</Text></TouchableOpacity>
      </View>

      <SettingsMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', paddingTop:50, paddingHorizontal:20, borderRadius:20, borderWidth:2, borderColor:'#4CAF50', margin:10 },
  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  logo: { width:40, height:40 },
  appName: { fontSize:16, fontWeight:'600', flex:1, textAlign:'center', marginLeft:-40 },
  settingsIcon: { alignSelf:'flex-end' },
  navRow: { flexDirection:'row', justifyContent:'space-around', marginTop:10, marginBottom:20 },
  navLink: { color:'#008B8B', fontSize:14, fontWeight:'600' },
  welcomeSection: { alignItems:'center', marginTop:40 },
  welcomeText: { fontSize:28, fontWeight:'900' },
  username: { fontSize:18, fontWeight:'bold', textDecorationLine:'underline' },
  role: { fontSize:14, color:'#222', marginTop:4 },
  bottomNav: { position:'absolute', bottom:30, left:0, right:0, flexDirection:'row', justifyContent:'space-around', paddingHorizontal:20 },
  navIcon: { alignItems:'center', backgroundColor:'#fff', padding:10, borderRadius:12, borderWidth:2, borderColor:'#4CAF50', width:90 },
  activeIcon: { backgroundColor:'#DFFFD8' },
});
