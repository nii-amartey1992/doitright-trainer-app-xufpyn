
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Client, supabase, WorkoutProgram, WorkoutDay, Exercise } from '@/utils/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { generateWorkoutPlan, assignWorkoutsTo28Days } from '@/utils/workoutPlanGenerator';

type Props = {
  client: Client;
};

export default function ClientWorkoutPlan({ client }: Props) {
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<{ [key: number]: { day: WorkoutDay; exercises: Exercise[] } }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutProgram();
  }, []);

  async function loadWorkoutProgram() {
    try {
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (programError && programError.code !== 'PGRST116') {
        console.error('Error loading workout program:', programError);
      } else if (programData) {
        setProgram(programData);
        await loadWorkoutsForWeek(programData.id, selectedWeek);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkoutsForWeek(programId: string, week: number) {
    try {
      const { data: daysData, error: daysError } = await supabase
        .from('workout_days')
        .select('*')
        .eq('workout_program_id', programId)
        .eq('week_number', week);

      if (daysError) {
        console.error('Error loading workout days:', daysError);
        return;
      }

      const workoutsMap: { [key: number]: { day: WorkoutDay; exercises: Exercise[] } } = {};
      
      for (const day of daysData || []) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_day_id', day.id)
          .order('order_index');

        if (!exercisesError && exercisesData) {
          workoutsMap[day.day_number] = {
            day,
            exercises: exercisesData,
          };
        }
      }

      setWorkouts(workoutsMap);
    } catch (err) {
      console.error('Error loading workouts:', err);
    }
  }

  async function generateWorkoutProgram(splitType: string) {
    try {
      setLoading(true);
      
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .insert([{
          client_id: client.id,
          split_type: splitType,
        }])
        .select()
        .single();

      if (programError) {
        console.error('Error creating workout program:', programError);
        Alert.alert('Error', 'Failed to generate workout program');
        return;
      }

      const templates = generateWorkoutPlan(client, splitType);
      const schedule = assignWorkoutsTo28Days(templates, client.weekly_training_days || 4);

      for (const item of schedule) {
        const { data: dayData, error: dayError } = await supabase
          .from('workout_days')
          .insert([{
            workout_program_id: programData.id,
            day_number: item.dayNumber,
            week_number: item.weekNumber,
            focus: item.template.focus,
          }])
          .select()
          .single();

        if (dayError) {
          console.error('Error creating workout day:', dayError);
          continue;
        }

        const exercisesToInsert = item.template.exercises.map(ex => ({
          ...ex,
          workout_day_id: dayData.id,
        }));

        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert);

        if (exercisesError) {
          console.error('Error creating exercises:', exercisesError);
        }
      }

      Alert.alert('Success', '28-day workout program generated!');
      await loadWorkoutProgram();
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to generate workout program');
    } finally {
      setLoading(false);
    }
  }

  function showSplitSelector() {
    Alert.alert(
      'Select Training Split',
      'Choose a workout split for this client',
      [
        { text: 'Push/Pull/Legs', onPress: () => generateWorkoutProgram('Push/Pull/Legs') },
        { text: 'Upper/Lower', onPress: () => generateWorkoutProgram('Upper/Lower') },
        { text: 'Full Body', onPress: () => generateWorkoutProgram('Full Body') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="dumbbell.fill"
            android_material_icon_name="fitness_center"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No workout program yet</Text>
          <Text style={styles.emptySubtext}>Generate a 28-day workout program for this client</Text>
          <TouchableOpacity style={styles.generateButton} onPress={showSplitSelector}>
            <Text style={styles.generateButtonText}>Generate Workout Program</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const weekDays = Object.keys(workouts)
    .map(Number)
    .filter(day => Math.ceil(day / 7) === selectedWeek)
    .sort((a, b) => a - b);

  return (
    <View style={styles.container}>
      <View style={styles.programCard}>
        <Text style={styles.programTitle}>{program.split_type}</Text>
        <Text style={styles.programSubtitle}>
          {client.weekly_training_days} days per week • {client.session_duration_minutes} min sessions
        </Text>
      </View>

      <View style={styles.weekSelector}>
        {[1, 2, 3, 4].map((week) => (
          <TouchableOpacity
            key={week}
            style={[styles.weekButton, selectedWeek === week && styles.weekButtonActive]}
            onPress={() => {
              setSelectedWeek(week);
              setSelectedDay(null);
              loadWorkoutsForWeek(program.id, week);
            }}
          >
            <Text style={[styles.weekButtonText, selectedWeek === week && styles.weekButtonTextActive]}>
              Week {week}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {weekDays.length === 0 ? (
          <Text style={styles.emptyText}>No workouts this week</Text>
        ) : (
          weekDays.map((dayNumber, index) => {
            const workout = workouts[dayNumber];
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayCard}
                onPress={() => setSelectedDay(selectedDay === dayNumber ? null : dayNumber)}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayTitle}>Day {dayNumber}</Text>
                    <Text style={styles.dayFocus}>{workout.day.focus}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name={selectedDay === dayNumber ? 'chevron.up' : 'chevron.down'}
                    android_material_icon_name={selectedDay === dayNumber ? 'expand_less' : 'expand_more'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </View>
                
                {selectedDay === dayNumber && (
                  <View style={styles.exercisesContainer}>
                    {workout.exercises.map((exercise, exIndex) => (
                      <View key={exIndex} style={styles.exerciseItem}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                        {exercise.notes && (
                          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  programCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  programSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weekSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  weekButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  weekButtonTextActive: {
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dayFocus: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  exercisesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
