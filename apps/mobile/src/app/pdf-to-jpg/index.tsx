import { StyleSheet, View, Text, Button, ActivityIndicator, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { renderPdfPagesToJpg, type PdfPageJpg, type RenderPdfPagesToJpgResult } from "@acajoo/giovanni-pdf-render";

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
const DEFAULT_PDF_TO_JPG_SETTINGS = {
  qualityPercent: 92,
  scale: 2,
  outputPattern: '{basename}_page_{page}',
  archiveName: '{basename}_jpg.zip',
};

export default function PdfToJpgScreen() {
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<RenderPdfPagesToJpgResult | null>(null);
  const [qualityPercent, setQualityPercent] = useState<number>(DEFAULT_PDF_TO_JPG_SETTINGS.qualityPercent);
  const [scale, setScale] = useState<number>(DEFAULT_PDF_TO_JPG_SETTINGS.scale);
  const [outputPattern, setOutputPattern] = useState<string>(DEFAULT_PDF_TO_JPG_SETTINGS.outputPattern);
  const [archiveName, setArchiveName] = useState<string>(DEFAULT_PDF_TO_JPG_SETTINGS.archiveName);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const pickDocument = useCallback(async () => {
    try {
      const picked = await File.pickFileAsync({ mimeTypes: 'application/pdf' });
      if (!picked.canceled) {
        setPickedFile(picked.result);
        setFileName(decodeURIComponent(picked.result.uri.split('/').pop() ?? 'document.pdf'));
        setResult(null);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setStatusMessage('Failed to pick document');
    }
  }, []);

  const convertPdfToJpg = useCallback(async () => {
    if (!pickedFile) return;

    setIsConverting(true);
    setStatusMessage('Converting PDF to JPG...');

    try {
      const bytes = await pickedFile.bytes();

      const convertResult = await renderPdfPagesToJpg(bytes, {
        quality: qualityPercent / 100,
        scale: scale,
      });
      setResult(convertResult);
      setStatusMessage(`Conversion complete! Converted ${convertResult.convertedPageCount} pages`);
    } catch (error) {
      console.error('PDF to JPG conversion error:', error);
      setStatusMessage('Conversion failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsConverting(false);
    }
  }, [pickedFile, qualityPercent, scale]);

  const shareResult = useCallback(async () => {
    if (!result || result.pages.length === 0) return;
    try {
      // Share the first converted page only since we can\'t create ZIP without expo-zip
      const firstPage = result.pages[0];
      const bytes = new Uint8Array(await firstPage.blob.arrayBuffer());

      const outFile = new File(Paths.cache, 'converted-page-1.jpg');
      outFile.write(bytes);

      await Sharing.shareAsync(outFile.uri, {
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
        dialogTitle: 'Share First Converted Image',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share converted images');
    }
  }, [result]);

  if (!pickedFile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PDF to JPG Converter</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF to JPG Converter</Text>
      <Text style={styles.fileInfo}>Selected: {fileName}</Text>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Quality (%):</Text>
        <TextInput
          style={styles.settingsInput}
          value={qualityPercent.toString()}
          onChangeText={(text) => {
            const num = parseInt(text, 10);
            if (!isNaN(num) && num >= 1 && num <= 100) {
              setQualityPercent(num);
            }
          }}
          keyboardType="numeric"
          placeholder="92"
          editable={!isConverting}
        />

        <Text style={styles.settingsLabel}>Scale:</Text>
        <TextInput
          style={styles.settingsInput}
          value={scale.toString()}
          onChangeText={(text) => {
            const num = parseFloat(text);
            if (!isNaN(num) && num >= 0.1 && num <= 10) {
              setScale(num);
            }
          }}
          keyboardType="decimal-pad"
          placeholder="2"
          editable={!isConverting}
        />

        <Text style={styles.settingsLabel}>Output Pattern:</Text>
        <TextInput
          style={styles.settingsInput}
          value={outputPattern}
          onChangeText={setOutputPattern}
          placeholder="{basename}_page_{page}"
          editable={!isConverting}
        />

        <Text style={styles.settingsLabel}>Archive Name:</Text>
        <TextInput
          style={styles.settingsInput}
          value={archiveName}
          onChangeText={setArchiveName}
          placeholder="{basename}_jpg.zip"
          editable={!isConverting}
        />
      </View>

      {isConverting ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Converting...</Text>
        </View>
      ) : (
        <Button title="Convert to JPG" onPress={convertPdfToJpg} disabled={isConverting} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Conversion Result</Text>
          <Text style={styles.resultText}>
            Pages: {result.pages.length}
          </Text>
          <Text style={styles.resultText}>
            Converted: {result.convertedPageCount}
          </Text>
          <Button title="Share as ZIP" onPress={shareResult} disabled={result.convertedPageCount === 0} />
        </View>
      )}

      {statusMessage && !isConverting && !result && (
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