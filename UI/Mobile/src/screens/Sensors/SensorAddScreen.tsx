import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createSensor, getSensors } from '../../api/sensors';
import { getApiMessage } from '../../api/client';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { TextField } from '../../components/ui/TextField';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SensorSummary } from '../../types/domain';

export function SensorAddScreen({ navigation }: MainScreenProps<'SensorAdd'>) {
  const [name, setName] = useState('');
  const [qr, setQr] = useState('');
  const [tankCapacity, setTankCapacity] = useState('35');
  const [sensors, setSensors] = useState<SensorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSensors = useCallback(async () => {
    setListLoading(true);

    try {
      const items = await getSensors();
      setSensors(items);
    } catch (sensorError) {
      setError(getApiMessage(sensorError));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  async function saveSensor() {
    if (!name.trim()) {
      setError('Sensor adi gerekli.');
      return;
    }

    if (!qr.trim()) {
      setError('Sensor QR gerekli.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const sensor = await createSensor({
        name: name.trim(),
        qr: qr.trim(),
        tankCapacity: Number(tankCapacity) || 0,
      });
      setSuccess(`${sensor.name || sensor.qr} kaydedildi.`);
      setName('');
      setQr('');
      setTankCapacity('35');
      await loadSensors();
    } catch (saveError) {
      setError(getApiMessage(saveError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <Header title="Sensor Ekle" eyebrow="Sagim makinesi" />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Sagim Sensoru</Text>
        <Text style={styles.heroText}>Bu form sagimMakine tablosuna sensor kaydi ekler. QR daha sonra sagim surecinde secilir.</Text>
      </PremiumCard>

      <PremiumCard>
        <TextField icon="hardware-chip-outline" value={name} onChangeText={setName} placeholder="Sensor adi" />
        <TextField icon="qr-code-outline" value={qr} onChangeText={setQr} placeholder="Sensor QR" autoCapitalize="none" />
        <TextField
          icon="beaker-outline"
          value={tankCapacity}
          onChangeText={setTankCapacity}
          placeholder="Hazne hacmi"
          keyboardType="numeric"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <AppButton label="Sensoru Kaydet" icon="save-outline" loading={loading} onPress={saveSensor} />
      </PremiumCard>

      <PremiumCard>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="radio-outline" size={22} color={colors.emerald} />
            <Text style={styles.sectionTitle}>Kayitli Sensorler</Text>
          </View>
          {listLoading ? <ActivityIndicator color={colors.emerald} /> : null}
        </View>

        {sensors.length ? (
          <View style={styles.sensorList}>
            {sensors.map((sensor) => (
              <View key={`${sensor.id}-${sensor.qr}`} style={styles.sensorRow}>
                <View style={styles.sensorIcon}>
                  <Ionicons name="hardware-chip-outline" size={20} color={colors.black} />
                </View>
                <View style={styles.sensorText}>
                  <Text style={styles.sensorName}>{sensor.name || `Sensor ${sensor.id}`}</Text>
                  <Text style={styles.sensorMeta}>{sensor.qr || '-'} | {sensor.tankCapacity ? `${sensor.tankCapacity} L` : 'Hazne yok'}</Text>
                </View>
                <AppButton
                  label="Kullan"
                  icon="play-outline"
                  variant="ghost"
                  onPress={() => navigation.navigate('MilkingProcess', { sensorQr: sensor.qr })}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.heroText}>Henuz sensor kaydi yok.</Text>
        )}
      </PremiumCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    ...typography.heading,
    color: colors.text,
  },
  heroText: {
    ...typography.body,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
  success: {
    color: colors.success,
    fontWeight: '800',
  },
  sectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  sensorList: {
    gap: spacing.md,
  },
  sensorRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.md,
  },
  sensorIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emerald,
  },
  sensorText: {
    flex: 1,
    minWidth: 0,
  },
  sensorName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  sensorMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
