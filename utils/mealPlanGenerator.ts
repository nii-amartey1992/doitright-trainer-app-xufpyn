
import { Client, MealPlan, MealPlanDay, Meal } from './supabase';

type MacroTargets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

const ACTIVITY_MULTIPLIERS: { [key: string]: number } = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const FOOD_DATABASE = [
  { name: 'Chicken Breast', protein: 31, carbs: 0, fats: 3.6, calories: 165, per: '100g' },
  { name: 'White Rice', protein: 2.7, carbs: 28, fats: 0.3, calories: 130, per: '100g' },
  { name: 'Eggs', protein: 13, carbs: 1.1, fats: 11, calories: 155, per: '2 eggs' },
  { name: 'Oats', protein: 13.2, carbs: 67, fats: 6.9, calories: 389, per: '100g' },
  { name: 'Sweet Potato', protein: 2, carbs: 20, fats: 0.1, calories: 86, per: '100g' },
  { name: 'Lean Beef', protein: 26, carbs: 0, fats: 15, calories: 250, per: '100g' },
  { name: 'Broccoli', protein: 2.8, carbs: 7, fats: 0.4, calories: 34, per: '100g' },
  { name: 'Banana', protein: 1.3, carbs: 27, fats: 0.3, calories: 105, per: '1 medium' },
  { name: 'Salmon', protein: 25, carbs: 0, fats: 13, calories: 208, per: '100g' },
  { name: 'Greek Yogurt', protein: 10, carbs: 3.6, fats: 0.4, calories: 59, per: '100g' },
  { name: 'Almonds', protein: 6, carbs: 6, fats: 14, calories: 164, per: '28g' },
  { name: 'Spinach', protein: 2.9, carbs: 3.6, fats: 0.4, calories: 23, per: '100g' },
  { name: 'Brown Rice', protein: 2.6, carbs: 23, fats: 0.9, calories: 111, per: '100g' },
  { name: 'Turkey Breast', protein: 29, carbs: 0, fats: 1, calories: 135, per: '100g' },
  { name: 'Apple', protein: 0.3, carbs: 25, fats: 0.3, calories: 95, per: '1 medium' },
];

export function calculateMacros(client: Client): MacroTargets {
  const weight = client.weight_kg || 70;
  const height = client.height_cm || 170;
  const age = client.dob ? new Date().getFullYear() - new Date(client.dob).getFullYear() : 30;
  const gender = client.gender?.toLowerCase() || 'male';
  const activityLevel = client.activity_level?.toLowerCase() || 'moderate';
  const goal = client.goals?.toLowerCase() || 'maintenance';

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Calculate TDEE
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  let tdee = bmr * activityMultiplier;

  // Adjust for goals
  let calories = tdee;
  if (goal.includes('loss') || goal.includes('cut')) {
    calories = tdee * 0.8; // -20%
  } else if (goal.includes('gain') || goal.includes('bulk')) {
    calories = tdee * 1.125; // +12.5%
  }

  // Calculate macros
  const protein_g = weight * 2.0; // 2g per kg
  const fats_g = (calories * 0.275) / 9; // 27.5% of calories
  const carbs_g = (calories - (protein_g * 4 + fats_g * 9)) / 4;

  return {
    calories: Math.round(calories),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fats_g: Math.round(fats_g),
  };
}

function generateMeal(
  mealType: string,
  targetProtein: number,
  targetCarbs: number,
  targetFats: number
): Meal {
  const foods: typeof FOOD_DATABASE = [];
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  let totalCalories = 0;

  // Select foods based on meal type
  if (mealType === 'Breakfast') {
    foods.push(FOOD_DATABASE.find(f => f.name === 'Eggs')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Oats')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Banana')!);
  } else if (mealType === 'Lunch') {
    foods.push(FOOD_DATABASE.find(f => f.name === 'Chicken Breast')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Brown Rice')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Broccoli')!);
  } else if (mealType === 'Dinner') {
    foods.push(FOOD_DATABASE.find(f => f.name === 'Salmon')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Sweet Potato')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Spinach')!);
  } else if (mealType === 'Snack 1') {
    foods.push(FOOD_DATABASE.find(f => f.name === 'Greek Yogurt')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Almonds')!);
  } else if (mealType === 'Snack 2') {
    foods.push(FOOD_DATABASE.find(f => f.name === 'Turkey Breast')!);
    foods.push(FOOD_DATABASE.find(f => f.name === 'Apple')!);
  }

  foods.forEach(food => {
    totalProtein += food.protein;
    totalCarbs += food.carbs;
    totalFats += food.fats;
    totalCalories += food.calories;
  });

  const title = foods.map(f => f.name).join(', ');

  return {
    id: '',
    meal_plan_day_id: '',
    meal_type: mealType,
    title,
    protein_g: Math.round(totalProtein),
    carbs_g: Math.round(totalCarbs),
    fats_g: Math.round(totalFats),
    calories: Math.round(totalCalories),
  };
}

export function generateDailyMeals(macros: MacroTargets): Omit<Meal, 'id' | 'meal_plan_day_id'>[] {
  const mealsPerDay = 5;
  const mealTypes = ['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner'];
  
  const proteinPerMeal = macros.protein_g / mealsPerDay;
  const carbsPerMeal = macros.carbs_g / mealsPerDay;
  const fatsPerMeal = macros.fats_g / mealsPerDay;

  return mealTypes.map(mealType => {
    const meal = generateMeal(mealType, proteinPerMeal, carbsPerMeal, fatsPerMeal);
    return {
      meal_type: meal.meal_type,
      title: meal.title,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      calories: meal.calories,
    };
  });
}
