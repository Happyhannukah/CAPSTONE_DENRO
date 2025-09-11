// import React from "react";
// import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// type Row = { id: string; title: string; when: string; status: "Validated" | "Rejected" | "Pending" };

// const DATA: Row[] = [
//   { id: "r-100", title: "Barangay 1 - Tree Count", when: "Mar 20, 2025 | 2:40 PM", status: "Validated" },
//   { id: "r-101", title: "Barangay 2 - Tree Count", when: "Mar 21, 2025 | 8:10 AM", status: "Pending" },
//   { id: "r-102", title: "Barangay 3 - Mangrove", when: "Mar 21, 2025 | 9:05 AM", status: "Rejected" },
// ];

// export default function ReportStatusScreen() {
//   const router = useRouter();
//   const handleLogout = () => router.replace("/login");

//   const renderRow = ({ item }: { item: Row }) => (
//     <View style={styles.listCard}>
//       <Text style={styles.rowTitle}>{item.title}</Text>
//       <Text style={styles.rowMeta}>{item.when}</Text>
//       <View style={[
//         styles.badge,
//         item.status === "Validated" && { backgroundColor:"#e6f8ee" },
//         item.status === "Rejected"  && { backgroundColor:"#fde8e8" },
//         item.status === "Pending"   && { backgroundColor:"#eef2ff" },
//       ]}>
//         <Text style={[
//           styles.badgeText,
//           item.status === "Validated" && { color:"#16a34a" },
//           item.status === "Rejected"  && { color:"#ef4444" },
//           item.status === "Pending"   && { color:"#4f46e5" },
//         ]}>
//           {item.status}
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.topBar}>
//         <Image source={require("../assets/images/denr-logo.png")} style={styles.logo} />
//         <Text style={styles.appName}>DENR GeoCam</Text>
//         <Ionicons name="settings-sharp" size={24} color="black" style={styles.settingsIcon} />
//       </View>

//       <View style={styles.navRow}>
//         <TouchableOpacity onPress={() => router.push("/home")}><Text style={styles.navLink}>Home</Text></TouchableOpacity>
//         <TouchableOpacity onPress={() => router.push("/dashboard")}><Text style={styles.navLink}>Dashboard</Text></TouchableOpacity>
//         <TouchableOpacity onPress={() => router.push("/form")}><Text style={styles.navLink}>Form</Text></TouchableOpacity>
//         <TouchableOpacity onPress={handleLogout}><Text style={styles.navLink}>Logout</Text></TouchableOpacity>
//       </View>

//       <Text style={[styles.sectionTitle, { alignSelf:"flex-start" }]}>Report Status</Text>
//       <FlatList contentContainerStyle={{ paddingBottom:30 }} data={DATA} keyExtractor={(i)=>i.id} renderItem={renderRow}/>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container:{ flex:1, backgroundColor:"#fff", paddingTop:50, paddingHorizontal:20, borderRadius:20, borderWidth:2, borderColor:"#4CAF50", margin:10 },
//   topBar:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
//   logo:{ width:40, height:40 },
//   appName:{ fontSize:16, fontWeight:"600", flex:1, textAlign:"center", marginLeft:-40 },
//   settingsIcon:{ alignSelf:"flex-end" },
//   navRow:{ flexDirection:"row", justifyContent:"space-around", marginVertical:20 },
//   navLink:{ color:"#008B8B", fontSize:14, fontWeight:"600" },
//   sectionTitle:{ fontSize:18, fontWeight:"700", marginBottom:8 },
//   listCard:{ backgroundColor:"#DFFFD8", borderWidth:1, borderColor:"#4CAF50", marginVertical:6, borderRadius:12, padding:12 },
//   rowTitle:{ fontWeight:"800", marginBottom:2 },
//   rowMeta:{ color:"#444", marginBottom:6 },
//   badge:{ alignSelf:"flex-start", borderRadius:10, paddingHorizontal:10, paddingVertical:6 },
//   badgeText:{ fontWeight:"800" },
// });





import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Row = { id: string; title: string; when: string; status: "Validated" | "Rejected" | "Pending" };

const DATA: Row[] = [
  { id: "r-100", title: "Barangay 1 - Tree Count", when: "Mar 20, 2025 | 2:40 PM", status: "Validated" },
  { id: "r-101", title: "Barangay 2 - Tree Count", when: "Mar 21, 2025 | 8:10 AM", status: "Pending" },
  { id: "r-102", title: "Barangay 3 - Mangrove", when: "Mar 21, 2025 | 9:05 AM", status: "Rejected" },
];

export default function ReportStatusScreen() {
  const router = useRouter();
  const handleLogout = () => router.replace("/login");

  const goDetails = (item: Row) =>
    router.push({
      pathname: "/reports-status-details",
      params: { id: item.id, title: item.title, when: item.when, status: item.status },
    });

  const renderRow = ({ item }: { item: Row }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => goDetails(item)}>
      <View style={styles.listCard}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>{item.when}</Text>

        <View
          style={[
            styles.badge,
            item.status === "Validated" && { backgroundColor: "#e6f8ee" },
            item.status === "Rejected" && { backgroundColor: "#fde8e8" },
            item.status === "Pending" && { backgroundColor: "#eef2ff" },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.status === "Validated" && { color: "#16a34a" },
              item.status === "Rejected" && { color: "#ef4444" },
              item.status === "Pending" && { color: "#4f46e5" },
            ]}
          >
            {item.status}
          </Text>
        </View>

        <TouchableOpacity style={styles.detailsBtn} onPress={() => goDetails(item)}>
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#008B8B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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

      <Text style={[styles.sectionTitle, { alignSelf: "flex-start" }]}>Report Status</Text>
      <FlatList contentContainerStyle={{ paddingBottom: 30 }} data={DATA} keyExtractor={(i) => i.id} renderItem={renderRow} />
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

  listCard:{ backgroundColor:"#DFFFD8", borderWidth:1, borderColor:"#4CAF50", marginVertical:6, borderRadius:12, padding:12 },
  rowTitle:{ fontWeight:"800", marginBottom:2 },
  rowMeta:{ color:"#444", marginBottom:6 },

  badge:{ alignSelf:"flex-start", borderRadius:10, paddingHorizontal:10, paddingVertical:6 },
  badgeText:{ fontWeight:"800" },

  detailsBtn:{ alignSelf:"flex-end", marginTop:8, flexDirection:"row", gap:4, borderWidth:1, borderColor:"#008B8B", paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  detailsBtnText:{ color:"#008B8B", fontWeight:"700" },
});
