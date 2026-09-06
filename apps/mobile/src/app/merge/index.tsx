import { StyleSheet, View, Text, Button, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
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
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [outputName, setOutputName] = useState<string>(DEFAULT_MERGE_SETTINGS.outputName);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const pickDocument = useCallback(async () => {
    try {
      const picked = await File.pickFileAsync({ mimeTypes: 'application/pdf' });
      if (!picked.canceled) {
        setPickedFiles(prev => [...prev, picked.result]);
        setFileNames(prev => [...prev, decodeURIComponent(picked.result.uri.split('/').pop() ?? 'document.pdf')]);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setStatusMessage('Failed to pick document');
    }
  }, []);

  const mergeDocuments = useCallback(async () => {
    if (pickedFiles.length < 2) {
      setStatusMessage('Please select at least 2 PDF files to merge');
      return;
    }

    setIsMerging(true);
    setStatusMessage('Merging PDFs...');

    try {
      const arrayBuffersPromise = pickedFiles.map(async (f) => (await f.bytes()).buffer);

      const arrayBuffers = await Promise.all(arrayBuffersPromise);
      const mergeResult = await mergePdfs(arrayBuffers);
      setResult(mergeResult);
      setStatusMessage(`Merge complete! Merged ${pickedFiles.length} files`);
    } catch (error) {
      console.error('Merge error:', error);
      setStatusMessage('Merge failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsMerging(false);
    }
  }, [pickedFiles]);

  const shareResult = useCallback(async () => {
    if (!result) return;
    try {
      const outFile = new File(Paths.document, outputName);
      outFile.write(result.data);

      await Sharing.shareAsync(outFile.uri, {
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
    setPickedFiles(prev => prev.filter((_, i) => i !== index));
    setFileNames(prev => prev.filter((_, i) => i !== index));
  };

  if (pickedFiles.length === 0) {
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
        {pickedFiles.length > 0 && (
          <FlatList
            data={pickedFiles}
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
        <Button title="Merge PDFs" onPress={mergeDocuments} disabled={isMerging || pickedFiles.length < 2} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Merge Result</Text>
          <Text style={styles.resultText}>
            Files Merged: {pickedFiles.length}
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