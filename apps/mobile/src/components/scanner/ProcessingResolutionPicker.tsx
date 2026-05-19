import { Pressable, StyleSheet, Text, View } from "react-native";

import { PROCESSING_LONG_EDGE_PRESETS, type ProcessingLongEdge } from "@/lib/scanner/processingResolution.constants";

interface ProcessingResolutionPickerProps {
    value: ProcessingLongEdge;
    onChange: (value: ProcessingLongEdge) => void;
    disabled?: boolean;
}

export function ProcessingResolutionPicker({ value, onChange, disabled = false }: ProcessingResolutionPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Map long edge</Text>
            <View style={styles.options}>
                {PROCESSING_LONG_EDGE_PRESETS.map((option) => {
                    const isSelected = option.value === value;

                    return (
                        <Pressable
                            key={option.value}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled }}
                            disabled={disabled}
                            onPress={() => onChange(option.value)}
                            style={({ pressed }) => [
                                styles.option,
                                isSelected && styles.optionSelected,
                                disabled && styles.optionDisabled,
                                pressed && !disabled && styles.optionPressed,
                            ]}
                        >
                            <View style={styles.optionHeader}>
                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                <Text style={[styles.optionSize, isSelected && styles.optionSizeSelected]}>{option.value}px</Text>
                            </View>
                            <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    label: {
        color: "#A7B2BA",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    options: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    option: {
        backgroundColor: "#10151A",
        borderColor: "#2B353F",
        borderRadius: 8,
        borderWidth: 1,
        flexBasis: "47%",
        flexGrow: 1,
        gap: 4,
        minHeight: 68,
        minWidth: 140,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    optionSelected: {
        backgroundColor: "#1A2218",
        borderColor: "#E7FF5F",
    },
    optionDisabled: {
        opacity: 0.45,
    },
    optionPressed: {
        opacity: 0.82,
    },
    optionHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    optionLabel: {
        color: "#E2E8ED",
        fontSize: 13,
        fontWeight: "900",
    },
    optionLabelSelected: {
        color: "#E7FF5F",
    },
    optionSize: {
        color: "#9AA6AF",
        fontSize: 11,
        fontWeight: "800",
    },
    optionSizeSelected: {
        color: "#D4E88A",
    },
    optionDescription: {
        color: "#7F8B94",
        fontSize: 10,
        lineHeight: 14,
    },
    optionDescriptionSelected: {
        color: "#B7C2A8",
    },
});
