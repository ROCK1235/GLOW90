import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

// Full-bleed pastel gradient backdrop — the "something colorful behind the
// frosted glass" that makes GlassCard actually read as glass instead of
// just a translucent gray box.
export function GradientBackground({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.fill, style]} {...rest}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
