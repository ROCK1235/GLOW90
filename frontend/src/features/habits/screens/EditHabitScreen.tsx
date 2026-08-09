import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HabitsStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { editHabit } from '../habitsSlice';
import { HabitForm } from '../components/HabitForm';

type Props = NativeStackScreenProps<HabitsStackParamList, 'EditHabit'>;

export function EditHabitScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { habitId } = route.params;
  const habit = useAppSelector((state) => state.habits.items.find((item) => item._id === habitId));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; daysOfWeek: number[]; reminderTime: string | null }) => {
    setSubmitting(true);
    const result = await dispatch(editHabit({ habitId, input: values }));
    setSubmitting(false);
    if (editHabit.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <HabitForm
      title="Edit Habit"
      initialName={habit?.name}
      initialDaysOfWeek={habit?.cadence.daysOfWeek}
      initialReminderTime={habit?.reminderTime}
      submitLabel="Save Changes"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}
