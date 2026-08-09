import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SkincareStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRoutines, removeRoutine, toggleStep } from '../skincareSlice';
import { SkincareRoutineCard } from '../components/SkincareRoutineCard';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<SkincareStackParamList, 'SkincareList'>;

export function SkincareListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status, error, todayCompletedSteps } = useAppSelector((state) => state.skincare);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRoutines());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchRoutines());
    setRefreshing(false);
  }, [dispatch]);

  const handleDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete routine?', `"${name}" and its history will be archived.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch(removeRoutine(id)) },
      ]);
    },
    [dispatch]
  );

  return (
    <Screen
      title="Skincare"
      headerRight={<Button label="+ Add" size="small" onPress={() => navigation.navigate('CreateSkincareRoutine')} />}
    >
      {error ? <Text style={styles.error}>Couldn't load routines. Pull to retry.</Text> : null}

      {status === 'idle' && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No routines yet. Tap "+ Add" to create your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => {
            const completedSteps = todayCompletedSteps[item._id] ?? [];
            return (
              <SkincareRoutineCard
                routine={item}
                completedSteps={completedSteps}
                onToggleStep={(stepOrder) => dispatch(toggleStep({ routineId: item._id, stepOrder, currentCompleted: completedSteps }))}
                onEdit={() => navigation.navigate('EditSkincareRoutine', { routineId: item._id })}
                onDelete={() => handleDelete(item._id, item.name)}
              />
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
