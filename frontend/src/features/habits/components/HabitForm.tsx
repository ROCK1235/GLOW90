import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { TimePicker } from '../../../components/ui/TimePicker';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { formatTime12h } from '../../../lib/time';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HabitFormProps {
  title: string;
  initialName?: string;
  initialDaysOfWeek?: number[];
  initialReminderTime?: string | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: { name: string; daysOfWeek: number[]; reminderTime: string | null }) => void;
  onCancel: () => void;
}

export function HabitForm({
  title,
  initialName = '',
  initialDaysOfWeek = [],
  initialReminderTime = null,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: HabitFormProps) {
  const [name, setName] = useState(initialName);
  const [nameTouched, setNameTouched] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialDaysOfWeek);
  const [reminderTime, setReminderTime] = useState<string | null>(initialReminderTime);
  const [pickingReminder, setPickingReminder] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const nameError = (nameTouched || triedSubmit) && !name.trim() ? 'Name is required.' : null;
  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), daysOfWeek: selectedDays, reminderTime });
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
            placeholder="e.g. Read 10 pages"
            error={nameError}
          />

          <Text style={styles.label}>Repeat on</Text>
          <Text style={styles.hint}>Leave all unselected for a daily habit.</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, index) => {
              const selected = selectedDays.includes(index);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(index)}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                >
                  <Text style={[styles.dayChipLabel, selected && styles.dayChipLabelSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Reminder</Text>
          {reminderTime ? (
            <Pressable
              onPress={() => setReminderTime(null)}
              style={[styles.dayChip, styles.dayChipSelected, styles.reminderChip]}
            >
              <Text style={styles.dayChipLabelSelected}>🔔 {formatTime12h(reminderTime)} ✕</Text>
            </Pressable>
          ) : pickingReminder ? (
            <TimePicker
              onAdd={(time24) => {
                setReminderTime(time24);
                setPickingReminder(false);
              }}
            />
          ) : (
            <Pressable onPress={() => setPickingReminder(true)} style={styles.dayChip}>
              <Text style={styles.dayChipLabel}>+ Set a reminder</Text>
            </Pressable>
          )}

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
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipLabel: {
    fontSize: 13,
    color: colors.text,
  },
  dayChipLabelSelected: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  reminderChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
});
