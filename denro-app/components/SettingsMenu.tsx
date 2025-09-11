// components/SettingsMenu.tsx
import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SettingsMenu({
  visible,
  onClose,
}: { visible: boolean; onClose: () => void }) {
  const router = useRouter();

  const logout = () => { onClose(); router.replace("/login"); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.menu}>
        <TouchableOpacity style={styles.item} onPress={() => { onClose(); router.push("/account-edit"); }}>
          <Ionicons name="person-circle-outline" size={18} color="#008B8B" />
          <Text style={styles.itemText}>Edit Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); router.push("/reports-status"); }}>
          <Ionicons name="checkbox-outline" size={18} color="#008B8B" />
          <Text style={styles.itemText}>Report Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); router.push("/reports-submitted"); }}>
          <Ionicons name="paper-plane-outline" size={18} color="#008B8B" />
          <Text style={styles.itemText}>Submitted Reports</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={[styles.itemText, { color: "#ef4444" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
  menu: { position: "absolute", top: 70, right: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#4CAF50", paddingVertical: 6, width: 220, elevation: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  itemText: { color: "#0f172a", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
});
