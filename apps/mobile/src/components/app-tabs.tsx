import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="compress">
        <NativeTabs.Trigger.Label>Compress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="arrow.down.to.line.alt"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="split">
        <NativeTabs.Trigger.Label>Split</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="scissors"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="merge">
        <NativeTabs.Trigger.Label>Merge</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="arrow.merge"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="extract-images">
        <NativeTabs.Trigger.Label>Extract</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="photo.on.rectangle"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pdf-to-jpg">
        <NativeTabs.Trigger.Label>To JPG</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="doc.richtext"
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
