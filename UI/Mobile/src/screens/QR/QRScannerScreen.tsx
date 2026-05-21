import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { scanQr } from '../../api/qr';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { QrScanResult } from '../../types/domain';

export function QRScannerScreen({ navigation }: MainScreenProps<'QRScanner'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QrScanResult | undefined>();
  const [error, setError] = useState('');

  async function handleCode(code: string) {
    setScanned(true);
    setLoading(true);
    setError('');

    try {
      const qrResult = await scanQr(code);
      setResult(qrResult);
    } catch (scanError) {
      setResult(undefined);
      setError(getApiMessage(scanError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen scroll={false}>
      <Header title="QR Tarama" eyebrow="Esleme" />

      {!permission ? (
        <PremiumCard style={styles.centerCard}>
          <ActivityIndicator color={colors.emerald} />
        </PremiumCard>
      ) : !permission.granted ? (
        <PremiumCard>
          <Text style={styles.title}>Kamera izni gerekli</Text>
          <Text style={styles.text}>QR kodunu okumak icin kamera erisimi acilmali.</Text>
          <AppButton label="Izin Ver" icon="camera-outline" onPress={requestPermission} />
        </PremiumCard>
      ) : (
        <View style={styles.cameraShell}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned || loading ? undefined : ({ data }) => handleCode(data)}
          />
          <View style={styles.frame} pointerEvents="none" />
        </View>
      )}

      <PremiumCard>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.emerald} />
            <Text style={styles.text}>QR kontrol ediliyor...</Text>
          </View>
        ) : error ? (
          <>
            <Text style={styles.title}>Kayit bulunamadi</Text>
            <Text style={styles.error}>{error}</Text>
          </>
        ) : result ? (
          <>
            <Text style={styles.title}>{result.message}</Text>
            <Text style={styles.text}>{result.info}</Text>
            <Text style={styles.code}>{result.targetId}</Text>
            {result.cowId ? (
              <View style={styles.resultActions}>
                <AppButton label="Sut Sonucu" icon="water-outline" onPress={() => navigation.navigate('MilkResult', { cowId: result.cowId })} />
                <AppButton
                  label="AI Onerileri"
                  icon="sparkles-outline"
                  variant="secondary"
                  onPress={() => navigation.navigate('AISuggestions', { cowId: result.cowId })}
                />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.title}>Hazir</Text>
            <Text style={styles.text}>Kodu kadraja alinca sonuc burada gorunur.</Text>
          </>
        )}

        <View style={styles.resultActions}>
          <AppButton
            label="Tekrar Tara"
            icon="refresh-outline"
            variant="ghost"
            onPress={() => {
              setScanned(false);
              setResult(undefined);
              setError('');
            }}
          />
        </View>
      </PremiumCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraShell: {
    flex: 1,
    minHeight: 280,
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.black,
    shadowColor: colors.black,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  camera: {
    flex: 1,
  },
  frame: {
    position: 'absolute',
    top: '18%',
    left: '14%',
    right: '14%',
    bottom: '18%',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 241, 234, 0.64)',
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  text: {
    ...typography.body,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  code: {
    color: colors.cream,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultActions: {
    gap: spacing.sm,
  },
});
