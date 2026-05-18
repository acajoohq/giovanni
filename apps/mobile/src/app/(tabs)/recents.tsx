import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanCard } from '@/components/scanner/ScanCard';
import type { ScanRecord } from '@/lib/scanner/scan.types';
import { initializeScansRepository, listRecentScans } from '@/lib/storage/scans.repository';

export default function RecentsScreen() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadScans() {
        setIsLoading(true);
        await initializeScansRepository();
        const recentScans = await listRecentScans();
        if (isMounted) {
          setScans(recentScans);
          setIsLoading(false);
        }
      }

      loadScans().catch(() => {
        if (isMounted) {
          setScans([]);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }, []),
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Local history</Text>
          <Text style={styles.title}>Recent scans</Text>
        </View>

        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#E7FF5F" />
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>Capture or import a document to build a local before/after history.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {scans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                onPress={() =>
                  router.push({ pathname: '/scan/[scanId]', params: { scanId: scan.id } })
                }
              />
            ))}
          </ScrollView>
        )}
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
    gap: 4,
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
  },
  list: {
    gap: 14,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#151A1F',
    borderColor: '#27313A',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#F4F7F4',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: '#9AA6AF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
});
