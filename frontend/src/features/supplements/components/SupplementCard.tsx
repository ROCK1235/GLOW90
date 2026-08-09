import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Supplement } from '../../../api/supplements';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { formatTime12h } from '../../../lib/time';
import { foodTimingLabel } from '../foodTiming';
import { GlassCard } from '../../../components/ui/GlassCard';

interface SupplementCardProps {
  supplement: Supplement;
  loggedTimes: string[];
  onLogTime: (time: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SupplementCard({ supplement, loggedTimes, onLogTime, onEdit, onDelete }: SupplementCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable style={styles.info} onPress={onEdit}>
          <Text style={styles.name}>{supplement.name}</Text>
          <Text style={styles.dosage}>
            {supplement.dosageAmount} {supplement.dosageUnit}
            {supplement.foodTiming !== 'anytime' ? ` · ${foodTimingLabel(supplement.foodTiming)}` : ''}
          </Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Text style={styles.deleteLabel}>🗑</Text>
        </Pressable>
      </View>
      <View style={styles.timesRow}>
        {supplement.schedule.times.map((time) => {
          const done = loggedTimes.includes(time);
          return (
            <Pressable
              key={time}
              onPress={() => onLogTime(time)}
              disabled={done}
              style={[styles.timeChip, done && styles.timeChipDone]}
            >
              <Text style={[styles.timeChipLabel, done && styles.timeChipLabelDone]}>
                {done ? `✓ ${formatTime12h(time)}` : `Take ${formatTime12h(time)}`}
              </Text>
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
  dosage: {
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
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timeChip: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  timeChipDone: {
    backgroundColor: colors.border,
  },
  timeChipLabel: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 13,
  },
  timeChipLabelDone: {
    color: colors.textMuted,
  },
});
