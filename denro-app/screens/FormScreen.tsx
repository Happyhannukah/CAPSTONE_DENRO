import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function FormScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Form</Text>
      <Text style={styles.subTitle}>Juan Dela Cruz — Enumerator</Text>

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
  logout: { marginTop: 20, color: 'red', fontWeight: 'bold' },
});
