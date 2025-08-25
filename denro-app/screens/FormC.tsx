import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CommonHeader } from '../components/CommonHeader';
import { BottomNav } from '../components/ui/BottomNav';
import { addSubmission } from '../utils/storage';

type Row = { label: string; selected: boolean; date: string };

export default function FormC() {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([
    { label: 'Hotel Room', selected: false, date: '' },
    { label: 'Accommodation/lodging rest house', selected: false, date: '' },
    { label: 'Coffee Shop', selected: false, date: '' },
    { label: 'Restaurant', selected: false, date: '' },
    { label: 'Garden/Farm', selected: false, date: '' },
    { label: 'Water refilling station', selected: false, date: '' },
    { label: 'Merchandising/enterprise', selected: false, date: '' },
    { label: 'Motorshop', selected: false, date: '' },
    { label: 'Gasoline Station', selected: false, date: '' },
    { label: 'Internet Shop', selected: false, date: '' },
    { label: 'Pharmacy/ Drug Store', selected: false, date: '' },
    { label: 'Resort', selected: false, date: '' },
    { label: 'Recreational', selected: false, date: '' },
    { label: 'Nature Camp', selected: false, date: '' },
  ]);

  const toggleRow = (i: number) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));

  const setDateAt = (i: number, v: string) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, date: v } : r)));

  const handleNext = async () => {
    const picked = rows.filter(r => r.selected);
    if (picked.length === 0) {
      Alert.alert('Nothing selected', 'Please select at least one item.');
      return;
    }

    const summary = picked
      .map(r => (r.date ? `${r.label} (${r.date})` : r.label))
      .join(', ');

    await addSubmission({ form: 'C. Other Buildings & Structures', note: summary });
    router.push('/FormD');
  };

  return (
    <View style={styles.container}>
      <CommonHeader />

      <View style={styles.formBox}>
        <Text style={styles.formTitle}>C. Other Buildings & Structures</Text>
        <Text style={styles.formNote}>Check as applicable and as observed and date established</Text>

        <View style={styles.headerRow}>
          <Text style={styles.typeLabel}>Type</Text>
          <Text style={styles.dateLabel}>Date Est.</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
          {rows.map((r, idx) => (
            <View key={r.label} style={styles.row}>
              <TouchableOpacity style={styles.radio} onPress={() => toggleRow(idx)}>
                {r.selected ? <View style={styles.radioInner} /> : null}
              </TouchableOpacity>
              <Text style={styles.typeText}>{r.label}</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="____"
                value={r.date}
                onChangeText={(v) => setDateAt(idx, v)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <BottomNav onBack={() => router.back()} onNext={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 40 },
  formBox: { borderWidth: 1, borderColor: '#000', borderRadius: 8, padding: 10, flex: 1 },
  formTitle: { fontWeight: '700', marginBottom: 4 },
  formNote: { fontSize: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  typeLabel: { fontWeight: '600' },
  dateLabel: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radio: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#000',
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#2e7d32' },
  typeText: { flex: 1, fontSize: 14 },
  dateInput: { borderBottomWidth: 1, borderColor: '#000', width: 100, textAlign: 'center', fontSize: 14, paddingVertical: 2 },
});
