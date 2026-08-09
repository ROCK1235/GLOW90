import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addWaterLog, fetchSummary, removeWaterLog, updateHydrationGoal } from '../waterSlice';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { GlassCard } from '../../../components/ui/GlassCard';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';

const QUICK_AMOUNTS = [100, 250, 500, 1000];

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function WaterScreen() {
  const dispatch = useAppDispatch();
  const { summary, status, error } = useAppSelector((state) => state.water);
  const [refreshing, setRefreshing] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    dispatch(fetchSummary());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchSummary());
    setRefreshing(false);
  }, [dispatch]);

  const handleLogCustom = () => {
    const amount = Number(customAmount);
    if (amount > 0) {
      dispatch(addWaterLog(amount));
      setCustomAmount('');
    }
  };

  const startEditingGoal = () => {
    setGoalInput(String(summary?.goalMl ?? 2500));
    setEditingGoal(true);
  };

  const saveGoal = () => {
    const value = Number(goalInput);
    if (value > 0) {
      dispatch(updateHydrationGoal(value));
    }
    setEditingGoal(false);
  };

  const totalMl = summary?.totalMl ?? 0;
  const goalMl = summary?.goalMl ?? 2500;
  const progressPercent = Math.min(100, goalMl > 0 ? (totalMl / goalMl) * 100 : 0);

  return (
    <Screen title="Water">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {error ? <Text style={styles.error}>Couldn't load water data. Pull to retry.</Text> : null}

        <GlassCard style={styles.progressCard}>
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              {totalMl} / {goalMl} ml
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            {summary?.goalMet ? <Text style={styles.goalMetText}>🎉 Goal reached today</Text> : null}

            {editingGoal ? (
              <View style={styles.goalEditRow}>
                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  style={styles.goalInput}
                  autoFocus
                />
                <Button label="Save" size="small" onPress={saveGoal} />
                <Button label="Cancel" size="small" variant="secondary" onPress={() => setEditingGoal(false)} />
              </View>
            ) : (
              <Pressable onPress={startEditingGoal}>
                <Text style={styles.editGoalLink}>Edit daily goal</Text>
              </Pressable>
            )}
          </View>
        </GlassCard>

        <View style={styles.quickAddRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              label={`+${amount}ml`}
              size="small"
              variant="secondary"
              onPress={() => dispatch(addWaterLog(amount))}
            />
          ))}
        </View>

        <View style={styles.customAddRow}>
          <TextInput
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder="Custom amount (ml)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={styles.customInput}
          />
          <Button label="Log" size="small" onPress={handleLogCustom} disabled={!(Number(customAmount) > 0)} />
        </View>

        <Text style={styles.sectionLabel}>Today's entries</Text>
        {status === 'idle' && (summary?.logs.length ?? 0) === 0 ? (
          <Text style={styles.emptyText}>No entries yet today.</Text>
        ) : (
          <GlassCard>
            <FlatList
              data={summary?.logs ?? []}
              keyExtractor={(item) => item._id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              renderItem={({ item }) => (
                <View style={styles.logRow}>
                  <Text style={styles.logText}>
                    {item.amountMl} ml · {formatTime(item.loggedAt)}
                  </Text>
                  <Pressable onPress={() => dispatch(removeWaterLog(item._id))} hitSlop={8}>
                    <Text style={styles.deleteLabel}>✕</Text>
                  </Pressable>
                </View>
              )}
            />
          </GlassCard>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.ringTrack,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentWater,
    borderRadius: 6,
  },
  goalMetText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  editGoalLink: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.primary,
  },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.glassSurface,
    width: 90,
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.glassSurface,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logText: {
    fontSize: 14,
    color: colors.text,
  },
  deleteLabel: {
    fontSize: 16,
    color: colors.danger,
    paddingHorizontal: spacing.xs,
  },
});
