
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Client, supabase } from '@/utils/supabase';

type Props = {
  client: Client;
};

export default function ClientNotes({ client }: Props) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('clients')
        .update({ injuries: notes })
        .eq('id', client.id);

      if (error) {
        console.error('Error saving notes:', error);
        Alert.alert('Error', 'Failed to save notes');
      } else {
        Alert.alert('Success', 'Notes saved successfully');
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Client Notes</Text>
        <Text style={styles.subtitle}>
          Add any notes, observations, or important information about this client
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Enter notes here..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveNotes}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
});
