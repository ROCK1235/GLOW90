import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store/hooks';
import { addWeightLog } from '../weightSlice';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWeight'>;

export function LogWeightScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [weightKg, setWeightKg] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const value = Number(weightKg);
  const weightError = triedSubmit && !(value > 0) ? 'Enter a weight greater than 0.' : null;
  const canSubmit = value > 0;

  const handleSubmit = async () => {
    setTriedSubmit(true);
    if (!canSubmit) return;
    setSubmitting(true);
    const result = await dispatch(addWeightLog({ weightKg: value }));
    setSubmitting(false);
    if (addWeightLog.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <Screen title="Log Weight" hideProfileButton>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <TextField
            label="Weight (kg)"
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="numeric"
            placeholder="e.g. 68.5"
            error={weightError}
            autoFocus
          />
          <Text style={styles.hint}>Logs today's weight. Logging again today updates the same entry.</Text>

          <Button label="Save" onPress={handleSubmit} loading={submitting} disabled={triedSubmit && !canSubmit} />
          <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
