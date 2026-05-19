import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { ModelPicker } from '@/components/scanner/ModelPicker';
import { ScanCard } from '@/components/scanner/ScanCard';
import { ScannerButton } from '@/components/scanner/ScannerButton';
import { StatusPill } from '@/components/scanner/StatusPill';
import { invalidateDocScannerSession } from '@/lib/model/docscannerModel';
import { getDocScannerModelOption } from '@/lib/model/docscannerModel.constants';
import type { DocScannerModelId } from '@/lib/model/docscannerModel.types';
import type { ScanRecord, ScanSource, ScanTiming } from '@/lib/scanner/scan.types';
import { processScan } from '@/lib/scanner/processScan';
import {
  getSelectedDocScannerModelId,
  initializeScannerSettings,
  setSelectedDocScannerModelId,
} from '@/lib/storage/scannerSettings.repository';
import { initializeScansRepository } from '@/lib/storage/scans.repository';

export default function ScanScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    containerFormat: 'jpeg',
    quality: 0.92,
    qualityPrioritization: 'balanced',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [lastTimings, setLastTimings] = useState<ScanTiming[]>([]);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<DocScannerModelId | null>(null);

  const canCapture = useMemo(
    () => hasPermission && device && !isProcessing && Platform.OS !== 'web',
    [device, hasPermission, isProcessing],
  );

  useEffect(() => {
    Promise.all([initializeScansRepository(), initializeScannerSettings()])
      .then(() => getSelectedDocScannerModelId())
      .then(setSelectedModelId)
      .catch((initError: unknown) => {
        setError(initError instanceof Error ? initError.message : 'Could not open scan storage.');
      });
  }, []);

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

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  async function processUri(uri: string, source: ScanSource) {
    setError(null);
    setIsProcessing(true);
    setProcessingLabel('Preparing image');

    try {
      const result = await processScan(uri, source);
      setLastScan(result.scan);
      setLastTimings(result.timings);
      router.push('/recents');
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Scan failed.');
    } finally {
      setIsProcessing(false);
      setProcessingLabel('Ready');
    }
  }

  async function captureDocument() {
    if (!canCapture) {
      return;
    }

    setProcessingLabel('Capturing document');
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>On-device rectification</Text>
            <Text style={styles.title}>Document Scan</Text>
          </View>
          <StatusPill label={isProcessing ? 'Working' : 'Ready'} tone={isProcessing ? 'working' : 'ready'} />
        </View>

        <View style={styles.cameraFrame}>
          {hasPermission && device ? (
            <Camera
              device={device}
              isActive={!isProcessing}
              outputs={[photoOutput]}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackTitle}>Camera unavailable</Text>
              <Text style={styles.cameraFallbackText}>
                Grant camera permission or import an image from your gallery.
              </Text>
            </View>
          )}
          <View style={styles.scanGuide} pointerEvents="none" />
        </View>

        <View style={styles.controls}>
          <ScannerButton label="Capture" disabled={!canCapture} onPress={captureDocument} />
          <ScannerButton label="Import image" tone="secondary" disabled={isProcessing} onPress={pickDocument} />
        </View>

        <View style={styles.statusPanel}>
          {selectedModelId ? (
            <ModelPicker
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={isProcessing}
            />
          ) : null}
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color="#E7FF5F" />
              <Text style={styles.statusText}>{processingLabel}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>
              {selectedModelId
                ? `Using ${getDocScannerModelOption(selectedModelId).label}. Capture or import a document to compare models.`
                : 'Capture or import a document. Recent scans keep both original and rectified images.'}
            </Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {lastTimings.length > 0 ? (
            <Text style={styles.timingText}>
              Last run: {lastTimings.map((timing) => `${timing.label} ${timing.ms}ms`).join(' / ')}
            </Text>
          ) : null}
        </View>

        {lastScan ? (
          <View style={styles.latestPanel}>
            <View style={styles.latestHeader}>
              <View>
                <Text style={styles.latestTitle}>Latest scan saved</Text>
                <Text style={styles.latestSubtitle}>
                  {lastScan.status === 'fallback' ? 'Fallback image stored' : 'Rectified image stored'}
                </Text>
              </View>
              <ScannerButton label="Open" tone="secondary" onPress={() => router.push('/recents')} />
            </View>
            <ScanCard
              scan={lastScan}
              onPress={() =>
                router.push({ pathname: '/scan/[scanId]', params: { scanId: lastScan.id } })
              }
            />
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0B0F12',
    flex: 1,
  },
  safeArea: {
    flex: 1,
    gap: 18,
    paddingBottom: 92,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#A7B2BA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F5F7F2',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
  },
  cameraFrame: {
    backgroundColor: '#050708',
    borderColor: '#29323B',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 420,
    overflow: 'hidden',
  },
  cameraFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cameraFallbackTitle: {
    color: '#F4F7F4',
    fontSize: 20,
    fontWeight: '900',
  },
  cameraFallbackText: {
    color: '#9AA6AF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  scanGuide: {
    borderColor: 'rgba(231, 255, 95, 0.82)',
    borderRadius: 6,
    borderWidth: 2,
    bottom: '12%',
    left: '10%',
    position: 'absolute',
    right: '10%',
    top: '12%',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  statusPanel: {
    backgroundColor: '#151A1F',
    borderColor: '#27313A',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  processingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusText: {
    color: '#CED6DC',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#FFB267',
    fontSize: 12,
    lineHeight: 17,
  },
  timingText: {
    color: '#7F8B94',
    fontSize: 11,
    lineHeight: 16,
  },
  latestPanel: {
    gap: 10,
  },
  latestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  latestTitle: {
    color: '#F4F7F4',
    fontSize: 14,
    fontWeight: '900',
  },
  latestSubtitle: {
    color: '#9AA6AF',
    fontSize: 12,
    marginTop: 2,
  },
});
