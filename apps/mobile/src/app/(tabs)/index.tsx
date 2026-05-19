import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { DocumentScanFrame } from '@/components/scanner/DocumentScanFrame';
import { ScannerSettingsSheet } from '@/components/scanner/ScannerSettingsSheet';
import { BottomTabInset } from '@/constants/theme';
import { invalidateDocScannerSession } from '@/lib/model/docscannerModel';
import type { DocScannerModelId } from '@/lib/model/docscannerModel.types';
import type { ScanSource } from '@/lib/scanner/scan.types';
import { DOCUMENT_CAPTURE_ASPECT_RATIO } from '@/lib/scanner/scan.constants';
import { processScan } from '@/lib/scanner/processScan';
import {
  getMaxProcessingLongEdge,
  getSelectedDocScannerModelId,
  initializeScannerSettings,
  setMaxProcessingLongEdge,
  setSelectedDocScannerModelId,
} from '@/lib/storage/scannerSettings.repository';
import { initializeScansRepository } from '@/lib/storage/scans.repository';
import type { ProcessingLongEdge } from '@/lib/scanner/processingResolution.constants';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back', { physicalDevices: ['wide-angle'] });
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    containerFormat: 'jpeg',
    quality: 0.92,
    qualityPrioritization: 'balanced',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing…');
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<DocScannerModelId | null>(null);
  const [maxProcessingLongEdge, setMaxProcessingLongEdgeState] = useState<ProcessingLongEdge | null>(
    null,
  );

  const bottomInset = insets.bottom + BottomTabInset;

  const canCapture = useMemo(
    () => hasPermission && device && !isProcessing && Platform.OS !== 'web',
    [device, hasPermission, isProcessing],
  );

  useEffect(() => {
    Promise.all([initializeScansRepository(), initializeScannerSettings()])
      .then(() => Promise.all([getSelectedDocScannerModelId(), getMaxProcessingLongEdge()]))
      .then(([modelId, processingLongEdge]) => {
        setSelectedModelId(modelId);
        setMaxProcessingLongEdgeState(processingLongEdge);
      })
      .catch((initError: unknown) => {
        setError(initError instanceof Error ? initError.message : 'Could not open scan storage.');
      });
  }, []);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  async function handleProcessingLongEdgeChange(value: ProcessingLongEdge) {
    setMaxProcessingLongEdgeState(value);

    try {
      await setMaxProcessingLongEdge(value);
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : 'Could not save map resolution preference.',
      );
    }
  }

  async function handleModelChange(modelId: DocScannerModelId) {
    setSelectedModelId(modelId);
    invalidateDocScannerSession();

    try {
      await setSelectedDocScannerModelId(modelId);
    } catch (settingsError) {
      setError(
        settingsError instanceof Error ? settingsError.message : 'Could not save model preference.',
      );
    }
  }

  async function processUri(uri: string, source: ScanSource) {
    setError(null);
    setIsProcessing(true);
    setProcessingLabel('Preparing image');

    try {
      await processScan(uri, source);
      router.push('/recents');
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Scan failed.');
    } finally {
      setIsProcessing(false);
      setProcessingLabel('Processing…');
    }
  }

  async function captureDocument() {
    if (!canCapture) {
      return;
    }

    setProcessingLabel('Capturing');
    const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
    await processUri(`file://${photo.filePath}`, 'camera');
  }

  async function pickDocument() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processUri(result.assets[0].uri, 'gallery');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.previewRegion, { paddingTop: insets.top + 8 }]}>
        <View style={styles.previewAspect}>
          {hasPermission && device ? (
            <Camera
              device={device}
              isActive={!isProcessing && !settingsOpen}
              outputs={[photoOutput]}
              orientationSource="interface"
              resizeMode="cover"
              implementationMode={Platform.OS === 'android' ? 'compatible' : undefined}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackTitle}>Camera unavailable</Text>
              <Text style={styles.cameraFallbackText}>
                Allow camera access, or import a photo from your library.
              </Text>
            </View>
          )}
          <DocumentScanFrame />
        </View>
      </View>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityLabel="Scanner options"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => setSettingsOpen(true)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
          {Platform.OS === 'ios' ? (
            <SymbolView name="slider.horizontal.3" size={22} tintColor="#F4F7F4" weight="medium" />
          ) : (
            <Text style={styles.iconButtonLabel}>Options</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        <Pressable
          accessibilityLabel="Import from library"
          accessibilityRole="button"
          disabled={isProcessing}
          onPress={pickDocument}
          style={({ pressed }) => [
            styles.sideButton,
            isProcessing && styles.sideButtonDisabled,
            pressed && !isProcessing && styles.iconButtonPressed,
          ]}>
          {Platform.OS === 'ios' ? (
            <SymbolView name="photo.on.rectangle" size={26} tintColor="#F4F7F4" weight="medium" />
          ) : (
            <Text style={styles.sideButtonLabel}>Import</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Capture document"
          accessibilityRole="button"
          disabled={!canCapture}
          onPress={captureDocument}
          style={({ pressed }) => [
            styles.shutterOuter,
            !canCapture && styles.shutterDisabled,
            pressed && canCapture && styles.shutterPressed,
          ]}>
          <View style={styles.shutterInner} />
        </Pressable>

        <View style={styles.sideButton} />
      </View>

      {isProcessing ? (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color="#E7FF5F" size="large" />
          <Text style={styles.processingLabel}>{processingLabel}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.errorBanner, { bottom: bottomInset + 88 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScannerSettingsSheet
        visible={settingsOpen}
        selectedModelId={selectedModelId}
        maxProcessingLongEdge={maxProcessingLongEdge}
        disabled={isProcessing}
        onClose={() => setSettingsOpen(false)}
        onModelChange={handleModelChange}
        onProcessingLongEdgeChange={handleProcessingLongEdgeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000',
    flex: 1,
  },
  previewRegion: {
    flex: 1,
    justifyContent: 'center',
  },
  previewAspect: {
    aspectRatio: DOCUMENT_CAPTURE_ASPECT_RATIO,
    backgroundColor: '#000',
    overflow: 'hidden',
    width: '100%',
  },
  cameraFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: '#0B0F12',
    justifyContent: 'center',
    padding: 32,
  },
  cameraFallbackTitle: {
    color: '#F4F7F4',
    fontSize: 18,
    fontWeight: '700',
  },
  cameraFallbackText: {
    color: '#9AA6AF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  topBar: {
    left: 16,
    position: 'absolute',
  },
  bottomBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 12,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  iconButtonLabel: {
    color: '#F4F7F4',
    fontSize: 13,
    fontWeight: '700',
  },
  sideButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 64,
  },
  sideButtonDisabled: {
    opacity: 0.4,
  },
  sideButtonLabel: {
    color: '#F4F7F4',
    fontSize: 13,
    fontWeight: '700',
  },
  shutterOuter: {
    alignItems: 'center',
    borderColor: '#FFF',
    borderRadius: 40,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  shutterDisabled: {
    opacity: 0.45,
  },
  shutterPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  shutterInner: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: 12,
    justifyContent: 'center',
  },
  processingLabel: {
    color: '#F4F7F4',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(20, 24, 28, 0.92)',
    borderRadius: 10,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    right: 16,
  },
  errorText: {
    color: '#FFB267',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
