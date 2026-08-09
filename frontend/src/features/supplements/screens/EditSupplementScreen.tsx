import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SupplementsStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { editSupplement } from '../supplementsSlice';
import { SupplementForm, SupplementFormValues } from '../components/SupplementForm';

type Props = NativeStackScreenProps<SupplementsStackParamList, 'EditSupplement'>;

export function EditSupplementScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { supplementId } = route.params;
  const supplement = useAppSelector((state) => state.supplements.items.find((item) => item._id === supplementId));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplementFormValues) => {
    setSubmitting(true);
    const result = await dispatch(
      editSupplement({
        id: supplementId,
        input: {
          name: values.name,
          dosageAmount: Number(values.dosageAmount),
          dosageUnit: values.dosageUnit,
          foodTiming: values.foodTiming,
          daysOfWeek: values.daysOfWeek,
          times: values.times,
        },
      })
    );
    setSubmitting(false);
    if (editSupplement.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <SupplementForm
      title="Edit Supplement"
      initialValues={
        supplement
          ? {
              name: supplement.name,
              dosageAmount: String(supplement.dosageAmount),
              dosageUnit: supplement.dosageUnit,
              foodTiming: supplement.foodTiming,
              daysOfWeek: supplement.schedule.daysOfWeek,
              times: supplement.schedule.times,
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
