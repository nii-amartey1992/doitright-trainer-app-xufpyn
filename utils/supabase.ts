
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Client = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  bodyfat_percentage?: number;
  activity_level?: string;
  goals?: string;
  weekly_training_days?: number;
  session_duration_minutes?: number;
  training_experience?: string;
  injuries?: string;
  training_location?: string;
  available_equipment?: string[];
  diet_type?: string;
  allergies?: string[];
  disliked_foods?: string[];
  target_weight_kg?: number;
  created_at?: string;
  updated_at?: string;
};

export type MealPlan = {
  id: string;
  client_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  created_at?: string;
};

export type MealPlanDay = {
  id: string;
  meal_plan_id: string;
  day_number: number;
  week_number: number;
  created_at?: string;
};

export type Meal = {
  id: string;
  meal_plan_day_id: string;
  meal_type: string;
  title: string;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  calories: number;
  created_at?: string;
};

export type WorkoutProgram = {
  id: string;
  client_id: string;
  split_type: string;
  created_at?: string;
};

export type WorkoutDay = {
  id: string;
  workout_program_id: string;
  day_number: number;
  week_number: number;
  focus: string;
  created_at?: string;
};

export type Exercise = {
  id: string;
  workout_day_id: string;
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  order_index: number;
  created_at?: string;
};

export type WorkoutSession = {
  id: string;
  client_id: string;
  workout_day_id?: string;
  session_date: string;
  notes?: string;
  created_at?: string;
};

export type SessionSet = {
  id: string;
  workout_session_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  success: boolean;
  created_at?: string;
};
