import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Habit } from '../../../api/habits';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { todayUTCStr } from '../../../lib/date';
import { GlassCard } from '../../../components/ui/GlassCard';

interface HabitCardProps {
  habit: Habit;
  onLog: () => void;
  onEdit: () => void;
  onDelete: () => void;
  logging: boolean;
}

export function HabitCard({ habit, onLog, onEdit, onDelete, logging }: HabitCardProps) {
  const completedToday = habit.lastCompletedDate === todayUTCStr();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <Pressable style={styles.info} onPress={onEdit}>
          <Text style={styles.name}>
            {habit.icon ? `${habit.icon} ` : ''}
            {habit.name}
          </Text>
          <Text style={styles.streak}>
            {habit.currentStreak > 0 ? `🔥 ${habit.currentStreak} day streak` : 'No streak yet'}
          </Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
            <Text style={styles.deleteLabel}>🗑</Text>
          </Pressable>
          <Pressable
            onPress={onLog}
            disabled={completedToday || logging}
            style={[styles.button, completedToday && styles.buttonDone]}
          >
            <Text style={[styles.buttonLabel, completedToday && styles.buttonLabelDone]}>
              {completedToday ? '✓ Done' : logging ? '…' : 'Mark Done'}
            </Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  streak: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteLabel: {
    fontSize: 18,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonDone: {
    backgroundColor: colors.border,
  },
  buttonLabel: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonLabelDone: {
    color: colors.textMuted,
  },
});
