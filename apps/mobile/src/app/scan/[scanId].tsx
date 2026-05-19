import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BeforeAfterSlider } from '@/components/scanner/BeforeAfterSlider';
import { ScannerButton } from '@/components/scanner/ScannerButton';
import { StatusPill } from '@/components/scanner/StatusPill';
import { getDocScannerModelOption } from '@/lib/model/docscannerModel.constants';
import { isDocScannerModelId } from '@/lib/model/docscannerModel.types';
import { resolveImageAspectRatio } from '@/lib/scanner/imageAspect.utils';
import type { ScanRecord } from '@/lib/scanner/scan.types';
import { getScanById, initializeScansRepository } from '@/lib/storage/scans.repository';

export default function ScanDetailScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadScan() {
      if (!scanId) {
        return;
      }

      await initializeScansRepository();
      const foundScan = await getScanById(scanId);
      if (isMounted) {
        setScan(foundScan);
        setIsLoading(false);
      }
    }

    loadScan().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [scanId]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color="#E7FF5F" />
        </SafeAreaView>
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.emptyTitle}>Scan not found</Text>
          <ScannerButton label="Back to recents" tone="secondary" onPress={() => router.push('/recents')} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Before / after</Text>
              <Text style={styles.title}>Scan result</Text>
            </View>
            <StatusPill
              label={scan.status}
              tone={scan.status === 'fallback' ? 'warning' : 'ready'}
            />
          </View>

          <BeforeAfterSlider
            beforeUri={scan.originalUri}
            afterUri={scan.rectifiedUri}
            aspectRatio={resolveImageAspectRatio(scan.width, scan.height)}
          />

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Run details</Text>
            <Text style={styles.detail}>Source: {scan.source}</Text>
            <Text style={styles.detail}>Processing: {scan.processingMs} ms</Text>
            <Text style={styles.detail}>
              Model:{' '}
              {isDocScannerModelId(scan.modelVersion)
                ? getDocScannerModelOption(scan.modelVersion).label
                : scan.modelVersion}
            </Text>
            {scan.width && scan.height ? (
              <Text style={styles.detail}>Image: {scan.width} x {scan.height}</Text>
            ) : null}
            {scan.warning ? <Text style={styles.warning}>{scan.warning}</Text> : null}
          </View>
        </ScrollView>
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
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 18,
  },
  content: {
    gap: 18,
    paddingBottom: 108,
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
  emptyTitle: {
    color: '#F4F7F4',
    fontSize: 20,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#151A1F',
    borderColor: '#27313A',
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 14,
  },
  panelTitle: {
    color: '#F4F7F4',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  detail: {
    color: '#CED6DC',
    fontSize: 13,
  },
  warning: {
    color: '#FFB267',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
