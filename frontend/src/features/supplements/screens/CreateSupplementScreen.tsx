import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SupplementsStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store/hooks';
import { addSupplement } from '../supplementsSlice';
import { SupplementForm, SupplementFormValues } from '../components/SupplementForm';

type Props = NativeStackScreenProps<SupplementsStackParamList, 'CreateSupplement'>;

export function CreateSupplementScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplementFormValues) => {
    setSubmitting(true);
    const result = await dispatch(
      addSupplement({
        name: values.name,
        dosageAmount: Number(values.dosageAmount),
        dosageUnit: values.dosageUnit,
        foodTiming: values.foodTiming,
        daysOfWeek: values.daysOfWeek,
        times: values.times,
      })
    );
    setSubmitting(false);
    if (addSupplement.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <SupplementForm
      title="New Supplement"
      submitLabel="Create Supplement"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigation.goBack()}
    />
  );
}
