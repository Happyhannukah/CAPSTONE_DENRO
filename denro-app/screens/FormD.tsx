import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CommonHeader } from '../components/CommonHeader';
import { BottomNav } from '../components/ui/BottomNav';
import { addSubmission } from '../utils/storage';

type Row = { label: string; selected: boolean; date: string };

export default function FormD() {
  const router = useRouter();
  const [note, setNote] = useState('');

  const [rows, setRows] = useState<Row[]>([
    { label: 'Permits/issuances acquired from LGUs and other government agencies:', selected: false, date: '' },
    { label: "Mayor's Permit, Permit #:", selected: false, date: '' },
    { label: 'Business Permit, Permit #:', selected: false, date: '' },
    { label: 'Building Permit, Permit #:', selected: false, date: '' },
    { label: 'Other permits/issuance acquired from DENR and EMB:', selected: false, date: '' },
    { label: 'ECC, ECC #:', selected: false, date: '' },
    { label: 'CNC, CNC #:', selected: false, date: '' },
    { label: 'Permit to Operate, PTO #:', selected: false, date: '' },
    { label: 'Other EMB related permits:', selected: false, date: '' },
  ]);

  const toggleRow = (i: number) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));

  const setDateAt = (i: number, v: string) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, date: v } : r)));

  const submit = async () => {
    const picked = rows.filter(r => r.selected);
    if (picked.length === 0 && !note.trim()) {
      Alert.alert('Nothing selected', 'Pick at least one item or add a note.');
      return;
    }

    const parts: string[] = [];
    if (picked.length) {
      parts.push(
        picked
          .map(r => (r.date ? `${r.label} (${r.date})` : r.label))
          .join(', ')
      );
    }
    if (note.trim()) parts.push(`Note: ${note.trim()}`);

    await addSubmission({ form: 'D. Residential', note: parts.join(' • ') });

    router.replace('/ViewPreviousEntries');
  };

  return (
    <View style={styles.container}>
      <CommonHeader />

      <View style={styles.formBox}>
        <Text style={styles.formTitle}>D. Residential</Text>
        <Text style={styles.formNote}>
          Note: Provide a short description for each commercial/industrial establishment/facility
          structure as observed.
        </Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
          <TextInput
            placeholder="Short description..."
            value={note}
            onChangeText={setNote}
            style={styles.longInput}
            multiline
          />

          {rows.map((r, i) => (
            <View key={r.label} style={styles.longRow}>
              <TouchableOpacity style={styles.radio} onPress={() => toggleRow(i)}>
                {r.selected ? <View style={styles.radioInner} /> : null}
              </TouchableOpacity>
              <Text style={styles.longLabel}>{r.label}</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="____"
                value={r.date}
                onChangeText={(v) => setDateAt(i, v)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <BottomNav onBack={() => router.back()} onNext={submit} nextLabel="Submit" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 40 },
  formBox: { borderWidth: 1, borderColor: '#000', borderRadius: 8, padding: 10, flex: 1 },
  formTitle: { fontWeight: '700', marginBottom: 4 },
  formNote: { fontSize: 12, marginBottom: 8 },
  longInput: { borderWidth: 1, borderColor: '#000', borderRadius: 6, padding: 8, minHeight: 60, marginBottom: 10 },
  longRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  radio: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#000',
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#2e7d32' },
  longLabel: { flex: 1, fontSize: 14 },
  dateInput: { borderBottomWidth: 1, borderColor: '#000', width: 110, textAlign: 'center', fontSize: 14, paddingVertical: 2 },
});
