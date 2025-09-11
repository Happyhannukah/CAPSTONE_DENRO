import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

type StatusType = "Validated" | "Rejected" | "Pending";

export default function ReportStatusDetails() {
  const router = useRouter();
  const p = useLocalSearchParams<{ id?: string | string[]; title?: string | string[]; when?: string | string[]; status?: StatusType | StatusType[] }>();

  const id = useMemo(() => Array.isArray(p.id) ? p.id[0] : p.id, [p.id]);
  const title = useMemo(() => Array.isArray(p.title) ? p.title[0] : p.title, [p.title]);
  const when = useMemo(() => Array.isArray(p.when) ? p.when[0] : p.when, [p.when]);
  const status = useMemo<StatusType | undefined>(() => Array.isArray(p.status) ? p.status[0] as StatusType : p.status as StatusType, [p.status]);

  const handleLogout = () => router.replace("/login");

  const badgeBg =
    status === "Validated" ? { backgroundColor: "#e6f8ee" } :
    status === "Rejected"  ? { backgroundColor: "#fde8e8" } :
    status === "Pending"   ? { backgroundColor: "#eef2ff" } : null;

  const badgeColor =
    status === "Validated" ? { color: "#16a34a" } :
    status === "Rejected"  ? { color: "#ef4444" } :
    status === "Pending"   ? { color: "#4f46e5" } : null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={require("../assets/images/denr-logo.png")} style={styles.logo} />
        <Text style={styles.appName}>DENR GeoCam</Text>
        <Ionicons name="settings-sharp" size={24} color="black" style={styles.settingsIcon} />
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.push("/home")}><Text style={styles.navLink}>Home</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/dashboard")}><Text style={styles.navLink}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/form")}><Text style={styles.navLink}>Form</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.navLink}>Logout</Text></TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { alignSelf:"flex-start" }]}>Report Status Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Report ID</Text>
        <Text style={styles.value}>{id ?? "-"}</Text>

        <Text style={styles.label}>Title</Text>
        <Text style={styles.value}>{title ?? "-"}</Text>

        <Text style={styles.label}>Submitted</Text>
        <Text style={styles.value}>{when ?? "-"}</Text>

        <Text style={styles.label}>Status</Text>
        <View style={[styles.badge, badgeBg]}><Text style={[styles.badgeText, badgeColor]}>{status ?? "-"}</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>← Back</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/reports-status")} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>All Status</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#fff", paddingTop:50, paddingHorizontal:20, borderRadius:20, borderWidth:2, borderColor:"#4CAF50", margin:10 },
  topBar:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  logo:{ width:40, height:40 },
  appName:{ fontSize:16, fontWeight:"600", flex:1, textAlign:"center", marginLeft:-40 },
  settingsIcon:{ alignSelf:"flex-end" },
  navRow:{ flexDirection:"row", justifyContent:"space-around", marginVertical:20 },
  navLink:{ color:"#008B8B", fontSize:14, fontWeight:"600" },
  sectionTitle:{ fontSize:18, fontWeight:"700", marginBottom:8 },
  card:{ backgroundColor:"#DFFFD8", borderWidth:1, borderColor:"#4CAF50", borderRadius:12, padding:14 },
  label:{ fontWeight:"700", marginTop:8 },
  value:{ marginTop:4, marginBottom:6 },
  badge:{ alignSelf:"flex-start", borderRadius:10, paddingHorizontal:10, paddingVertical:6, marginTop:4 },
  badgeText:{ fontWeight:"800" },
  actions:{ marginTop:16, flexDirection:"row", justifyContent:"space-between" },
  primaryBtn:{ backgroundColor:"#008B8B", paddingVertical:12, paddingHorizontal:18, borderRadius:10, alignItems:"center" },
  primaryBtnText:{ color:"#fff", fontWeight:"700" },
  secondaryBtn:{ borderWidth:1, borderColor:"#008B8B", paddingVertical:12, paddingHorizontal:18, borderRadius:10, alignItems:"center" },
  secondaryBtnText:{ color:"#008B8B", fontWeight:"700" },
});
