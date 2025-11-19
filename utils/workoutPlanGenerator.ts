
import { Client, WorkoutDay, Exercise } from './supabase';

type WorkoutTemplate = {
  focus: string;
  exercises: Omit<Exercise, 'id' | 'workout_day_id' | 'created_at'>[];
};

const PUSH_WORKOUT: WorkoutTemplate = {
  focus: 'Push',
  exercises: [
    { name: 'Barbell Bench Press', sets: 4, reps: '8-10', notes: 'Compound movement', order_index: 0 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', notes: 'Upper chest focus', order_index: 1 },
    { name: 'Overhead Press', sets: 4, reps: '8-10', notes: 'Shoulder compound', order_index: 2 },
    { name: 'Lateral Raises', sets: 3, reps: '12-15', notes: 'Side delts', order_index: 3 },
    { name: 'Tricep Dips', sets: 3, reps: '10-12', notes: 'Bodyweight or weighted', order_index: 4 },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', notes: 'Cable isolation', order_index: 5 },
  ],
};

const PULL_WORKOUT: WorkoutTemplate = {
  focus: 'Pull',
  exercises: [
    { name: 'Pull-ups', sets: 4, reps: '8-10', notes: 'Assisted if needed', order_index: 0 },
    { name: 'Barbell Rows', sets: 4, reps: '8-10', notes: 'Back thickness', order_index: 1 },
    { name: 'Lat Pulldowns', sets: 3, reps: '10-12', notes: 'Back width', order_index: 2 },
    { name: 'Face Pulls', sets: 3, reps: '15-20', notes: 'Rear delts', order_index: 3 },
    { name: 'Barbell Curls', sets: 3, reps: '10-12', notes: 'Bicep mass', order_index: 4 },
    { name: 'Hammer Curls', sets: 3, reps: '12-15', notes: 'Brachialis focus', order_index: 5 },
  ],
};

const LEGS_WORKOUT: WorkoutTemplate = {
  focus: 'Legs',
  exercises: [
    { name: 'Barbell Squat', sets: 4, reps: '8-10', notes: 'King of exercises', order_index: 0 },
    { name: 'Romanian Deadlift', sets: 4, reps: '8-10', notes: 'Hamstring focus', order_index: 1 },
    { name: 'Leg Press', sets: 3, reps: '12-15', notes: 'Quad volume', order_index: 2 },
    { name: 'Walking Lunges', sets: 3, reps: '12 each', notes: 'Unilateral work', order_index: 3 },
    { name: 'Leg Curls', sets: 3, reps: '12-15', notes: 'Hamstring isolation', order_index: 4 },
    { name: 'Calf Raises', sets: 4, reps: '15-20', notes: 'Standing or seated', order_index: 5 },
  ],
};

const UPPER_WORKOUT: WorkoutTemplate = {
  focus: 'Upper Body',
  exercises: [
    { name: 'Bench Press', sets: 4, reps: '8-10', notes: 'Chest compound', order_index: 0 },
    { name: 'Barbell Rows', sets: 4, reps: '8-10', notes: 'Back compound', order_index: 1 },
    { name: 'Overhead Press', sets: 3, reps: '8-10', notes: 'Shoulders', order_index: 2 },
    { name: 'Pull-ups', sets: 3, reps: '8-10', notes: 'Back width', order_index: 3 },
    { name: 'Dumbbell Curls', sets: 3, reps: '10-12', notes: 'Biceps', order_index: 4 },
    { name: 'Tricep Extensions', sets: 3, reps: '10-12', notes: 'Triceps', order_index: 5 },
  ],
};

const LOWER_WORKOUT: WorkoutTemplate = {
  focus: 'Lower Body',
  exercises: [
    { name: 'Squat', sets: 4, reps: '8-10', notes: 'Quad focus', order_index: 0 },
    { name: 'Deadlift', sets: 4, reps: '6-8', notes: 'Posterior chain', order_index: 1 },
    { name: 'Leg Press', sets: 3, reps: '12-15', notes: 'Volume work', order_index: 2 },
    { name: 'Leg Curls', sets: 3, reps: '12-15', notes: 'Hamstrings', order_index: 3 },
    { name: 'Leg Extensions', sets: 3, reps: '12-15', notes: 'Quad isolation', order_index: 4 },
    { name: 'Calf Raises', sets: 4, reps: '15-20', notes: 'Calves', order_index: 5 },
  ],
};

const FULL_BODY_WORKOUT: WorkoutTemplate = {
  focus: 'Full Body',
  exercises: [
    { name: 'Squat', sets: 3, reps: '8-10', notes: 'Lower body compound', order_index: 0 },
    { name: 'Bench Press', sets: 3, reps: '8-10', notes: 'Upper body push', order_index: 1 },
    { name: 'Barbell Rows', sets: 3, reps: '8-10', notes: 'Upper body pull', order_index: 2 },
    { name: 'Overhead Press', sets: 3, reps: '8-10', notes: 'Shoulders', order_index: 3 },
    { name: 'Romanian Deadlift', sets: 3, reps: '10-12', notes: 'Hamstrings', order_index: 4 },
    { name: 'Pull-ups', sets: 3, reps: '8-10', notes: 'Back', order_index: 5 },
  ],
};

export function generateWorkoutPlan(
  client: Client,
  splitType: string
): WorkoutTemplate[] {
  const trainingDays = client.weekly_training_days || 4;
  const templates: WorkoutTemplate[] = [];

  if (splitType === 'Push/Pull/Legs') {
    // PPL typically runs 6 days or 3 days
    if (trainingDays >= 6) {
      templates.push(PUSH_WORKOUT, PULL_WORKOUT, LEGS_WORKOUT, PUSH_WORKOUT, PULL_WORKOUT, LEGS_WORKOUT);
    } else {
      templates.push(PUSH_WORKOUT, PULL_WORKOUT, LEGS_WORKOUT);
    }
  } else if (splitType === 'Upper/Lower') {
    // Upper/Lower typically 4 days
    if (trainingDays >= 4) {
      templates.push(UPPER_WORKOUT, LOWER_WORKOUT, UPPER_WORKOUT, LOWER_WORKOUT);
    } else {
      templates.push(UPPER_WORKOUT, LOWER_WORKOUT);
    }
  } else if (splitType === 'Full Body') {
    // Full body 3-4 days
    for (let i = 0; i < Math.min(trainingDays, 4); i++) {
      templates.push(FULL_BODY_WORKOUT);
    }
  }

  return templates;
}

export function assignWorkoutsTo28Days(
  templates: WorkoutTemplate[],
  trainingDays: number
): { dayNumber: number; weekNumber: number; template: WorkoutTemplate }[] {
  const schedule: { dayNumber: number; weekNumber: number; template: WorkoutTemplate }[] = [];
  let templateIndex = 0;

  for (let week = 1; week <= 4; week++) {
    let workoutsThisWeek = 0;
    for (let day = 1; day <= 7; day++) {
      if (workoutsThisWeek < trainingDays) {
        const dayNumber = (week - 1) * 7 + day;
        schedule.push({
          dayNumber,
          weekNumber: week,
          template: templates[templateIndex % templates.length],
        });
        templateIndex++;
        workoutsThisWeek++;
      }
    }
  }

  return schedule;
}
