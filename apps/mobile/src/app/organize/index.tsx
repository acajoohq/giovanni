import { StyleSheet, View, Text, Button, ActivityIndicator, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { organizePdf, splitPdf, type OrganizeResult } from "@acajoo/giovanni-core";

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
const DEFAULT_ORGANIZE_SETTINGS = {
  outputName: 'organized.pdf',
};

export default function OrganizeScreen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [pages, setPages] = useState<number[]>([]); // page indices
  const [outputName, setOutputName] = useState<string>(DEFAULT_ORGANIZE_SETTINGS.outputName);
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
        setPages([]); // Reset pages
        setStatusMessage('Loading PDF...');

        // Split PDF to get pages
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const splitResult = await splitPdf(bytes);
        setPages(Array.from({ length: splitResult.pageCount }, (_, i) => i));
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setStatusMessage('Failed to pick document');
    }
  }, []);

  const organizeDocument = useCallback(async () => {
    if (!fileUri || pages.length === 0) {
      setStatusMessage('Please select a PDF file first');
      return;
    }

    setIsOrganizing(true);
    setStatusMessage('Organizing PDF...');

    try {
      // Read the file as base64, then convert to Uint8Array
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Convert base64 string to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const organizeResult = await organizePdf(bytes, { pages });
      setResult(organizeResult);
      setStatusMessage(`Organization complete! Reordered ${pages.length} pages`);
    } catch (error) {
      console.error('Organize error:', error);
      setStatusMessage('Organize failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsOrganizing(false);
    }
  }, [fileUri, pages]);

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
      const fileUri = `${FileSystem.cacheDirectory}${outputName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Share Organized PDF',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share organized document');
    }
  }, [result, outputName]);

  const movePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex > pages.length) return;

    const newPages = [...pages];
    const [movedItem] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedItem);
    setPages(newPages);
  };

  const removePage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
  };

  if (!fileUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PDF Organizer</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF Organizer</Text>
      <Text style={styles.fileInfo}>Selected: {fileName}</Text>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Output Filename:</Text>
        <TextInput
          style={styles.settingsInput}
          value={outputName}
          onChangeText={setOutputName}
          placeholder="organized.pdf"
          editable={!isOrganizing}
        />
      </View>

      <View style={styles.pageListContainer}>
        {pages.length > 0 && (
          <FlatList
            data={pages}
            keyExtractor={(item, index) => `page-${index}`}
            renderItem={({ item, index }) => (
              <View style={styles.pageItem}>
                <Text style={styles.pageNumber}>Page {item + 1}</Text>
                <View style={styles.pageControls}>
                  <TouchableOpacity
                    onPress={() => {
                      if (index > 0) movePage(index, index - 1);
                    }}
                    style={styles.controlButton}
                    disabled={isOrganizing || index === 0}
                  >
                    <Text style={styles.controlText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (index < pages.length - 1) movePage(index, index + 1);
                    }}
                    style={styles.controlButton}
                    disabled={isOrganizing || index === pages.length - 1}
                  >
                    <Text style={styles.controlText}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removePage(index)}
                    style={styles.controlButton}
                    disabled={isOrganizing}
                  >
                    <Text style={styles.controlText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {isOrganizing ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Organizing...</Text>
        </View>
      ) : (
        <Button title="Organize PDF" onPress={organizeDocument} disabled={isOrganizing || pages.length === 0} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Organization Result</Text>
          <Text style={styles.resultText}>
            Pages: {pages.length}
          </Text>
          <Text style={styles.resultText}>
            Size: {formatBytesSimple(result.data.byteLength)}
          </Text>
          <Button title="Share Organized PDF" onPress={shareResult} />
        </View>
      )}

      {statusMessage && !isOrganizing && !result && (
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
  pageListContainer: {
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  pageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  'pageItem:last-child': {
    borderBottomWidth: 0,
  },
  pageNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  pageControls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  'controlButton:disabled': {
    opacity: 0.5,
  },
  controlText: {
    fontSize: 16,
    fontWeight: 'bold',
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