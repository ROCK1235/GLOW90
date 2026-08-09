import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchHabits } from '../../habits/habitsSlice';
import { fetchSupplements } from '../../supplements/supplementsSlice';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from '../../../lib/notificationSettings';
import { requestNotificationPermission, resyncScheduledNotifications } from '../../../lib/notifications';
import { formatTime12h } from '../../../lib/time';
import { Screen } from '../../../components/ui/Screen';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { TimePicker } from '../../../components/ui/TimePicker';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, value, onChange, disabled }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const habits = useAppSelector((state) => state.habits.items);
  const supplements = useAppSelector((state) => state.supplements.items);

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [pickingWaterTime, setPickingWaterTime] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchHabits());
    dispatch(fetchSupplements());
    getNotificationSettings().then(setSettings);
  }, [dispatch]);

  if (!settings) {
    return (
      <Screen title="Notification Settings" hideProfileButton>
        <View style={styles.content} />
      </Screen>
    );
  }

  const update = (patch: Partial<NotificationSettings>) => setSettings({ ...settings, ...patch });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert('Notifications disabled', 'Allow notifications in your device settings to enable reminders.');
          setSaving(false);
          return;
        }
      }
      await saveNotificationSettings(settings);
      await resyncScheduledNotifications({ settings, habits, supplements });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Notification Settings" hideProfileButton>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card} padded={false}>
          <ToggleRow
            label="Enable notifications"
            description="Local reminders on this device — no account needed."
            value={settings.enabled}
            onChange={(value) => update({ enabled: value })}
          />
        </GlassCard>

        <GlassCard style={styles.card} padded={false}>
          <ToggleRow
            label="Supplement doses"
            description="A daily reminder at each scheduled dose time."
            value={settings.supplementsEnabled}
            onChange={(value) => update({ supplementsEnabled: value })}
            disabled={!settings.enabled}
          />
          <ToggleRow
            label="Habits"
            description="A daily reminder for habits with a reminder time set."
            value={settings.habitsEnabled}
            onChange={(value) => update({ habitsEnabled: value })}
            disabled={!settings.enabled}
          />
          <ToggleRow
            label="Water"
            description="One daily reminder to log your water intake."
            value={settings.waterEnabled}
            onChange={(value) => update({ waterEnabled: value })}
            disabled={!settings.enabled}
          />
        </GlassCard>

        {settings.enabled && settings.waterEnabled ? (
          <GlassCard style={styles.card}>
            <Text style={styles.rowLabel}>Water reminder time</Text>
            {pickingWaterTime ? (
              <TimePicker
                onAdd={(time24) => {
                  update({ waterReminderTime: time24 });
                  setPickingWaterTime(false);
                }}
              />
            ) : (
              <Button
                label={`${formatTime12h(settings.waterReminderTime)} · Change`}
                variant="secondary"
                size="small"
                onPress={() => setPickingWaterTime(true)}
              />
            )}
          </GlassCard>
        ) : null}

        <Button label="Save" onPress={handleSave} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
