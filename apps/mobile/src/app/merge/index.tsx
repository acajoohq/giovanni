import { StyleSheet, View, Text, Button, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { mergePdfs, type MergeResult } from "@acajoo/giovanni-core";

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
const DEFAULT_MERGE_SETTINGS = {
  outputName: 'merged.pdf',
};

export default function MergeScreen() {
  const [fileUris, setFileUris] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [outputName, setOutputName] = useState<string>(DEFAULT_MERGE_SETTINGS.outputName);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUris(prev => [...prev, asset.uri]);
        setFileNames(prev => [...prev, asset.name || 'document.pdf']);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setStatusMessage('Failed to pick document');
    }
  }, []);

  const mergeDocuments = useCallback(async () => {
    if (fileUris.length < 2) {
      setStatusMessage('Please select at least 2 PDF files to merge');
      return;
    }

    setIsMerging(true);
    setStatusMessage('Merging PDFs...');

    try {
      // Read all files as base64, then convert to Uint8Array and then to ArrayBuffer
      const arrayBuffersPromise = fileUris.map(async (fileUri) => {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Convert base64 string to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        // Return ArrayBuffer (copy to avoid issues with views)
        return bytes.slice(0).buffer;
      });

      const arrayBuffers = await Promise.all(arrayBuffersPromise);
      const mergeResult = await mergePdfs(arrayBuffers);
      setResult(mergeResult);
      setStatusMessage(`Merge complete! Merged ${fileUris.length} files`);
    } catch (error) {
      console.error('Merge error:', error);
      setStatusMessage('Merge failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsMerging(false);
    }
  }, [fileUris]);

  const shareResult = useCallback(async () => {
    if (!result) return;
    try {
      // Convert Uint8Array to base64 string
      let binary = '';
      const bytes = result.data;
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Write to a temporary file
      const fileUri = `${FileSystem.documentDirectory}${outputName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Share Merged PDF',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share merged document');
    }
  }, [result, outputName]);

  const removeFile = (index: number) => {
    setFileUris(prev => prev.filter((_, i) => i !== index));
    setFileNames(prev => prev.filter((_, i) => i !== index));
  };

  if (fileUris.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PDF Merger</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF Merger</Text>

      <View style={styles.fileListContainer}>
        {fileUris.length > 0 && (
          <FlatList
            data={fileUris}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.fileItem}>
                <Text style={styles.fileName}>{fileNames[index]}</Text>
                <Button title="Remove" onPress={() => removeFile(index)} />
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Output Filename:</Text>
        <TextInput
          style={styles.settingsInput}
          value={outputName}
          onChangeText={setOutputName}
          placeholder="merged.pdf"
          editable={!isMerging}
        />
      </View>

      {isMerging ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Merging...</Text>
        </View>
      ) : (
        <Button title="Merge PDFs" onPress={mergeDocuments} disabled={isMerging || fileUris.length < 2} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Merge Result</Text>
          <Text style={styles.resultText}>
            Files Merged: {fileUris.length}
          </Text>
          <Text style={styles.resultText}>
            Size: {formatBytesSimple(result.data.byteLength)}
          </Text>
          <Button title="Share Merged PDF" onPress={shareResult} />
        </View>
      )}

      {statusMessage && !isMerging && !result && (
        <Text style={styles.status}>{statusMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fileListContainer: {
    width: '100%',
    marginBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5,
  },
  fileName: {
    fontSize: 16,
    flexShrink: 1,
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