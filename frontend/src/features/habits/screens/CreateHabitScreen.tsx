import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HabitsStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store/hooks';
import { addHabit } from '../habitsSlice';
import { HabitForm } from '../components/HabitForm';

type Props = NativeStackScreenProps<HabitsStackParamList, 'CreateHabit'>;

export function CreateHabitScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; daysOfWeek: number[]; reminderTime: string | null }) => {
    setSubmitting(true);
    const result = await dispatch(addHabit(values));
    setSubmitting(false);
    if (addHabit.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <HabitForm
      title="New Habit"
      submitLabel="Create Habit"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}
