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
        <Text style={styles.title}>Recents</Text>

        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#E7FF5F" />
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>Scanned documents appear here.</Text>
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
    gap: 16,
    paddingBottom: 92,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    color: '#F5F7F2',
    fontSize: 28,
    fontWeight: '700',
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
