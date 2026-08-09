import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { register, clearAuthError } from '../authSlice';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { GradientBackground } from '../../../components/ui/GradientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { describeAuthError } from '../../../lib/errorMessages';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isSubmitting, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const passwordTooShort = password.length > 0 && password.length < 8;
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const handleSubmit = () => {
    dispatch(clearAuthError());
    dispatch(register({ email: email.trim(), password, name: name.trim() }));
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Track habits, water, supplements, skincare, and weight in one place.</Text>

          <GlassCard style={styles.formCard}>
            <TextField label="Name" value={name} onChangeText={setName} placeholder="Jane Doe" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 characters"
              error={passwordTooShort ? 'Password must be at least 8 characters.' : null}
            />

            {error ? <Text style={styles.error}>{describeAuthError(error)}</Text> : null}

            <Button label="Create Account" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
          </GlassCard>

          <Button label="Back to login" variant="secondary" onPress={() => navigation.navigate('Login')} />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  formCard: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
});
