import {
  Canvas,
  Circle,
  Fill,
  Group,
  Image,
  Rect,
  Text as SkiaText,
  matchFont,
  rect,
  useImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
  aspectRatio?: number;
}

const MIN_RATIO = 0.08;
const MAX_RATIO = 0.92;
const HANDLE_RADIUS = 16;
const DIVIDER_COLOR = '#E7FF5F';
const HANDLE_FONT = matchFont({ fontSize: 13, fontWeight: '900' });

/* eslint-disable react-hooks/immutability -- reanimated shared values update on the UI thread */

function clampDivider(x: number, width: number) {
  'worklet';
  if (width <= 0) {
    return 0;
  }

  return Math.min(width * MAX_RATIO, Math.max(width * MIN_RATIO, x));
}

export function BeforeAfterSlider({ beforeUri, afterUri, aspectRatio = 3 / 4 }: BeforeAfterSliderProps) {
  const beforeImage = useImage(beforeUri);
  const afterImage = useImage(afterUri);

  const canvasSize = useSharedValue({ width: 0, height: 0 });
  const dividerX = useSharedValue(0);

  const canvasWidth = useDerivedValue(() => canvasSize.value.width);
  const canvasHeight = useDerivedValue(() => canvasSize.value.height);
  const beforeClip = useDerivedValue(() => rect(0, 0, dividerX.value, canvasSize.value.height));
  const dividerLineX = useDerivedValue(() => dividerX.value - 1);
  const handleCenterY = useDerivedValue(() => canvasSize.value.height * 0.48);
  const handleLabelX = useDerivedValue(() => dividerX.value - 8);
  const handleLabelY = useDerivedValue(() => canvasSize.value.height * 0.48 + 5);

  useAnimatedReaction(
    () => canvasSize.value.width,
    (width) => {
      if (width > 0 && dividerX.value === 0) {
        dividerX.value = width * 0.5;
      }
    },
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .onBegin((event) => {
          dividerX.value = clampDivider(event.x, canvasSize.value.width);
        })
        .onUpdate((event) => {
          dividerX.value = clampDivider(event.x, canvasSize.value.width);
        }),
    [canvasSize, dividerX],
  );

  const imagesReady = beforeImage !== null && afterImage !== null;

  return (
    <View style={[styles.container, { aspectRatio }]}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.canvas} onSize={canvasSize}>
          <Fill color="#080B0E" />
          {imagesReady ? (
            <>
              <Image
                image={afterImage}
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fit="contain"
              />
              <Group clip={beforeClip}>
                <Image
                  image={beforeImage}
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fit="contain"
                />
              </Group>
              <Rect
                x={dividerLineX}
                y={0}
                width={2}
                height={canvasHeight}
                color={DIVIDER_COLOR}
              />
              <Circle cx={dividerX} cy={handleCenterY} r={HANDLE_RADIUS} color={DIVIDER_COLOR} />
              <SkiaText
                x={handleLabelX}
                y={handleLabelY}
                text="<>"
                font={HANDLE_FONT}
                color="#101214"
              />
            </>
          ) : null}
        </Canvas>
      </GestureDetector>
      <View pointerEvents="none" style={styles.badgeRow}>
        <Text style={styles.badge}>Before</Text>
        <Text style={styles.badge}>After</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080B0E',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  canvas: {
    flex: 1,
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
