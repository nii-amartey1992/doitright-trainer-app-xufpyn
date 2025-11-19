
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/utils/supabase';
import { IconSymbol } from '@/components/IconSymbol';

export default function AddClientScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    bodyfat_percentage: '',
    activity_level: 'moderate',
    goals: 'fat_loss',
    weekly_training_days: '4',
    session_duration_minutes: '60',
    training_experience: 'intermediate',
    injuries: '',
    training_location: 'gym',
    available_equipment: '',
    diet_type: 'flexible',
    allergies: '',
    disliked_foods: '',
    target_weight_kg: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit() {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter client name');
      return;
    }

    try {
      const clientData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        dob: formData.dob || null,
        gender: formData.gender,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        bodyfat_percentage: formData.bodyfat_percentage ? parseFloat(formData.bodyfat_percentage) : null,
        activity_level: formData.activity_level,
        goals: formData.goals,
        weekly_training_days: parseInt(formData.weekly_training_days) || 4,
        session_duration_minutes: parseInt(formData.session_duration_minutes) || 60,
        training_experience: formData.training_experience,
        injuries: formData.injuries || null,
        training_location: formData.training_location,
        available_equipment: formData.available_equipment ? formData.available_equipment.split(',').map(e => e.trim()) : [],
        diet_type: formData.diet_type,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        disliked_foods: formData.disliked_foods ? formData.disliked_foods.split(',').map(f => f.trim()) : [],
        target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        Alert.alert('Error', 'Failed to create client');
      } else {
        Alert.alert('Success', 'Client added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to create client');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.card}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Client</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => updateField('full_name', text)}
            placeholder="John Doe"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="john@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+1234567890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={formData.dob}
            onChangeText={(text) => updateField('dob', text)}
            placeholder="1990-01-01"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, formData.gender === 'male' && styles.optionButtonActive]}
              onPress={() => updateField('gender', 'male')}
            >
              <Text style={[styles.optionText, formData.gender === 'male' && styles.optionTextActive]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.gender === 'female' && styles.optionButtonActive]}
              onPress={() => updateField('gender', 'female')}
            >
              <Text style={[styles.optionText, formData.gender === 'female' && styles.optionTextActive]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Stats</Text>
          
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height_cm}
            onChangeText={(text) => updateField('height_cm', text)}
            placeholder="175"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight_kg}
            onChangeText={(text) => updateField('weight_kg', text)}
            placeholder="75"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Body Fat % (optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.bodyfat_percentage}
            onChangeText={(text) => updateField('bodyfat_percentage', text)}
            placeholder="15"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Target Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.target_weight_kg}
            onChangeText={(text) => updateField('target_weight_kg', text)}
            placeholder="70"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity & Goals</Text>
          
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.buttonGroup}>
            {['sedentary', 'light', 'moderate', 'active', 'very_active'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionButton, formData.activity_level === level && styles.optionButtonActive]}
                onPress={() => updateField('activity_level', level)}
              >
                <Text style={[styles.optionText, formData.activity_level === level && styles.optionTextActive]}>
                  {level.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Goals</Text>
          <View style={styles.buttonGroup}>
            {['fat_loss', 'muscle_gain', 'recomp', 'strength'].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[styles.optionButton, formData.goals === goal && styles.optionButtonActive]}
                onPress={() => updateField('goals', goal)}
              >
                <Text style={[styles.optionText, formData.goals === goal && styles.optionTextActive]}>
                  {goal.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Details</Text>
          
          <Text style={styles.label}>Weekly Training Days</Text>
          <TextInput
            style={styles.input}
            value={formData.weekly_training_days}
            onChangeText={(text) => updateField('weekly_training_days', text)}
            placeholder="4"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Session Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={formData.session_duration_minutes}
            onChangeText={(text) => updateField('session_duration_minutes', text)}
            placeholder="60"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Training Experience</Text>
          <View style={styles.buttonGroup}>
            {['beginner', 'intermediate', 'advanced'].map((exp) => (
              <TouchableOpacity
                key={exp}
                style={[styles.optionButton, formData.training_experience === exp && styles.optionButtonActive]}
                onPress={() => updateField('training_experience', exp)}
              >
                <Text style={[styles.optionText, formData.training_experience === exp && styles.optionTextActive]}>
                  {exp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Training Location</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, formData.training_location === 'gym' && styles.optionButtonActive]}
              onPress={() => updateField('training_location', 'gym')}
            >
              <Text style={[styles.optionText, formData.training_location === 'gym' && styles.optionTextActive]}>
                Gym
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, formData.training_location === 'home' && styles.optionButtonActive]}
              onPress={() => updateField('training_location', 'home')}
            >
              <Text style={[styles.optionText, formData.training_location === 'home' && styles.optionTextActive]}>
                Home
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Available Equipment (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.available_equipment}
            onChangeText={(text) => updateField('available_equipment', text)}
            placeholder="Barbell, Dumbbells, Bench"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <Text style={styles.label}>Injuries / Limitations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.injuries}
            onChangeText={(text) => updateField('injuries', text)}
            placeholder="Any injuries or limitations..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition</Text>
          
          <Text style={styles.label}>Diet Type</Text>
          <View style={styles.buttonGroup}>
            {['flexible', 'vegetarian', 'vegan', 'keto', 'paleo'].map((diet) => (
              <TouchableOpacity
                key={diet}
                style={[styles.optionButton, formData.diet_type === diet && styles.optionButtonActive]}
                onPress={() => updateField('diet_type', diet)}
              >
                <Text style={[styles.optionText, formData.diet_type === diet && styles.optionTextActive]}>
                  {diet}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Allergies (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.allergies}
            onChangeText={(text) => updateField('allergies', text)}
            placeholder="Nuts, Dairy, Gluten"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Disliked Foods (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.disliked_foods}
            onChangeText={(text) => updateField('disliked_foods', text)}
            placeholder="Broccoli, Fish"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Client</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: colors.card,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.card,
  },
});
