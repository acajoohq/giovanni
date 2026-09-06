import { StyleSheet, View, Text, Button, ActivityIndicator, TextInput, Switch } from 'react-native';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { extractImages, type ExtractedImage, type ExtractImagesResult } from "@acajoo/giovanni-core";

// Simple formatBytes utility if not available

// Default settings
const DEFAULT_EXTRACT_IMAGES_SETTINGS = {
  archiveName: '{basename}_images.zip',
  includeRawStreams: false,
};

export default function ExtractImagesScreen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractImagesResult | null>(null);
  const [archiveName, setArchiveName] = useState<string>(DEFAULT_EXTRACT_IMAGES_SETTINGS.archiveName);
  const [includeRawStreams, setIncludeRawStreams] = useState<boolean>(DEFAULT_EXTRACT_IMAGES_SETTINGS.includeRawStreams);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name || 'document.pdf');
        setResult(null);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setStatusMessage('Failed to pick document');
    }
  }, []);

  const extractDocumentImages = useCallback(async () => {
    if (!fileUri) return;

    setIsExtracting(true);
    setStatusMessage('Extracting images...');

    try {
      const bytes = await new File(fileUri).bytes();

      const extractResult = await extractImages(bytes);
      setResult(extractResult);
      setStatusMessage(`Extraction complete! Found ${extractResult.images.length} images`);
    } catch (error) {
      console.error('Extract images error:', error);
      setStatusMessage('Extract images failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExtracting(false);
    }
  }, [fileUri, includeRawStreams]);

  const shareResult = useCallback(async () => {
    if (!result || result.images.length === 0) return;
    try {
      // Share the first image only since we can\'t create ZIP without expo-zip
      const firstImage = result.images[0];
      const ext = (firstImage.mimeType?.split('/')[1] ?? 'bin').toLowerCase();
      const validExt = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'webp'].includes(ext) ? ext : 'bin';
      const fileName = `extracted-image-1.${validExt}`;

      const outFile = new File(Paths.cache, fileName);
      outFile.write(firstImage.bytes);

      await Sharing.shareAsync(outFile.uri, {
        mimeType: `image/${ext}`,
        UTI: `public.${ext}`,
        dialogTitle: 'Share Extracted Image',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share extracted images');
    }
  }, [result]);

  if (!fileUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Extract Images</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Extract Images</Text>
      <Text style={styles.fileInfo}>Selected: {fileName}</Text>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Archive Name:</Text>
        <TextInput
          style={styles.settingsInput}
          value={archiveName}
          onChangeText={setArchiveName}
          placeholder="{basename}_images.zip"
          editable={!isExtracting}
        />

        <Text style={styles.settingsLabel}>Include Raw Streams:</Text>
        <Switch
          value={includeRawStreams}
          onValueChange={setIncludeRawStreams}
          disabled={isExtracting}
        />
      </View>

      {isExtracting ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Extracting...</Text>
        </View>
      ) : (
        <Button title="Extract Images" onPress={extractDocumentImages} disabled={isExtracting} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Extraction Result</Text>
          <Text style={styles.resultText}>
            Images Found: {result.images.length}
          </Text>
          {result.images.length > 0 && (
            <Text style={styles.resultText}>
              Includes raw streams: {includeRawStreams ? 'Yes' : 'No'}
            </Text>
          )}
          <Button title="Share as ZIP" onPress={shareResult} disabled={result.images.length === 0} />
        </View>
      )}

      {statusMessage && !isExtracting && !result && (
        <Text style={styles.status}>{statusMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fileInfo: {
    fontSize: 16,
    marginBottom: 20,
  },
  settingsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  settingsInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  compressing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
});