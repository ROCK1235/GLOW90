import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'small';
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', size = 'default' }: ButtonProps) {
  const isSecondary = variant === 'secondary';
  const isSmall = size === 'small';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isSmall ? styles.small : styles.defaultSize,
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.primaryText} />
      ) : (
        <Text style={[isSecondary ? styles.secondaryLabel : styles.primaryLabel, isSmall && styles.smallLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultSize: {
    paddingVertical: spacing.md,
  },
  small: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryLabel: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  smallLabel: {
    fontSize: 14,
  },
});
