import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  Alert, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  loadProfile, saveProfile, saveAvatarToAppFiles, tryDeleteFile, Profile
} from "../utils/profile";

export default function AccountEditScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("Juan");
  const [lastName, setLastName]   = useState("Dela Cruz");
  const [email, setEmail]         = useState("juan.delacruz@example.com");
  const [phone, setPhone]         = useState("09XXXXXXXXX");
  const [avatarUri, setAvatarUri] = useState<string | undefined>("");
  const [loading, setLoading] = useState(false);

  // Load current profile once
  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setEmail(p.email);
      setPhone(p.phone ?? "");
      setAvatarUri(p.avatarUri || "");
    })();
  }, []);

  // Pick from gallery and copy to app files
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to set your picture.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled) return;

    setLoading(true);
    try {
      // copy to app storage so it persists
      const copied = await saveAvatarToAppFiles(res.assets[0].uri);
      // clean old file (optional)
      if (avatarUri && avatarUri !== copied) await tryDeleteFile(avatarUri);
      setAvatarUri(copied);
    } catch (e: any) {
      Alert.alert("Image error", e?.message ?? "Could not save the image.");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing name", "Please enter both first and last name.");
      return false;
    }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const profile: Profile = { firstName, lastName, email, phone, avatarUri };
      await saveProfile(profile);
      router.replace({ pathname: "/account-update", params: { saved: "1" } });
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => router.replace("/login");

  return (
    <View style={styles.container}>
      {/* header & nav trimmed for brevity */}
      <Text style={[styles.sectionTitle, { alignSelf: "flex-start" }]}>Personal Information</Text>

      <View style={styles.card}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={36} color="#008B8B" />
              </View>
            )}
            <TouchableOpacity style={styles.editBadge} onPress={pickImage} disabled={loading}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fields */}
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType={Platform.select({ ios: "number-pad", android: "phone-pad" })}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#fff", padding:20 },
  sectionTitle:{ fontSize:18, fontWeight:"700", marginBottom:8 },
  card:{ backgroundColor:"#DFFFD8", borderWidth:1, borderColor:"#4CAF50", borderRadius:12, padding:14 },
  avatarRow:{ alignItems:"center", marginBottom:12 },
  avatarWrap:{ position:"relative" },
  avatar:{ width:84, height:84, borderRadius:84, backgroundColor:"#fff", borderWidth:2, borderColor:"#4CAF50" },
  avatarPlaceholder:{ alignItems:"center", justifyContent:"center" },
  editBadge:{ position:"absolute", bottom:-2, right:-2, width:28, height:28, borderRadius:28, backgroundColor:"#008B8B", alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#DFFFD8" },
  label:{ fontWeight:"700", marginTop:10, marginBottom:6 },
  input:{ backgroundColor:"#fff", borderWidth:1, borderColor:"#4CAF50", borderRadius:10, paddingHorizontal:12, paddingVertical:10 },
  saveBtn:{ backgroundColor:"#008B8B", paddingVertical:12, borderRadius:10, alignItems:"center", marginTop:16 },
  saveText:{ color:"#fff", fontWeight:"700" },
});
