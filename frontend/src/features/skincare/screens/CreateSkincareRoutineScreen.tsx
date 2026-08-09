import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SkincareStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store/hooks';
import { addRoutine } from '../skincareSlice';
import { SkincareRoutineForm, SkincareRoutineFormValues } from '../components/SkincareRoutineForm';

type Props = NativeStackScreenProps<SkincareStackParamList, 'CreateSkincareRoutine'>;

export function CreateSkincareRoutineScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SkincareRoutineFormValues) => {
    setSubmitting(true);
    const result = await dispatch(
      addRoutine({
        name: values.name,
        timeOfDay: values.timeOfDay,
        steps: values.steps,
        daysOfWeek: values.daysOfWeek,
      })
    );
    setSubmitting(false);
    if (addRoutine.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <SkincareRoutineForm
      title="New Routine"
      submitLabel="Create Routine"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}
