import { Platform, StyleSheet, View, Text, Button, Switch, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { compressPdf, type CompressionEngine, type CompressResult } from "@acajoo/giovanni-core";
import { type QpdfOptimizePreset } from "@acajoo/giovanni-core/qpdf";
import { type GhostscriptPdfSettings } from "@acajoo/giovanni-core/ghostscript";
// import { formatBytes } from '@/utils/pdfTool.utils'; // Assuming we have this utility in mobile app; if not, we'll create a simple version
// import { Entypo } from '@expo/vector-icons';
// import { useTheme } from '@expo/ui'; // Example of using expo/ui, adjust as needed

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
const DEFAULT_QPDF_SETTINGS = {
  compressionLevel: 6,
  decodeLevel: 'generalized' as const,
  objectStreams: 'generate' as const,
  linearize: false,
  recompressFlate: false,
  compressPages: false,
  removeUnreferencedResources: false,
  preset: 'web' as const,
};

const DEFAULT_GHOSTSCRIPT_SETTINGS = {
  preset: 'screen' as const,
  downsampleColorImages: true,
  colorImageResolution: 150,
  downsampleGrayImages: true,
  grayImageResolution: 150,
  compatibilityLevel: '1.4',
  colorConversionStrategy: 'RGB',
};

export default function CompressScreen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [engine, setEngine] = useState<CompressionEngine>('qpdf');
  const [qpdfPreset, setQpdfPreset] = useState<QpdfOptimizePreset>('web');
  const [ghostscriptPreset, setGhostscriptPreset] = useState<GhostscriptPdfSettings>('screen');
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

  const compressDocument = useCallback(async () => {
    if (!fileUri) return;

    setIsCompressing(true);
    setStatusMessage('Compressing...');

    try {
      const bytes = await new File(fileUri).bytes();

      // Build compression options based on engine and preset
      let compressOptions: any = {};
      if (engine === 'qpdf') {
        compressOptions = {
          engine: 'qpdf',
          qpdf: {
            ...DEFAULT_QPDF_SETTINGS,
            preset: qpdfPreset,
          },
        };
      } else if (engine === 'ghostscript') {
        compressOptions = {
          engine: 'ghostscript',
          ghostscript: {
            ...DEFAULT_GHOSTSCRIPT_SETTINGS,
            preset: ghostscriptPreset,
          },
        };
      } else if (engine === 'combined') {
        compressOptions = {
          engine: 'combined',
          qpdf: {
            ...DEFAULT_QPDF_SETTINGS,
            preset: qpdfPreset,
          },
          ghostscript: {
            ...DEFAULT_GHOSTSCRIPT_SETTINGS,
            preset: ghostscriptPreset,
          },
        };
      }

      const compressResult = await compressPdf(bytes, compressOptions);
      setResult(compressResult);
      setStatusMessage(`Compression complete! Saved ${formatBytesSimple(compressResult.savedBytes)} (${compressResult.percentageSaved.toFixed(1)}%)`);
    } catch (error) {
      console.error('Compression error:', error);
      setStatusMessage('Compression failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCompressing(false);
    }
  }, [fileUri, engine, qpdfPreset, ghostscriptPreset]);

  const shareDocument = useCallback(async () => {
    if (!result) return;
    try {
      const outFile = new File(Paths.cache, "compressed.pdf");
      outFile.write(result.data);

      await Sharing.shareAsync(outFile.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Share PDF',
      });
    } catch (error) {
      console.error('Share error:', error);
      setStatusMessage('Failed to share document');
    }
  }, [result]);

  if (!fileUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PDF Compressor</Text>
        <Button title="Select PDF File" onPress={pickDocument} />
        {statusMessage && <Text style={styles.status}>{statusMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PDF Compressor</Text>
      <Text style={styles.fileInfo}>Selected: {fileName}</Text>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Engine:</Text>
        {/* In a real app, use a Picker or SegmentedControl; using buttons for simplicity */}
        <View style={styles.buttonRow}>
          <Button
            title="QPDF"
            color={engine === 'qpdf' ? '#0066cc' : '#cccccc'}
            onPress={() => setEngine('qpdf')}
            disabled={isCompressing}
          />
          <Button
            title="Ghostscript"
            color={engine === 'ghostscript' ? '#0066cc' : '#cccccc'}
            onPress={() => setEngine('ghostscript')}
            disabled={isCompressing}
          />
          <Button
            title="Combined"
            color={engine === 'combined' ? '#0066cc' : '#cccccc'}
            onPress={() => setEngine('combined')}
            disabled={isCompressing}
          />
        </View>

        {engine === 'qpdf' && (
          <>
            <Text style={styles.settingsLabel}>QPDF Preset:</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Web"
                color={qpdfPreset === 'web' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('web')}
                disabled={isCompressing}
              />
              <Button
                title="Default"
                color={qpdfPreset === 'default' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('default')}
                disabled={isCompressing}
              />
              <Button
                title="Archive"
                color={qpdfPreset === 'archive' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('archive')}
                disabled={isCompressing}
              />
            </View>
          </>
        )}

        {engine === 'ghostscript' && (
          <>
            <Text style={styles.settingsLabel}>Ghostscript Preset:</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Screen"
                color={ghostscriptPreset === 'screen' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('screen')}
                disabled={isCompressing}
              />
              <Button
                title="Ebook"
                color={ghostscriptPreset === 'ebook' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('ebook')}
                disabled={isCompressing}
              />
              <Button
                title="Printer"
                color={ghostscriptPreset === 'printer' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('printer')}
                disabled={isCompressing}
              />
              <Button
                title="Prepress"
                color={ghostscriptPreset === 'prepress' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('prepress')}
                disabled={isCompressing}
              />
            </View>
          </>
        )}

        {engine === 'combined' && (
          <>
            <Text style={styles.settingsLabel}>QPDF Preset:</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Web"
                color={qpdfPreset === 'web' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('web')}
                disabled={isCompressing}
              />
              <Button
                title="Default"
                color={qpdfPreset === 'default' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('default')}
                disabled={isCompressing}
              />
              <Button
                title="Archive"
                color={qpdfPreset === 'archive' ? '#0066cc' : '#cccccc'}
                onPress={() => setQpdfPreset('archive')}
                disabled={isCompressing}
              />
            </View>
            <Text style={styles.settingsLabel}>Ghostscript Preset:</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Screen"
                color={ghostscriptPreset === 'screen' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('screen')}
                disabled={isCompressing}
              />
              <Button
                title="Ebook"
                color={ghostscriptPreset === 'ebook' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('ebook')}
                disabled={isCompressing}
              />
              <Button
                title="Printer"
                color={ghostscriptPreset === 'printer' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('printer')}
                disabled={isCompressing}
              />
              <Button
                title="Prepress"
                color={ghostscriptPreset === 'prepress' ? '#0066cc' : '#cccccc'}
                onPress={() => setGhostscriptPreset('prepress')}
                disabled={isCompressing}
              />
            </View>
          </>
        )}
      </View>

      {isCompressing ? (
        <View style={styles.compressing}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.status}>Compressing...</Text>
        </View>
      ) : (
        <Button title="Compress PDF" onPress={compressDocument} disabled={isCompressing} />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Compression Result</Text>
          <Text style={styles.resultText}>
            Original: {formatBytesSimple(result.originalSize)} → Compressed: {formatBytesSimple(result.compressedSize)}
          </Text>
          <Text style={styles.resultText}>
            Saved: {formatBytesSimple(result.savedBytes)} ({result.percentageSaved.toFixed(1)}%)
          </Text>
          <Text style={styles.resultText}>Engine: {result.engine}</Text>
          <Button title="Share Compressed PDF" onPress={shareDocument} />
        </View>
      )}

      {statusMessage && !isCompressing && !result && (
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
