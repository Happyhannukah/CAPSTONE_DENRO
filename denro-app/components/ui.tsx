import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

/** ==== THEME ==== */
export const COLORS = {
  green: "#1B5E20",
  greenDark: "#124416",
  greenLight: "#EAF4EE",
  page: "#F5F7F6",
  border: "#CFE2D5",
  text: "#0f2417",
  muted: "#5f6f64",
  white: "#FFFFFF",

  pending: "#2E7DFF",
  rejected: "#D32F2F",
  validated: "#2E7D32",
};

export const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.page}>{children}</View>
);

/** ==== HEADER (logo + title + gear) ==== */
export const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      {/* change path to your logo if needed */}
      <Image source={require("../../assets/images/denr-logo.png")} style={styles.logo} />
      <Text style={styles.headerTitle}>DENR GeoCam</Text>
      <Text style={styles.headerGear}>⚙️</Text>
    </View>
  );
};

/** ==== TOP NAV (text links like mockup) ==== */
export const TopTabs: React.FC = () => {
  const router = useRouter();
  return (
    <View style={styles.topTabs}>
      <Pressable onPress={() => router.push("/home")}><Text style={styles.topLink}>Home</Text></Pressable>
      <Pressable onPress={() => router.push("/dashboard")}><Text style={styles.topLink}>Dashboard</Text></Pressable>
      <Pressable onPress={() => router.push("/form")}><Text style={styles.topLink}>Form</Text></Pressable>
      <Pressable onPress={() => router.replace("/login")}><Text style={styles.topLink}>Logout</Text></Pressable>
    </View>
  );
};

/** ==== BOTTOM TABS (like mockup) ==== */
export const BottomTabs: React.FC<{ active?: "home"|"dashboard"|"form" }> = ({ active }) => {
  const router = useRouter();
  const Item = ({ label, route, isActive }: { label: string; route: string; isActive?: boolean }) => (
    <Pressable onPress={() => router.push("/dashboard")} style={[styles.bottomItem, isActive && styles.bottomActive]}>
      <Text style={[styles.bottomText, isActive && styles.bottomTextActive]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.bottomTabs}>
      <Item label="Home" route="/home" isActive={active==="home"} />
      <Item label="Dashboard" route="/dashboard" isActive={active==="dashboard"} />
      <Item label="Form" route="/form" isActive={active==="form"} />
    </View>
  );
};

/** ==== CARD + BUTTON + BADGE (for lists/status) ==== */
export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

export const PrimaryButton: React.FC<{ title: string; onPress: () => void }> = ({ title, onPress }) => (
  <Pressable onPress={onPress} style={styles.primaryBtn}>
    <Text style={styles.primaryBtnText}>{title}</Text>
  </Pressable>
);

export const Badge: React.FC<{ kind: "VALIDATED"|"PENDING"|"REJECTED" }> = ({ kind }) => {
  const bg =
    kind === "VALIDATED" ? COLORS.validated :
    kind === "PENDING"    ? COLORS.pending  :
                            COLORS.rejected;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{kind}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex:1, backgroundColor: COLORS.page },
  header: {
    backgroundColor: COLORS.green,
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center"
  },
  logo: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, marginRight: 10 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "800", flex: 1 },
  headerGear: { color: COLORS.white, fontSize: 18 },

  topTabs: { backgroundColor: COLORS.white, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", gap: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  topLink: { color: COLORS.text, fontWeight: "600" },

  bottomTabs: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white
  },
  bottomItem: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  bottomActive: { backgroundColor: COLORS.greenLight },
  bottomText: { color: COLORS.muted, fontWeight: "700" },
  bottomTextActive: { color: COLORS.greenDark },

  card: { backgroundColor: COLORS.greenLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14 },

  primaryBtn: {
    backgroundColor: COLORS.green, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 10
  },
  primaryBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },

  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: "flex-start" },
  badgeText: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
});
