import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface DateOfBirthPickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

function defaultDob(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d;
}

// Native calendar/spinner picker instead of free-text date entry — the same
// lesson learned from the supplement time-entry bug (typed formats are
// error-prone; tap-based selection isn't).
export function DateOfBirthPicker({ label, value, onChange }: DateOfBirthPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(selected);
  };

  const displayValue = value
    ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not set';

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
        <Text style={styles.fieldValue}>{displayValue}</Text>
      </Pressable>
      {showPicker ? (
        <View>
          <DateTimePicker
            value={value ?? defaultDob()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setShowPicker(false)}>
              <Text style={styles.doneLabel}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.text,
  },
  doneLabel: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
