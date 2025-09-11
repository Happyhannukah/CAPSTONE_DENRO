import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { loadProfile, Profile } from "../utils/profile";

export default function AccountUpdateScreen() {
  const router = useRouter();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => setP(await loadProfile()))();
  }, []);

  if (!p) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Preview</Text>

      {saved === "1" && (
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={18} color="#155724" />
          <Text style={styles.bannerText}>Saved successfully.</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          {p.avatarUri ? (
            <Image source={{ uri: p.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color="#008B8B" />
            </View>
          )}
        </View>

        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.roInput} value={p.firstName} editable={false} />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.roInput} value={p.lastName} editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.roInput} value={p.email} editable={false} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.roInput} value={p.phone ?? ""} editable={false} />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/home")}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/account-edit")}>
            <Text style={styles.secondaryBtnText}>Edit Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#fff", padding:20 },
  title:{ fontSize:18, fontWeight:"700", marginBottom:8 },
  banner:{ backgroundColor:"#D4EDDA", borderColor:"#C3E6CB", borderWidth:1, borderRadius:10, padding:10, flexDirection:"row", alignItems:"center", gap:8 },
  bannerText:{ color:"#155724", fontWeight:"700" },
  card:{ backgroundColor:"#DFFFD8", borderWidth:1, borderColor:"#4CAF50", borderRadius:12, padding:14, marginTop:12 },
  avatarRow:{ alignItems:"center", marginBottom:12 },
  avatar:{ width:84, height:84, borderRadius:84, backgroundColor:"#fff", borderWidth:2, borderColor:"#4CAF50" },
  avatarPlaceholder:{ alignItems:"center", justifyContent:"center", width:84, height:84, borderRadius:84, backgroundColor:"#fff", borderWidth:2, borderColor:"#4CAF50" },
  label:{ fontWeight:"700", marginTop:10, marginBottom:6 },
  roInput:{ backgroundColor:"#f7fff7", borderWidth:1, borderColor:"#A5D6A7", borderRadius:10, paddingHorizontal:12, paddingVertical:10, color:"#2b2b2b" },
  primaryBtn:{ flex:1, backgroundColor:"#008B8B", paddingVertical:12, borderRadius:10, alignItems:"center" },
  primaryBtnText:{ color:"#fff", fontWeight:"700" },
  secondaryBtn:{ flex:1, backgroundColor:"#fff", borderWidth:1, borderColor:"#008B8B", paddingVertical:12, borderRadius:10, alignItems:"center" },
  secondaryBtnText:{ color:"#008B8B", fontWeight:"700" },
});
