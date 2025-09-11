// import React from "react";
// import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// type Row = { id: string; title: string; when: string };

// const DATA: Row[] = [
//   { id: "s-201", title: "Jugan Consolacion, Cebu, Purok 12 — 02:30 PM", when: "Mar 22, 2025 | 2:30 PM" },
//   { id: "s-202", title: "Jugan Consolacion, Cebu, Purok 11 — 02:00 PM", when: "Mar 22, 2025 | 2:00 PM" },
//   { id: "s-203", title: "Jugan Consolacion, Cebu, Purok 10 — 01:30 PM", when: "Mar 22, 2025 | 1:30 PM" },
// ];

// export default function SubmittedReportsScreen() {
//   const router = useRouter();
//   const handleLogout = () => router.replace("/login");

//   const renderRow = ({ item }: { item: Row }) => (
//     <View style={styles.listCard}>
//       <Text style={styles.rowTitle}>{item.title}</Text>
//       <Text style={styles.rowMeta}>{item.when}</Text>
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

//       <Text style={[styles.sectionTitle, { alignSelf:"flex-start" }]}>Submitted Reports</Text>
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
//   rowMeta:{ color:"#444" },
// });





import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Row = { id: string; title: string; when: string };

const DATA: Row[] = [
  { id: "s-201", title: "Jugan Consolacion, Cebu, Purok 12 — 02:30 PM", when: "Mar 22, 2025 | 2:30 PM" },
  { id: "s-202", title: "Jugan Consolacion, Cebu, Purok 11 — 02:00 PM", when: "Mar 22, 2025 | 2:00 PM" },
  { id: "s-203", title: "Jugan Consolacion, Cebu, Purok 10 — 01:30 PM", when: "Mar 22, 2025 | 1:30 PM" },
];

export default function SubmittedReportsScreen() {
  const router = useRouter();
  const handleLogout = () => router.replace("/login");

  const goDetails = (item: Row) =>
    router.push({ pathname: "/reports-submitted-details", params: { id: item.id, title: item.title, when: item.when } });

  const renderRow = ({ item }: { item: Row }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => goDetails(item)}>
      <View style={styles.listCard}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>{item.when}</Text>

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

      <Text style={[styles.sectionTitle, { alignSelf:"flex-start" }]}>Submitted Reports</Text>
      <FlatList contentContainerStyle={{ paddingBottom:30 }} data={DATA} keyExtractor={(i)=>i.id} renderItem={renderRow}/>
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
  rowMeta:{ color:"#444" },

  detailsBtn:{ alignSelf:"flex-end", marginTop:8, flexDirection:"row", gap:4, borderWidth:1, borderColor:"#008B8B", paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  detailsBtnText:{ color:"#008B8B", fontWeight:"700" },
});
