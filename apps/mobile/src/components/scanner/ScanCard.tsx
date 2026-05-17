import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ScanRecord } from '@/lib/scanner/scan.types';

interface ScanCardProps {
  scan: ScanRecord;
  onPress: () => void;
}

export function ScanCard({ scan, onPress }: ScanCardProps) {
  const createdAt = new Date(scan.createdAt);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.previewRow}>
        <Image source={{ uri: scan.originalUri }} style={styles.preview} contentFit="cover" />
        <Image source={{ uri: scan.rectifiedUri }} style={styles.preview} contentFit="cover" />
      </View>
      <View style={styles.meta}>
        <View>
          <Text style={styles.title}>{createdAt.toLocaleDateString()}</Text>
          <Text style={styles.subtitle}>
            {scan.source} / {scan.processingMs} ms / {scan.modelVersion}
          </Text>
        </View>
        <Text style={[styles.status, scan.status === 'fallback' && styles.warning]}>
          {scan.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151A1F',
    borderColor: '#27313A',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.78,
  },
  previewRow: {
    aspectRatio: 2.2,
    flexDirection: 'row',
    gap: 1,
  },
  preview: {
    backgroundColor: '#0A0D10',
    flex: 1,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  title: {
    color: '#F4F7F4',
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9AA6AF',
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  status: {
    color: '#E7FF5F',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  warning: {
    color: '#FFB267',
  },
});
