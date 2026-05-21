import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

type IconName = keyof typeof Ionicons.glyphMap;

interface TextFieldProps extends TextInputProps {
  icon?: IconName;
}

export function TextField({ icon, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {icon ? <Ionicons name={icon} size={20} color={colors.textSoft} /> : null}
      <TextInput
        placeholderTextColor={colors.textSoft}
        selectionColor={colors.emerald}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
  },
});
