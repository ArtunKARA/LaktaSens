import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

type IconName = keyof typeof Ionicons.glyphMap;
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function AppButton({
  label,
  icon,
  loading,
  disabled,
  variant = 'primary',
  style,
  onPress,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, style, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <View style={[styles.button, styles[variant]]}>
        {loading ? <ActivityIndicator color={colors.text} /> : <ButtonContent icon={icon} label={label} variant={variant} />}
      </View>
    </Pressable>
  );
}

function ButtonContent({ icon, label, variant }: { icon?: IconName; label: string; variant: ButtonVariant }) {
  const color = variant === 'primary' ? colors.black : colors.text;

  return (
    <View style={styles.content}>
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, variant === 'primary' && styles.labelPrimary]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 48,
    borderRadius: radii.md,
    shadowColor: colors.black,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  labelPrimary: {
    color: colors.black,
  },
  primary: {
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
  },
  secondary: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: 'rgba(255, 107, 107, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.45)',
  },
});
