import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { to24HourTime } from '../../lib/time';
import { Button } from './Button';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];
const MERIDIEMS: Array<'AM' | 'PM'> = ['AM', 'PM'];

interface TimePickerProps {
  onAdd: (time24: string) => void;
}

// Tap-based time selection instead of free-text HH:mm entry — no keyboard
// format ambiguity (people type "." instead of ":"), and 12-hour AM/PM is
// less error-prone on a phone than 24-hour.
export function TimePicker({ onAdd }: TimePickerProps) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {HOURS.map((h) => (
          <Pressable key={h} onPress={() => setHour(h)} style={[styles.chip, hour === h && styles.chipSelected]}>
            <Text style={[styles.chipLabel, hour === h && styles.chipLabelSelected]}>{h}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {MINUTES.map((m) => (
          <Pressable key={m} onPress={() => setMinute(m)} style={[styles.chip, minute === m && styles.chipSelected]}>
            <Text style={[styles.chipLabel, minute === m && styles.chipLabelSelected]}>
              :{String(m).padStart(2, '0')}
            </Text>
          </Pressable>
        ))}
        {MERIDIEMS.map((mer) => (
          <Pressable
            key={mer}
            onPress={() => setMeridiem(mer)}
            style={[styles.chip, meridiem === mer && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, meridiem === mer && styles.chipLabelSelected]}>{mer}</Text>
          </Pressable>
        ))}
      </View>
      <Button
        label={`Add ${hour}:${String(minute).padStart(2, '0')} ${meridiem}`}
        size="small"
        variant="secondary"
        onPress={() => onAdd(to24HourTime(hour, minute, meridiem))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
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
  },
});
