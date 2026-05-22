import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getApiMessage } from '../../api/client';
import { getAISuggestions } from '../../api/suggestions';
import { AppButton } from '../../components/ui/AppButton';
import { AppScreen } from '../../components/ui/AppScreen';
import { Header } from '../../components/ui/Header';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { MainScreenProps } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Severity, Suggestion } from '../../types/domain';

const severityColors: Record<Severity, string> = {
  low: colors.cream,
  medium: colors.emerald,
  high: colors.warning,
  critical: colors.danger,
};

export function AISuggestionsScreen({ navigation, route }: MainScreenProps<'AISuggestions'>) {
  const cowId = route.params?.cowId;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSuggestions = useCallback(async () => {
    if (!cowId) {
      setError('Oneri uretmek icin once QR veya dashboard hedefi secilmeli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getAISuggestions(cowId);
      setSuggestions(data);
    } catch (suggestionsError) {
      setSuggestions([]);
      setError(getApiMessage(suggestionsError));
    } finally {
      setLoading(false);
    }
  }, [cowId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return (
    <AppScreen>
      <Header title="AI Onerileri" eyebrow={cowId} />

      <PremiumCard accent>
        <Text style={styles.heroTitle}>Karar kartlari</Text>
        <Text style={styles.heroText}>Backend kayitlarindan uretilen operasyon oncelikleri.</Text>
      </PremiumCard>

      {error ? (
        <PremiumCard>
          <Text style={styles.cardTitle}>Oneriler alinamadi</Text>
          <Text style={styles.error}>{error}</Text>
        </PremiumCard>
      ) : loading && suggestions.length === 0 ? (
        <PremiumCard style={styles.loadingCard}>
          <ActivityIndicator color={colors.emerald} />
        </PremiumCard>
      ) : (
        suggestions.map((item) => <SuggestionCard key={item.id} suggestion={item} />)
      )}

      <View style={styles.actions}>
        <AppButton label="Yenile" icon="refresh-outline" loading={loading} disabled={!cowId} onPress={loadSuggestions} />
        <AppButton
          label="Sut Sonucu"
          icon="water-outline"
          variant="secondary"
          disabled={!cowId || cowId.toUpperCase().startsWith('SHIP') || cowId.toUpperCase() === 'ADMIN'}
          onPress={() => navigation.navigate('MilkResult', { cowId })}
        />
        <AppButton label="Dashboard" icon="home-outline" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
      </View>
    </AppScreen>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const color = severityColors[suggestion.severity];

  return (
    <PremiumCard>
      <View style={styles.cardHeader}>
        <View style={[styles.severityDot, { backgroundColor: color }]} />
        <Text style={[styles.severity, { color }]}>{suggestion.severity.toUpperCase()}</Text>
      </View>
      <View style={styles.titleRow}>
        <Ionicons name="sparkles-outline" size={22} color={colors.emerald} />
        <Text style={styles.cardTitle}>{suggestion.title}</Text>
      </View>
      <Text style={styles.cardText}>{suggestion.description}</Text>
    </PremiumCard>
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
  loadingCard: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: radii.sm,
  },
  severity: {
    ...typography.caption,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  cardText: {
    ...typography.body,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
