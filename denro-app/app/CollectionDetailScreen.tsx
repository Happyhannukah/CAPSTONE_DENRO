// app/CollectionDetailScreen.tsx
import { useLocalSearchParams } from 'expo-router';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';

export default function Page() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return null; // or a loading state

  return <CollectionDetailScreen sessionId={String(id)} />;
}
