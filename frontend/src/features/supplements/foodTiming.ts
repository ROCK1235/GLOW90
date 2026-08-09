import { FoodTiming } from '../../api/supplements';

export const FOOD_TIMING_OPTIONS: Array<{ value: FoodTiming; label: string }> = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'before_food', label: 'Before Food' },
  { value: 'with_food', label: 'With Food' },
  { value: 'after_food', label: 'After Food' },
];

export function foodTimingLabel(value: FoodTiming): string {
  return FOOD_TIMING_OPTIONS.find((option) => option.value === value)?.label ?? 'Anytime';
}
