import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { RoleCode, roleLabels } from '../../types/domain';

interface RoleBadgeProps {
  role: RoleCode;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{roleLabels[role]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(159, 190, 167, 0.10)',
    paddingHorizontal: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.emerald,
  },
});
