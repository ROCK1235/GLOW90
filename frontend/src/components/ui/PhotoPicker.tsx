import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface PhotoPickerProps {
  uri: string | null;
  initial: string;
  onChange: (dataUri: string) => void;
}

// Stored directly as a base64 data URI in the user's avatarUrl field — this
// project has no object storage (S3 etc.) set up, so a low-quality/quality:0.4
// square capture keeps the data URI small enough to live in the Mongo doc.
export function PhotoPicker({ uri, initial, onChange }: PhotoPickerProps) {
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    onChange(`data:${mime};base64,${asset.base64}`);
  };

  return (
    <Pressable style={styles.container} onPress={pick}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderLabel}>{initial}</Text>
        </View>
      )}
      <Text style={styles.changeLabel}>{uri ? 'Change photo' : 'Add photo'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 32,
  },
  changeLabel: {
    color: colors.primary,
    fontSize: 13,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});
