import { WeightLog } from '../../api/weight';

export interface WeightGoal {
  targetWeightKg: number | null;
}

export interface RingProgress {
  hasGoal: boolean;
  hasLogs: boolean;
  progress: number; // 0-1
  latestWeightKg: number | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Progress toward a weight goal, derived entirely from real logs (no
// separate "starting weight" field exists anywhere in the backend, so the
// earliest log on record is used as the baseline). One formula handles both
// weight-loss and weight-gain goals by direction, without branching on
// goal type: it's just the position of "latest" between "start" and
// "target" on the number line.
export function computeRingProgress(logs: WeightLog[], goal: WeightGoal | null): RingProgress {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1] ?? null;
  const start = sorted[0] ?? null;
  const targetWeightKg = goal?.targetWeightKg ?? null;

  if (!latest || !targetWeightKg) {
    return {
      hasGoal: Boolean(targetWeightKg),
      hasLogs: Boolean(latest),
      progress: 0,
      latestWeightKg: latest?.weightKg ?? null,
      startWeightKg: start?.weightKg ?? null,
      targetWeightKg,
    };
  }

  const startWeightKg = start!.weightKg;
  const progress =
    targetWeightKg === startWeightKg
      ? latest.weightKg === targetWeightKg
        ? 1
        : 0
      : clamp01((latest.weightKg - startWeightKg) / (targetWeightKg - startWeightKg));

  return {
    hasGoal: true,
    hasLogs: true,
    progress,
    latestWeightKg: latest.weightKg,
    startWeightKg,
    targetWeightKg,
  };
}
