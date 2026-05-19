import { StyleSheet, Text, View } from "react-native";

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

export function DocumentScanFrame() {
    return (
        <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>Fit your document inside the frame</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: "space-between",
        paddingBottom: 14,
        paddingTop: 14,
    },
    frame: {
        flex: 1,
        marginHorizontal: 20,
        marginVertical: 8,
    },
    corner: {
        borderColor: "rgba(255, 255, 255, 0.92)",
        height: CORNER_SIZE,
        position: "absolute",
        width: CORNER_SIZE,
    },
    topLeft: {
        borderLeftWidth: CORNER_THICKNESS,
        borderTopWidth: CORNER_THICKNESS,
        left: 0,
        top: 0,
    },
    topRight: {
        borderRightWidth: CORNER_THICKNESS,
        borderTopWidth: CORNER_THICKNESS,
        right: 0,
        top: 0,
    },
    bottomLeft: {
        borderBottomWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        bottom: 0,
        left: 0,
    },
    bottomRight: {
        borderBottomWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        bottom: 0,
        right: 0,
    },
    hint: {
        color: "rgba(255, 255, 255, 0.88)",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.65)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});
