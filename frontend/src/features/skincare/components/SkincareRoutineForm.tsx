import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { RoutineStepInput, SkincareTimeOfDay } from '../../../api/skincare';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_OF_DAY_OPTIONS: Array<{ value: SkincareTimeOfDay; label: string }> = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

export interface SkincareRoutineFormValues {
  name: string;
  timeOfDay: SkincareTimeOfDay;
  steps: RoutineStepInput[];
  daysOfWeek: number[];
}

interface SkincareRoutineFormProps {
  title: string;
  initialValues?: Partial<SkincareRoutineFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: SkincareRoutineFormValues) => void;
  onCancel: () => void;
}

export function SkincareRoutineForm({
  title,
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: SkincareRoutineFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [nameTouched, setNameTouched] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<SkincareTimeOfDay>(initialValues?.timeOfDay ?? 'anytime');
  const [steps, setSteps] = useState<RoutineStepInput[]>(initialValues?.steps ?? []);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialValues?.daysOfWeek ?? []);
  const [newStepName, setNewStepName] = useState('');
  const [newStepProduct, setNewStepProduct] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const addStep = () => {
    const trimmedName = newStepName.trim();
    if (!trimmedName) return;
    setSteps((prev) => [...prev, { name: trimmedName, product: newStepProduct.trim() || null }]);
    setNewStepName('');
    setNewStepProduct('');
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const nameError = (nameTouched || triedSubmit) && !name.trim() ? 'Name is required.' : null;
  const stepsError = triedSubmit && steps.length === 0 ? 'Add at least one step.' : null;
  const canSubmit = name.trim().length > 0 && steps.length > 0;

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), timeOfDay, steps, daysOfWeek: selectedDays });
  };

  return (
    <Screen title={title}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            onBlur={() => setNameTouched(true)}
            placeholder="e.g. Morning Routine"
            error={nameError}
          />

          <Text style={styles.label}>Time of day</Text>
          <View style={styles.chipsRow}>
            {TIME_OF_DAY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setTimeOfDay(option.value)}
                style={[styles.chip, timeOfDay === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, timeOfDay === option.value && styles.chipLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Steps</Text>
          {steps.length > 0 ? (
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <View key={`${step.name}-${index}`} style={styles.stepRow}>
                  <Text style={styles.stepOrder}>{index + 1}.</Text>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    {step.product ? <Text style={styles.stepProduct}>{step.product}</Text> : null}
                  </View>
                  <Pressable onPress={() => removeStep(index)} hitSlop={8}>
                    <Text style={styles.removeStep}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>No steps added yet.</Text>
          )}
          {stepsError ? <Text style={styles.error}>{stepsError}</Text> : null}

          <View style={styles.addStepBlock}>
            <TextInput
              value={newStepName}
              onChangeText={setNewStepName}
              placeholder="Step name, e.g. Cleanser"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />
            <TextInput
              value={newStepProduct}
              onChangeText={setNewStepProduct}
              placeholder="Product (optional)"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />
            <Button label="Add Step" size="small" variant="secondary" onPress={addStep} disabled={!newStepName.trim()} />
          </View>

          <Text style={styles.label}>Repeat on</Text>
          <Text style={styles.hint}>Leave all unselected for every day.</Text>
          <View style={styles.chipsRow}>
            {DAY_LABELS.map((label, index) => {
              const selected = selectedDays.includes(index);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(index)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label={submitLabel}
            onPress={handleSubmit}
            loading={submitting}
            disabled={triedSubmit && !canSubmit}
          />
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </ScrollView>
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 13,
  },
  stepsList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  stepOrder: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    color: colors.text,
  },
  stepProduct: {
    fontSize: 12,
    color: colors.textMuted,
  },
  removeStep: {
    fontSize: 16,
    color: colors.danger,
    paddingHorizontal: spacing.xs,
  },
  addStepBlock: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
