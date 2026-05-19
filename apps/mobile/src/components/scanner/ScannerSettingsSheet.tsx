import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModelPicker } from "@/components/scanner/ModelPicker";
import { ProcessingResolutionPicker } from "@/components/scanner/ProcessingResolutionPicker";
import type { DocScannerModelId } from "@/lib/model/docscannerModel.types";
import type { ProcessingLongEdge } from "@/lib/scanner/processingResolution.constants";

interface ScannerSettingsSheetProps {
    visible: boolean;
    selectedModelId: DocScannerModelId | null;
    maxProcessingLongEdge: ProcessingLongEdge | null;
    disabled?: boolean;
    onClose: () => void;
    onModelChange: (modelId: DocScannerModelId) => void;
    onProcessingLongEdgeChange: (value: ProcessingLongEdge) => void;
}

export function ScannerSettingsSheet({
    visible,
    selectedModelId,
    maxProcessingLongEdge,
    disabled = false,
    onClose,
    onModelChange,
    onProcessingLongEdgeChange,
}: ScannerSettingsSheetProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.root}>
                <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Scanner options</Text>
                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {selectedModelId ? <ModelPicker value={selectedModelId} onChange={onModelChange} disabled={disabled} /> : null}
                        {maxProcessingLongEdge ? <ProcessingResolutionPicker value={maxProcessingLongEdge} onChange={onProcessingLongEdgeChange} disabled={disabled} /> : null}
                    </ScrollView>
                    <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}>
                        <Text style={styles.doneLabel}>Done</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    sheet: {
        backgroundColor: "#151A1F",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        gap: 14,
        maxHeight: "82%",
        paddingHorizontal: 18,
        paddingTop: 10,
    },
    handle: {
        alignSelf: "center",
        backgroundColor: "#3A4550",
        borderRadius: 2,
        height: 4,
        width: 36,
    },
    title: {
        color: "#F4F7F4",
        fontSize: 17,
        fontWeight: "700",
        textAlign: "center",
    },
    content: {
        gap: 20,
        paddingBottom: 8,
    },
    doneButton: {
        alignItems: "center",
        backgroundColor: "#E7FF5F",
        borderRadius: 12,
        justifyContent: "center",
        minHeight: 48,
    },
    doneButtonPressed: {
        opacity: 0.85,
    },
    doneLabel: {
        color: "#111315",
        fontSize: 16,
        fontWeight: "800",
    },
});
