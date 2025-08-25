import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'submissions';

export type Submission = {
  id: number;
  form: string;       // e.g. 'D. Residential'
  note?: string;
  createdAt: string;  // ISO
};

export async function getSubmissions(): Promise<Submission[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addSubmission(entry: Omit<Submission, 'id'|'createdAt'>) {
  const list = await getSubmissions();
  const newItem: Submission = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  list.unshift(newItem);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return newItem;
}

export async function clearSubmissions() {
  await AsyncStorage.removeItem(KEY);
}
