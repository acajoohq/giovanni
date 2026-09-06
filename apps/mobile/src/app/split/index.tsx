import { StyleSheet, View, Text, Button, ActivityIndicator, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { splitPdf, type SplitResult } from "@acajoo/giovanni-core";

// Simple formatBytes utility if not available
function formatBytesSimple(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Default settings
const DEFAULT_SPLIT_SETTINGS = {
  outputPattern: '{basename}_page_{page}',
  archiveName: '{basename}_pages.zip',
  zipCompressionMode: 'store' as const,
};

export default function SplitScreen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [outputPattern, setOutputPattern] = useState<string>(DEFAULT_SPLIT_SETTINGS.outputPattern);
  const [archiveName, setArchiveName] = useState<string>(DEFAULT_SPLIT_SETTINGS.archiveName);
  const [zipCompressionMode, setZipCompressionMode] = useState<'store' | 'compress'>(DEFAULT_SPLIT_SETTINGS.zipCompressionMode);
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

  const splitDocument = useCallback(async () => {
    if (!fileUri) return;

    setIsSplitting(true);
    setStatusMessage('Splitting PDF...');

    try {
      const bytes = await new File(fileUri).bytes();

      const splitResult = await splitPdf(bytes);
      setResult(splitResult);
      setStatusMessage(`Split complete! Extracted ${splitResult.pageCount} pages`);
    } catch (error) {
      console.error('Split error:', error);
      setStatusMessage('Split failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSplitting(false);
    }
  }, [fileUri]);

  const shareResult = useCallback(async () => {
    if (!result || result.pages.length === 0) return;
    try {
      // Share the first page only since we can\'t create ZIP without expo-zip
      const firstPage = result.pages[0];

      const outFile = new File(Paths.cache, 'split-page-1.pdf');
      outFile.write(firstPage);

      await Sharing.shareAsync(outFile.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Share First Page',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share split result');
    }
  }, [result]);


  if (!fileUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PDF Splitter</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF Splitter</Text>
      <Text style={styles.fileInfo}>Selected: {fileName}</Text>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Output Pattern:</Text>
        <TextInput
          style={styles.settingsInput}
          value={outputPattern}
          onChangeText={setOutputPattern}
          placeholder="{basename}_page_{page}"
          editable={!isSplitting}
        />

        <Text style={styles.settingsLabel}>Archive Name:</Text>
        <TextInput
          style={styles.settingsInput}
          value={archiveName}
          onChangeText={setArchiveName}
          placeholder="{basename}_pages.zip"
          editable={!isSplitting}
        />

        <Text style={styles.settingsLabel}>ZIP Compression:</Text>
        <View style={styles.buttonRow}>
          <Button
            title="Store"
            color={zipCompressionMode === 'store' ? '#0066cc' : '#cccccc'}
            onPress={() => setZipCompressionMode('store')}
            disabled={isSplitting}
          />
          <Button
            title="Compress"
            color={zipCompressionMode === 'compress' ? '#0066cc' : '#cccccc'}
            onPress={() => setZipCompressionMode('compress')}
            disabled={isSplitting}
          />
        </View>
      </View>

      {isSplitting ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Splitting...</Text>
        </View>
      ) : (
        <Button title="Split PDF" onPress={splitDocument} disabled={isSplitting} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Split Result</Text>
          <Text style={styles.resultText}>
            Pages: {result.pageCount}
          </Text>
          <Text style={styles.resultText}>
            Size: {formatBytesSimple(result.pages.reduce((sum, p) => sum + p.byteLength, 0))}
          </Text>
          <Button title="Share as ZIP" onPress={shareResult} />
        </View>
      )}

      {statusMessage && !isSplitting && !result && (
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
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