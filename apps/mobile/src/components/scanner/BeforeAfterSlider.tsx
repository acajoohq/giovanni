import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
}

const MIN_POSITION = 0.08;
const MAX_POSITION = 0.92;
const HANDLE_HALF_WIDTH = 16;

function clampPosition(x: number, width: number) {
  if (width <= 0) {
    return 0.5;
  }

  return Math.min(MAX_POSITION, Math.max(MIN_POSITION, x / width));
}

export function BeforeAfterSlider({ beforeUri, afterUri }: BeforeAfterSliderProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const containerWidth = useSharedValue(0);
  const position = useSharedValue(0.5);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          position.value = clampPosition(event.nativeEvent.locationX, containerWidth.value);
        },
        onPanResponderMove: (event) => {
          position.value = clampPosition(event.nativeEvent.locationX, containerWidth.value);
        },
      }),
    [containerWidth, position],
  );

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: containerWidth.value * position.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: containerWidth.value * position.value - HANDLE_HALF_WIDTH }],
  }));

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.container}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        setLayoutWidth(width);
        containerWidth.value = width;
      }}>
      <Image source={{ uri: afterUri }} style={styles.image} contentFit="cover" />
      <Animated.View collapsable={false} style={[styles.beforeClip, beforeClipStyle]}>
        {layoutWidth > 0 ? (
          <Image
            source={{ uri: beforeUri }}
            style={[styles.image, styles.beforeImage, { width: layoutWidth }]}
            contentFit="cover"
          />
        ) : null}
      </Animated.View>
      <Animated.View style={[styles.handle, handleStyle]}>
        <View style={styles.handleLine} />
        <View style={styles.handleKnob}>
          <Text style={styles.handleText}>{'<>'}</Text>
        </View>
      </Animated.View>
      <View style={styles.badgeRow} pointerEvents="none">
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
  beforeImage: {
    left: 0,
    position: 'absolute',
    top: 0,
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
    left: 0,
    position: 'absolute',
    top: 0,
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
