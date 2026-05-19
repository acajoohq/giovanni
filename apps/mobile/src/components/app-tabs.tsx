import { Tabs } from "expo-router";
import { Image, StyleSheet, useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
    const scheme = useColorScheme();
    const colors = Colors[scheme === "unspecified" ? "light" : scheme];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.text,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.backgroundElement,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Capture",
                    tabBarIcon: ({ color }) => <Image source={require("@/assets/images/tabIcons/home.png")} style={[styles.icon, { tintColor: color }]} />,
                }}
            />
            <Tabs.Screen
                name="recents"
                options={{
                    title: "Recents",
                    tabBarIcon: ({ color }) => <Image source={require("@/assets/images/tabIcons/explore.png")} style={[styles.icon, { tintColor: color }]} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    icon: {
        height: 24,
        width: 24,
    },
});
