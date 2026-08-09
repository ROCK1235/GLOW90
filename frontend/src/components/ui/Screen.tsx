import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAppSelector } from '../../store/hooks';
import { GradientBackground } from './GradientBackground';

interface ScreenProps {
  title?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  hideProfileButton?: boolean;
  children: React.ReactNode;
}

// Common screen shell: correct safe-area insets on both iOS and Android
// (react-native's own SafeAreaView is iOS-only and silently no-ops on
// Android), an optional title/action header and footer slot, a profile
// avatar button in every header (tap → Profile, registered on the root
// navigator so it's reachable regardless of which tab/stack this screen is
// nested in), and the app-wide pastel gradient backdrop every glass card
// sits on top of.
export function Screen({ title, headerRight, footer, hideProfileButton, children }: ScreenProps) {
  const navigation = useNavigation<any>();
  const user = useAppSelector((state) => state.auth.user);
  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          <View style={styles.headerActions}>
            {headerRight}
            {!hideProfileButton ? (
              <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={8} style={styles.avatar}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarLabel}>{initial}</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 34,
    height: 34,
  },
  avatarLabel: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
  },
});
