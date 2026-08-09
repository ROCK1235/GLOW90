import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

// Base "frosted glass" surface used for every card-like block in the app.
// Shadow lives on an outer wrapper (not the BlurView itself) because
// Android's `elevation` gets clipped when it shares a view with
// `overflow: 'hidden'`, which the BlurView needs for its rounded corners.
export function GlassCard({ children, onPress, style, padded = true }: GlassCardProps) {
  const content = (
    <View style={[styles.shadowWrap, style]}>
      <BlurView intensity={50} tint="default" style={[styles.card, padded && styles.padded]}>
        {children}
      </BlurView>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radius.lg,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassSurface,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
