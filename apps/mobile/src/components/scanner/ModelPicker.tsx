import { Pressable, StyleSheet, Text, View } from "react-native";

import { DOCSCANNER_MODEL_OPTIONS } from "@/lib/model/docscannerModel.constants";
import type { DocScannerModelId } from "@/lib/model/docscannerModel.types";

interface ModelPickerProps {
    value: DocScannerModelId;
    onChange: (modelId: DocScannerModelId) => void;
    disabled?: boolean;
}

export function ModelPicker({ value, onChange, disabled = false }: ModelPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>ONNX model</Text>
            <View style={styles.options}>
                {DOCSCANNER_MODEL_OPTIONS.map((option) => {
                    const isSelected = option.id === value;

                    return (
                        <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected, disabled }}
                            disabled={disabled}
                            onPress={() => onChange(option.id)}
                            style={({ pressed }) => [
                                styles.option,
                                isSelected && styles.optionSelected,
                                disabled && styles.optionDisabled,
                                pressed && !disabled && styles.optionPressed,
                            ]}
                        >
                            <View style={styles.optionHeader}>
                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                <Text style={[styles.optionSize, isSelected && styles.optionSizeSelected]}>{option.sizeLabel}</Text>
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
        gap: 8,
    },
    option: {
        backgroundColor: "#10151A",
        borderColor: "#2B353F",
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        gap: 4,
        minHeight: 72,
        paddingHorizontal: 12,
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
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
    },
    optionLabelSelected: {
        color: "#E7FF5F",
    },
    optionSize: {
        color: "#9AA6AF",
        fontSize: 12,
        fontWeight: "800",
    },
    optionSizeSelected: {
        color: "#D4E88A",
    },
    optionDescription: {
        color: "#7F8B94",
        fontSize: 11,
        lineHeight: 15,
    },
    optionDescriptionSelected: {
        color: "#B7C2A8",
    },
});
