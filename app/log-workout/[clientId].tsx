
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { supabase, WorkoutDay, Exercise, SessionSet } from '@/utils/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { calculateProgressiveOverload } from '@/utils/progressiveOverload';

type ExerciseLog = {
  exercise: Exercise;
  sets: {
    weight: string;
    reps: string;
    rpe: string;
    success: boolean;
  }[];
  suggestion?: {
    suggestedWeight: number;
    reason: string;
    lastWeight: number;
  };
};

export default function LogWorkoutScreen() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutDays();
  }, []);

  async function loadWorkoutDays() {
    try {
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .select('id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (programError || !programData) {
        console.error('Error loading program:', programError);
        setLoading(false);
        return;
      }

      const { data: daysData, error: daysError } = await supabase
        .from('workout_days')
        .select('*')
        .eq('workout_program_id', programData.id)
        .order('day_number');

      if (daysError) {
        console.error('Error loading workout days:', daysError);
      } else {
        setWorkoutDays(daysData || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function selectWorkoutDay(day: WorkoutDay) {
    setSelectedDay(day);
    
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_day_id', day.id)
        .order('order_index');

      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError);
        return;
      }

      const logs: ExerciseLog[] = [];
      
      for (const exercise of exercisesData || []) {
        const { data: recentSessions, error: sessionsError } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('client_id', clientId)
          .order('session_date', { ascending: false })
          .limit(3);

        if (!sessionsError && recentSessions) {
          const recentSets: SessionSet[][] = [];
          
          for (const session of recentSessions) {
            const { data: setsData, error: setsError } = await supabase
              .from('session_sets')
              .select('*')
              .eq('workout_session_id', session.id)
              .eq('exercise_name', exercise.name);

            if (!setsError && setsData && setsData.length > 0) {
              recentSets.push(setsData);
            }
          }

          const suggestion = calculateProgressiveOverload(exercise.name, recentSets);
          
          logs.push({
            exercise,
            sets: Array.from({ length: exercise.sets }, () => ({
              weight: suggestion.suggestedWeight.toString(),
              reps: '',
              rpe: '7',
              success: true,
            })),
            suggestion,
          });
        } else {
          logs.push({
            exercise,
            sets: Array.from({ length: exercise.sets }, () => ({
              weight: '20',
              reps: '',
              rpe: '7',
              success: true,
            })),
          });
        }
      }

      setExerciseLogs(logs);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function saveWorkout() {
    if (!selectedDay) {
      Alert.alert('Error', 'Please select a workout');
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert([{
          client_id: clientId,
          workout_day_id: selectedDay.id,
          session_date: new Date().toISOString().split('T')[0],
          notes: sessionNotes || null,
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        Alert.alert('Error', 'Failed to save workout');
        return;
      }

      const allSets: any[] = [];
      
      for (const log of exerciseLogs) {
        log.sets.forEach((set, index) => {
          if (set.reps) {
            allSets.push({
              workout_session_id: sessionData.id,
              exercise_name: log.exercise.name,
              set_number: index + 1,
              weight_kg: parseFloat(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
              rpe: parseInt(set.rpe) || null,
              success: set.success,
            });
          }
        });
      }

      if (allSets.length > 0) {
        const { error: setsError } = await supabase
          .from('session_sets')
          .insert(allSets);

        if (setsError) {
          console.error('Error saving sets:', setsError);
          Alert.alert('Error', 'Failed to save workout sets');
          return;
        }
      }

      Alert.alert('Success', 'Workout logged successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to save workout');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
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
        <Text style={styles.headerTitle}>Log Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      {!selectedDay ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Select Workout</Text>
          {workoutDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={styles.workoutCard}
              onPress={() => selectWorkoutDay(day)}
            >
              <Text style={styles.workoutTitle}>Day {day.day_number}</Text>
              <Text style={styles.workoutFocus}>{day.focus}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.selectedWorkout}>
            <Text style={styles.selectedTitle}>{selectedDay.focus}</Text>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>

          {exerciseLogs.map((log, logIndex) => (
            <View key={logIndex} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{log.exercise.name}</Text>
              <Text style={styles.exerciseTarget}>
                Target: {log.exercise.sets} × {log.exercise.reps}
              </Text>
              
              {log.suggestion && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionText}>
                    Last: {log.suggestion.lastWeight}kg → Suggested: {log.suggestion.suggestedWeight}kg
                  </Text>
                  <Text style={styles.suggestionReason}>{log.suggestion.reason}</Text>
                </View>
              )}

              {log.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight}
                    onChangeText={(text) => {
                      const newLogs = [...exerciseLogs];
                      newLogs[logIndex].sets[setIndex].weight = text;
                      setExerciseLogs(newLogs);
                    }}
                    placeholder="kg"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(text) => {
                      const newLogs = [...exerciseLogs];
                      newLogs[logIndex].sets[setIndex].reps = text;
                      setExerciseLogs(newLogs);
                    }}
                    placeholder="reps"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.setInput}
                    value={set.rpe}
                    onChangeText={(text) => {
                      const newLogs = [...exerciseLogs];
                      newLogs[logIndex].sets[setIndex].rpe = text;
                      setExerciseLogs(newLogs);
                    }}
                    placeholder="RPE"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const newLogs = [...exerciseLogs];
                      newLogs[logIndex].sets[setIndex].success = !set.success;
                      setExerciseLogs(newLogs);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name={set.success ? 'checkmark.circle.fill' : 'circle'}
                      android_material_icon_name={set.success ? 'check_circle' : 'radio_button_unchecked'}
                      size={24}
                      color={set.success ? colors.success : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Session Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="How did the workout feel?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 14,
    color: colors.primary,
  },
  selectedWorkout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  suggestionBox: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 50,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.card,
  },
});
