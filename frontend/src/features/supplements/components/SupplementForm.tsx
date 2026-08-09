import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TimePicker } from '../../../components/ui/TimePicker';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { DosageUnit, FoodTiming } from '../../../api/supplements';
import { formatTime12h } from '../../../lib/time';
import { FOOD_TIMING_OPTIONS } from '../foodTiming';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOSAGE_UNITS: DosageUnit[] = ['mg', 'mcg', 'g', 'ml', 'iu', 'tablet', 'capsule', 'drop'];

export interface SupplementFormValues {
  name: string;
  dosageAmount: string;
  dosageUnit: DosageUnit;
  foodTiming: FoodTiming;
  daysOfWeek: number[];
  times: string[];
}

interface SupplementFormProps {
  title: string;
  initialValues?: Partial<SupplementFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: SupplementFormValues) => void;
  onCancel: () => void;
}

export function SupplementForm({
  title,
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: SupplementFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [nameTouched, setNameTouched] = useState(false);
  const [dosageAmount, setDosageAmount] = useState(initialValues?.dosageAmount ?? '');
  const [dosageTouched, setDosageTouched] = useState(false);
  const [dosageUnit, setDosageUnit] = useState<DosageUnit>(initialValues?.dosageUnit ?? 'mg');
  const [foodTiming, setFoodTiming] = useState<FoodTiming>(initialValues?.foodTiming ?? 'anytime');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialValues?.daysOfWeek ?? []);
  const [times, setTimes] = useState<string[]>(initialValues?.times ?? []);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const addTime = (time24: string) => {
    setTimes((prev) => (prev.includes(time24) ? prev : [...prev, time24].sort()));
  };

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const nameError = (nameTouched || triedSubmit) && !name.trim() ? 'Name is required.' : null;
  const dosageValue = Number(dosageAmount);
  const dosageError =
    (dosageTouched || triedSubmit) && !(dosageValue > 0) ? 'Enter a dosage amount greater than 0.' : null;
  const timesError = triedSubmit && times.length === 0 ? 'Add at least one time.' : null;

  const canSubmit = name.trim().length > 0 && dosageValue > 0 && times.length > 0;

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), dosageAmount, dosageUnit, foodTiming, daysOfWeek: selectedDays, times });
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
            placeholder="e.g. Vitamin D"
            error={nameError}
          />
          <TextField
            label="Dosage amount"
            value={dosageAmount}
            onChangeText={setDosageAmount}
            onBlur={() => setDosageTouched(true)}
            keyboardType="numeric"
            placeholder="e.g. 1000"
            error={dosageError}
          />

          <Text style={styles.label}>Dosage unit</Text>
          <View style={styles.chipsRow}>
            {DOSAGE_UNITS.map((unit) => (
              <Pressable
                key={unit}
                onPress={() => setDosageUnit(unit)}
                style={[styles.chip, dosageUnit === unit && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, dosageUnit === unit && styles.chipLabelSelected]}>{unit}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Food timing</Text>
          <View style={styles.chipsRow}>
            {FOOD_TIMING_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setFoodTiming(option.value)}
                style={[styles.chip, foodTiming === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, foodTiming === option.value && styles.chipLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Times per day</Text>
          {times.length > 0 ? (
            <View style={styles.chipsRow}>
              {times.map((time) => (
                <Pressable key={time} onPress={() => removeTime(time)} style={[styles.chip, styles.chipSelected]}>
                  <Text style={styles.chipLabelSelected}>{formatTime12h(time)} ✕</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>No times added yet.</Text>
          )}
          {timesError ? <Text style={styles.error}>{timesError}</Text> : null}

          <TimePicker onAdd={addTime} />

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

          <Button label={submitLabel} onPress={handleSubmit} loading={submitting} disabled={triedSubmit && !canSubmit} />
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
});
