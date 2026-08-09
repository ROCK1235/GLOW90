import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SupplementsStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchSupplements, logSupplementDose, removeSupplement } from '../supplementsSlice';
import { SupplementCard } from '../components/SupplementCard';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<SupplementsStackParamList, 'SupplementsList'>;

export function SupplementsListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status, error, loggedTimesToday } = useAppSelector((state) => state.supplements);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSupplements());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchSupplements());
    setRefreshing(false);
  }, [dispatch]);

  const handleDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete supplement?', `"${name}" and its history will be archived.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => dispatch(removeSupplement(id)) },
      ]);
    },
    [dispatch]
  );

  return (
    <Screen
      title="Supplements"
      headerRight={<Button label="+ Add" size="small" onPress={() => navigation.navigate('CreateSupplement')} />}
    >
      {error ? <Text style={styles.error}>Couldn't load supplements. Pull to retry.</Text> : null}

      {status === 'idle' && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No supplements yet. Tap "+ Add" to create your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <SupplementCard
              supplement={item}
              loggedTimes={loggedTimesToday[item._id] ?? []}
              onLogTime={(time) => dispatch(logSupplementDose({ id: item._id, time }))}
              onEdit={() => navigation.navigate('EditSupplement', { supplementId: item._id })}
              onDelete={() => handleDelete(item._id, item.name)}
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
