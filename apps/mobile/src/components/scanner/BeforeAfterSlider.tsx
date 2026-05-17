import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
}

export function BeforeAfterSlider({ beforeUri, afterUri }: BeforeAfterSliderProps) {
  const [containerWidth, setContainerWidth] = useState(1);
  const [position, setPosition] = useState(0.5);

  const setPositionFromX = useCallback(
    (x: number) => {
      setPosition(Math.min(0.92, Math.max(0.08, x / containerWidth)));
    },
    [containerWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setPositionFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          setPositionFromX(event.nativeEvent.locationX);
        },
      }),
    [setPositionFromX],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.container}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <Image source={{ uri: afterUri }} style={styles.image} contentFit="cover" />
      <View style={[styles.beforeClip, { width: containerWidth * position }]}>
        <Image
          source={{ uri: beforeUri }}
          style={[styles.image, { width: containerWidth }]}
          contentFit="cover"
        />
      </View>
      <View style={[styles.handle, { left: `${position * 100}%` }]}>
        <View style={styles.handleLine} />
        <View style={styles.handleKnob}>
          <Text style={styles.handleText}>{'<>'}</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>Before</Text>
        <Text style={styles.badge}>After</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 3 / 4,
    backgroundColor: '#080B0E',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  beforeClip: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  handle: {
    alignItems: 'center',
    bottom: 0,
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -16 }],
    width: 32,
  },
  handleLine: {
    backgroundColor: '#E7FF5F',
    flex: 1,
    width: 2,
  },
  handleKnob: {
    alignItems: 'center',
    backgroundColor: '#E7FF5F',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    top: '48%',
    width: 32,
  },
  handleText: {
    color: '#101214',
    fontSize: 13,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  badge: {
    backgroundColor: 'rgba(7, 10, 12, 0.7)',
    borderRadius: 999,
    color: '#F6F8F3',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
});
