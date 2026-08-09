import React, { useEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { Screen } from '../../../components/ui/Screen';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fetchHabits } from '../../habits/habitsSlice';
import { fetchSupplements } from '../../supplements/supplementsSlice';
import { fetchRoutines } from '../../skincare/skincareSlice';
import { fetchSummary } from '../../water/waterSlice';
import { fetchWeightLogs } from '../../weight/weightSlice';
import { computeRingProgress } from '../../weight/ringProgress';
import { todayUTCStr } from '../../../lib/date';

interface DashboardCardProps {
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}

function DashboardCard({ title, onPress, children }: DashboardCardProps) {
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardLink}>View all →</Text>
      </View>
      {children}
    </GlassCard>
  );
}

export function HomeScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const user = useAppSelector((state) => state.auth.user);
  const habits = useAppSelector((state) => state.habits.items);
  const supplements = useAppSelector((state) => state.supplements.items);
  const loggedTimesToday = useAppSelector((state) => state.supplements.loggedTimesToday);
  const routines = useAppSelector((state) => state.skincare.items);
  const todayCompletedSteps = useAppSelector((state) => state.skincare.todayCompletedSteps);
  const waterSummary = useAppSelector((state) => state.water.summary);
  const weightLogs = useAppSelector((state) => state.weight.logs);

  useEffect(() => {
    dispatch(fetchHabits());
    dispatch(fetchSupplements());
    dispatch(fetchRoutines());
    dispatch(fetchSummary());
    dispatch(fetchWeightLogs());
  }, [dispatch]);

  const today = todayUTCStr();
  const habitsDoneToday = habits.filter((habit) => habit.lastCompletedDate === today).length;

  const supplementDosesTotal = supplements.reduce((sum, item) => sum + item.schedule.times.length, 0);
  const supplementDosesTaken = supplements.reduce(
    (sum, item) => sum + (loggedTimesToday[item._id]?.length ?? 0),
    0
  );

  const routinesCompleteToday = routines.filter((routine) => {
    const completed = todayCompletedSteps[routine._id] ?? [];
    return routine.steps.length > 0 && completed.length >= routine.steps.length;
  }).length;

  const waterTotal = waterSummary?.totalMl ?? 0;
  const waterGoal = waterSummary?.goalMl ?? 2500;
  const waterPercent = Math.min(100, waterGoal > 0 ? (waterTotal / waterGoal) * 100 : 0);

  const ring = computeRingProgress(weightLogs, user?.goals ?? null);

  return (
    <Screen title={`Hey ${user?.name?.split(' ')[0] ?? 'there'} 👋`}>
      <ScrollView contentContainerStyle={styles.content}>
        <DashboardCard title="Habits" onPress={() => navigation.navigate('Habits')}>
          <Text style={styles.cardStat}>
            {habitsDoneToday}/{habits.length} done today
          </Text>
        </DashboardCard>

        <DashboardCard title="Water" onPress={() => navigation.navigate('Water')}>
          <Text style={styles.cardStat}>
            {waterTotal} / {waterGoal} ml
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${waterPercent}%`, backgroundColor: colors.accentWater }]} />
          </View>
        </DashboardCard>

        <DashboardCard title="Supplements" onPress={() => navigation.navigate('Supplements')}>
          <Text style={styles.cardStat}>
            {supplementDosesTaken}/{supplementDosesTotal} doses taken today
          </Text>
        </DashboardCard>

        <DashboardCard title="Skincare" onPress={() => navigation.navigate('Skincare')}>
          <Text style={styles.cardStat}>
            {routinesCompleteToday}/{routines.length} routines complete today
          </Text>
        </DashboardCard>

        <GlassCard onPress={() => navigation.navigate('Weight')} style={styles.card}>
          <View style={styles.weightRow}>
            <View style={styles.weightInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Weight</Text>
                <Text style={styles.cardLink}>View all →</Text>
              </View>
              {ring.hasGoal ? (
                <Text style={styles.cardStat}>
                  {ring.latestWeightKg ?? '—'} kg → {ring.targetWeightKg} kg
                </Text>
              ) : (
                <Text style={styles.cardStat}>Set a goal to track progress</Text>
              )}
            </View>
            <ProgressRing size={56} strokeWidth={6} progress={ring.progress} color={colors.accentWeight}>
              <Text style={styles.ringMini}>{ring.latestWeightKg ?? '–'}</Text>
            </ProgressRing>
          </View>
        </GlassCard>

        <Pressable onPress={() => Linking.openURL('mailto:dashayush1235@gmail.com')} style={styles.creditWrap}>
          <Text style={styles.creditText}>Developed by Ayush Kumar Dash</Text>
          <Text style={styles.creditSubtext}>Software Engineer · dashayush1235@gmail.com</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardLink: {
    fontSize: 13,
    color: colors.primary,
  },
  cardStat: {
    fontSize: 15,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ringTrack,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ringMini: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  creditWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  creditText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  creditSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
