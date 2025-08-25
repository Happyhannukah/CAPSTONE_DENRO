import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export function CommonHeader() {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Image source={require('../assets/images/denr-logo.png')} style={styles.logo} />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Enumerators Report</Text>
        <View style={styles.headerLinks}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Text style={styles.linkText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/form')}>
            <Text style={styles.linkText}>Form</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo: { width: 50, height: 50, marginRight: 10 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  headerLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  linkText: { color: '#007AFF', marginHorizontal: 8, fontSize: 14 },
});
