import { StyleSheet, Text, View } from "react-native";

interface StatusPillProps {
    label: string;
    tone?: "ready" | "working" | "warning";
}

export function StatusPill({ label, tone = "ready" }: StatusPillProps) {
    return (
        <View style={[styles.pill, styles[tone]]}>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    ready: {
        backgroundColor: "#DFF5EA",
    },
    working: {
        backgroundColor: "#E8EDFF",
    },
    warning: {
        backgroundColor: "#FFE8D0",
    },
    label: {
        color: "#111315",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
});
