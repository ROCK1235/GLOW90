import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout, userProfileUpdated } from '../../auth/authSlice';
import { AuthUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Screen } from '../../../components/ui/Screen';
import { GlassCard } from '../../../components/ui/GlassCard';
import { PhotoPicker } from '../../../components/ui/PhotoPicker';
import { DateOfBirthPicker } from '../../../components/ui/DateOfBirthPicker';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import * as usersApi from '../../../api/users';
import * as weightApi from '../../../api/weight';

const SEX_OPTIONS: Array<{ value: 'male' | 'female' | 'other'; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

function formatDob(dob: string | null | undefined): string {
  if (!dob) return 'Not set';
  return new Date(dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const authUser = useAppSelector((state) => state.auth.user);

  const [profile, setProfile] = useState<AuthUser | null>(authUser);
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [sex, setSex] = useState<'male' | 'female' | 'other' | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ user }, latest] = await Promise.all([
          usersApi.getProfile(),
          weightApi.getLatestWeight().catch(() => null),
        ]);
        if (cancelled) return;
        setProfile(user);
        setLatestWeightKg(latest?.weightKg ?? null);
        dispatch(userProfileUpdated(user));
      } catch {
        if (!cancelled) setError('Could not load your profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const startEditing = () => {
    setName(profile?.name ?? '');
    setPhoneNumber(profile?.phoneNumber ?? '');
    setAvatarUrl(profile?.avatarUrl ?? null);
    setDob(profile?.dateOfBirth ? new Date(profile.dateOfBirth) : null);
    setSex(profile?.sex ?? null);
    setHeightCm(profile?.heightCm ? String(profile.heightCm) : '');
    setWeightKg(latestWeightKg ? String(latestWeightKg) : '');
    setError(null);
    setEditing(true);
  };

  const nameError = !name.trim() ? 'Name is required.' : null;
  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const heightValue = heightCm.trim() ? Number(heightCm) : null;
      const weightValue = weightKg.trim() ? Number(weightKg) : null;

      const updatedUser = await usersApi.updateProfile({
        name: name.trim(),
        avatarUrl,
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
        dateOfBirth: dob ? dob.toISOString().slice(0, 10) : null,
        sex,
        heightCm: heightValue,
      });

      if (weightValue) {
        const log = await weightApi.logWeight({ weightKg: weightValue });
        setLatestWeightKg(log.weightKg);
      }

      setProfile(updatedUser);
      dispatch(userProfileUpdated(updatedUser));
      setEditing(false);
    } catch {
      setError('Could not save your profile. Please check your entries and try again.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  if (loading) {
    return (
      <Screen title="Profile" hideProfileButton>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (editing) {
    return (
      <Screen title="Edit Profile" hideProfileButton>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content}>
            <PhotoPicker uri={avatarUrl} initial={initial} onChange={setAvatarUrl} />

            <TextField label="Name" value={name} onChangeText={setName} error={nameError} placeholder="Your name" />
            <TextField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g. +1 555 123 4567"
              keyboardType="phone-pad"
            />

            <DateOfBirthPicker label="Date of birth" value={dob} onChange={setDob} />

            <Text style={styles.label}>Sex</Text>
            <View style={styles.chipsRow}>
              {SEX_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSex(option.value)}
                  style={[styles.chip, sex === option.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, sex === option.value && styles.chipLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextField
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="e.g. 175"
            />
            <TextField
              label="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              placeholder="e.g. 70"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Save" onPress={handleSave} loading={saving} disabled={!canSave} />
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen title="Profile" hideProfileButton>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.name ?? 'Unknown'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <GlassCard style={styles.detailsCard} padded={false}>
          <DetailRow label="Phone" value={profile?.phoneNumber ?? null} />
          <DetailRow label="Date of birth" value={profile?.dateOfBirth ? formatDob(profile.dateOfBirth) : null} />
          <DetailRow
            label="Sex"
            value={profile?.sex ? SEX_OPTIONS.find((o) => o.value === profile.sex)?.label ?? null : null}
          />
          <DetailRow label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : null} />
          <DetailRow label="Weight" value={latestWeightKg ? `${latestWeightKg} kg` : null} last />
        </GlassCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Edit Profile" onPress={startEditing} />
        <Button
          label="Notification Settings"
          variant="secondary"
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <Button label="Log Out" variant="secondary" onPress={() => dispatch(logout())} />
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string | null; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last ? styles.detailRowLast : null]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? 'Not set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: spacing.sm,
  },
  avatarLabel: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
