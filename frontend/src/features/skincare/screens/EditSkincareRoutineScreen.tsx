import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SkincareStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { editRoutine } from '../skincareSlice';
import { SkincareRoutineForm, SkincareRoutineFormValues } from '../components/SkincareRoutineForm';

type Props = NativeStackScreenProps<SkincareStackParamList, 'EditSkincareRoutine'>;

export function EditSkincareRoutineScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { routineId } = route.params;
  const routine = useAppSelector((state) => state.skincare.items.find((item) => item._id === routineId));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SkincareRoutineFormValues) => {
    setSubmitting(true);
    const result = await dispatch(
      editRoutine({
        id: routineId,
        input: {
          name: values.name,
          timeOfDay: values.timeOfDay,
          steps: values.steps,
          daysOfWeek: values.daysOfWeek,
        },
      })
    );
    setSubmitting(false);
    if (editRoutine.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <SkincareRoutineForm
      title="Edit Routine"
      initialValues={
        routine
          ? {
              name: routine.name,
              timeOfDay: routine.timeOfDay,
              steps: routine.steps.map((step) => ({ name: step.name, product: step.product })),
              daysOfWeek: routine.cadence.daysOfWeek,
            }
          : undefined
      }
      submitLabel="Save Changes"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}
