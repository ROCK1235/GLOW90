import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HabitsStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchHabits, logHabit, removeHabit } from '../habitsSlice';
import { HabitCard } from '../components/HabitCard';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<HabitsStackParamList, 'HabitsList'>;

export function HabitsListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.habits);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchHabits());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchHabits());
    setRefreshing(false);
  }, [dispatch]);

  const handleLog = useCallback(
    async (habitId: string) => {
      setLoggingId(habitId);
      await dispatch(logHabit(habitId));
      setLoggingId(null);
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    (habitId: string, name: string) => {
      Alert.alert('Delete habit?', `"${name}" and its history will be archived.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch(removeHabit(habitId)) },
      ]);
    },
    [dispatch]
  );

  return (
    <Screen
      title="Habits"
      headerRight={<Button label="+ Add" size="small" onPress={() => navigation.navigate('CreateHabit')} />}
    >
      {error ? <Text style={styles.error}>Couldn't load habits. Pull to retry.</Text> : null}

      {status === 'idle' && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Tap "+ Add" to create your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onLog={() => handleLog(item._id)}
              onEdit={() => navigation.navigate('EditHabit', { habitId: item._id })}
              onDelete={() => handleDelete(item._id, item.name)}
              logging={loggingId === item._id}
            />
          )}
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
