import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

type ScannerButtonTone = "primary" | "secondary" | "ghost";

interface ScannerButtonProps extends PressableProps {
    label: string;
    tone?: ScannerButtonTone;
}

export function ScannerButton({ label, tone = "primary", style, disabled, ...props }: ScannerButtonProps) {
    return (
        <Pressable
            {...props}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                styles[tone],
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
                typeof style === "function" ? style({ pressed, hovered: false }) : style,
            ]}
        >
            <Text style={[styles.label, tone === "secondary" && styles.secondaryLabel]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: "center",
        borderRadius: 8,
        minHeight: 48,
        justifyContent: "center",
        paddingHorizontal: 18,
    },
    primary: {
        backgroundColor: "#E7FF5F",
    },
    secondary: {
        backgroundColor: "#1B2127",
        borderColor: "#303943",
        borderWidth: 1,
    },
    ghost: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    label: {
        color: "#111315",
        fontSize: 15,
        fontWeight: "800",
    },
    secondaryLabel: {
        color: "#F4F7F4",
    },
    disabled: {
        opacity: 0.45,
    },
    pressed: {
        opacity: 0.82,
        transform: [{ scale: 0.99 }],
    },
});
