import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchWeightLogs, removeWeightLog } from '../weightSlice';
import { computeRingProgress } from '../ringProgress';
import { userProfileUpdated } from '../../auth/authSlice';
import * as usersApi from '../../../api/users';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Weight'>;

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function WeightScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { logs, status, error } = useAppSelector((state) => state.weight);
  const user = useAppSelector((state) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    dispatch(fetchWeightLogs());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchWeightLogs());
    setRefreshing(false);
  }, [dispatch]);

  const handleDelete = useCallback(
    (date: string) => {
      Alert.alert('Delete entry?', `Remove the weight logged on ${formatDate(date)}.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch(removeWeightLog(date)) },
      ]);
    },
    [dispatch]
  );

  const startEditingGoal = () => {
    setGoalInput(user?.goals?.targetWeightKg ? String(user.goals.targetWeightKg) : '');
    setEditingGoal(true);
  };

  const saveGoal = async () => {
    const value = Number(goalInput);
    if (!(value > 0)) return;
    setSavingGoal(true);
    try {
      const updatedUser = await usersApi.updateProfile({
        goals: { type: user?.goals?.type ?? 'weight_loss', targetWeightKg: value, targetDate: null },
      });
      dispatch(userProfileUpdated(updatedUser));
      setEditingGoal(false);
    } finally {
      setSavingGoal(false);
    }
  };

  const ring = computeRingProgress(logs, user?.goals ?? null);
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen
      title="Weight"
      headerRight={<Button label="+ Log" size="small" onPress={() => navigation.navigate('LogWeight')} />}
    >
      {error ? <Text style={styles.error}>Couldn't load weight data. Pull to retry.</Text> : null}

      <GlassCard style={styles.ringCard}>
        <ProgressRing size={120} strokeWidth={12} progress={ring.progress} color={colors.accentWeight}>
          <Text style={styles.ringValue}>{ring.latestWeightKg ? `${ring.latestWeightKg}` : '—'}</Text>
          <Text style={styles.ringUnit}>kg</Text>
        </ProgressRing>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Start</Text>
            <Text style={styles.statValue}>{ring.startWeightKg ? `${ring.startWeightKg} kg` : '—'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={styles.statValue}>{ring.targetWeightKg ? `${ring.targetWeightKg} kg` : '—'}</Text>
          </View>
        </View>

        {editingGoal ? (
          <View style={styles.goalEditRow}>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              style={styles.goalInput}
              placeholder="kg"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Button label="Save" size="small" onPress={saveGoal} loading={savingGoal} />
            <Button label="Cancel" size="small" variant="secondary" onPress={() => setEditingGoal(false)} />
          </View>
        ) : (
          <Pressable onPress={startEditingGoal}>
            <Text style={styles.editGoalLink}>{ring.hasGoal ? 'Edit target weight' : 'Set a target weight'}</Text>
          </Pressable>
        )}
      </GlassCard>

      <Text style={styles.sectionLabel}>History</Text>
      {status === 'idle' && sortedLogs.length === 0 ? (
        <Text style={styles.emptyText}>No weight logged yet. Tap "+ Log" to add your first entry.</Text>
      ) : (
        <FlatList
          data={sortedLogs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.logRow}>
              <Text style={styles.logText}>
                {item.weightKg} kg · {formatDate(item.date)}
              </Text>
              <Pressable onPress={() => handleDelete(item.date)} hitSlop={8}>
                <Text style={styles.deleteLabel}>✕</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ringCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  ringUnit: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  editGoalLink: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.primary,
  },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.glassSurface,
    width: 90,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
