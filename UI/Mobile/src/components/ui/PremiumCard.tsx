import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

interface PremiumCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}

export function PremiumCard({ children, style, accent }: PremiumCardProps) {
  return <View style={[styles.card, accent && styles.accentCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
    overflow: 'hidden',
  },
  accentCard: {
    borderColor: colors.borderStrong,
    backgroundColor: '#1a201c',
  },
});
