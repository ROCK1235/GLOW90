import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SkincareRoutine } from '../../../api/skincare';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { GlassCard } from '../../../components/ui/GlassCard';

interface SkincareRoutineCardProps {
  routine: SkincareRoutine;
  completedSteps: number[];
  onToggleStep: (stepOrder: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SkincareRoutineCard({
  routine,
  completedSteps,
  onToggleStep,
  onEdit,
  onDelete,
}: SkincareRoutineCardProps) {
  const doneCount = routine.steps.filter((step) => completedSteps.includes(step.order)).length;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable style={styles.info} onPress={onEdit}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{routine.name}</Text>
            {routine.timeOfDay !== 'anytime' ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{routine.timeOfDay}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.progress}>
            {doneCount}/{routine.steps.length} done today
          </Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Text style={styles.deleteLabel}>🗑</Text>
        </Pressable>
      </View>

      <View style={styles.stepsList}>
        {routine.steps.map((step) => {
          const done = completedSteps.includes(step.order);
          return (
            <Pressable key={step.order} onPress={() => onToggleStep(step.order)} style={styles.stepRow}>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                {done ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepName, done && styles.stepNameDone]}>{step.name}</Text>
                {step.product ? <Text style={styles.stepProduct}>{step.product}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progress: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteLabel: {
    fontSize: 18,
  },
  stepsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    color: colors.text,
  },
  stepNameDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepProduct: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
