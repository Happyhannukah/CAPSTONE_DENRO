import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Entypo, Ionicons, FontAwesome } from '@expo/vector-icons';
import { CommonHeader } from '../components/CommonHeader';
import { addSubmission } from '../utils/storage';

const LEFT_STATUSES = ['Functional', 'Under renovation', 'Under construction'] as const;
const RIGHT_STATUSES = ['Dilapidated', 'Abandoned'] as const;
type Status = typeof LEFT_STATUSES[number] | typeof RIGHT_STATUSES[number];

export default function FormStartSubmission() {
  const router = useRouter();

  // form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('10.3711857');
  const [longitude, setLongitude] = useState('123.9740793');
  const [status, setStatus] = useState<Status | null>(null);

  const dateStr = '20/03/2025';

  const handleNext = async () => {
    try {
      if (!name || !status) {
        Alert.alert('Missing info', 'Please enter Name and choose a Status.');
        return;
      }

      // Save a concise record to local DB (AsyncStorage). ViewPreviousEntries will show it.
      const summary =
        `${name} • ${status}` +
        (location ? ` • ${location}` : '');

      await addSubmission({
        form: 'Start: Enumerator Info',
        note: summary,
      });

      router.push('/FormStartSubmission1');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header like your mockup */}
      <CommonHeader />
      <Text style={styles.homeLink} onPress={() => router.push('/home')}>Home</Text>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.rowText}>
          <Text style={styles.bold}>Date: </Text>{dateStr}
        </Text>

        <LabeledInput label="Name of Proponent/Owner:" value={name} onChangeText={setName} />
        <LabeledInput label="Contact number:" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
        <LabeledInput label="Email address:" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <LabeledInput
          label="Location (Sitio, Brgy, Municipality, Province):"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={[styles.bold, { marginTop: 8 }]}>Coordinates:</Text>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Latitude:</Text>
          <TextInput style={styles.underlineInput} value={latitude} onChangeText={setLatitude} />
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Longitude:</Text>
          <TextInput style={styles.underlineInput} value={longitude} onChangeText={setLongitude} />
        </View>

        <LabeledInput
          label="Area covered/occupied (s.q) per commercial/industrial structure:"
          value={area}
          onChangeText={setArea}
          keyboardType="numeric"
        />

        <Text style={[styles.bold, { marginTop: 10 }]}>Status of establishment/facility/structure:</Text>
        {/* Two-column radio grid */}
        <View style={styles.radioGrid}>
          <View style={styles.radioCol}>
            {LEFT_STATUSES.map(opt => (
              <RadioRow key={opt} label={opt} selected={status === opt} onPress={() => setStatus(opt)} />
            ))}
          </View>
          <View style={styles.radioCol}>
            {RIGHT_STATUSES.map(opt => (
              <RadioRow key={opt} label={opt} selected={status === opt} onPress={() => setStatus(opt)} />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom icon bar (Template / Camera / Collection) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.barIcon}>
          <Entypo name="list" size={24} />
          <Text style={styles.barText}  onPress={() => router.push('/FormStartSubmission')}>Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.barIcon, styles.barIconActive]}>
          <Ionicons name="camera" size={24} />
          <Text style={styles.barText}  onPress={() => router.push('/camera')}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.barIcon}>
          <FontAwesome name="image" size={24} />
          <Text style={styles.barText}  onPress={() => router.push('/CollectionScreen')}>Collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ====== small subcomponents ====== */

function LabeledInput(props: any) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.bold}>{label}</Text>
      <TextInput {...rest} style={[styles.underlineInput, style]} />
    </View>
  );
}

function RadioRow({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ====== styles ====== */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 14, paddingTop: 20 },
  homeLink: { color: 'teal', marginTop: -8, marginBottom: 8, alignSelf: 'flex-start' },

  card: {
    borderWidth: 1, borderColor: '#000',
    borderRadius: 8, padding: 12, flexGrow: 1,
  },
  bold: { fontWeight: '600' },
  rowText: { marginBottom: 8 },

  underlineInput: {
    borderBottomWidth: 1,
    paddingVertical: 4,
  },

  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  coordLabel: { width: 78 },

  radioGrid: { flexDirection: 'row', marginTop: 4, marginBottom: 8, gap: 20 },
  radioCol: { flex: 1 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  radioOuterActive: { borderColor: '#2e7d32' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2e7d32' },
  radioLabel: { fontSize: 14 },

  nextButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    backgroundColor: '#e0ffe0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'green',
  },
  nextText: { fontWeight: '700', color: 'green' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 14,
    flexDirection: 'row', justifyContent: 'space-around',
  },
  barIcon: {
    alignItems: 'center',
    borderWidth: 1, borderColor: '#4CAF50', borderRadius: 12,
    padding: 8, width: 90, backgroundColor: '#fff',
  },
  barIconActive: { backgroundColor: '#DFFFD8' },
  barText: { fontSize: 12, marginTop: 4 },
});
