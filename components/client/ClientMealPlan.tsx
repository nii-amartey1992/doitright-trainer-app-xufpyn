
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
import { Client, supabase, MealPlan, MealPlanDay, Meal } from '@/utils/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { calculateMacros, generateDailyMeals } from '@/utils/mealPlanGenerator';

type Props = {
  client: Client;
};

export default function ClientMealPlan({ client }: Props) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [meals, setMeals] = useState<{ [key: number]: Meal[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealPlan();
  }, []);

  async function loadMealPlan() {
    try {
      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error loading meal plan:', planError);
      } else if (planData) {
        setMealPlan(planData);
        await loadMealsForWeek(planData.id, selectedWeek);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMealsForWeek(planId: string, week: number) {
    try {
      const { data: daysData, error: daysError } = await supabase
        .from('meal_plan_days')
        .select('*')
        .eq('meal_plan_id', planId)
        .eq('week_number', week);

      if (daysError) {
        console.error('Error loading meal plan days:', daysError);
        return;
      }

      const mealsMap: { [key: number]: Meal[] } = {};
      
      for (const day of daysData || []) {
        const { data: mealsData, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('meal_plan_day_id', day.id);

        if (!mealsError && mealsData) {
          mealsMap[day.day_number] = mealsData;
        }
      }

      setMeals(mealsMap);
    } catch (err) {
      console.error('Error loading meals:', err);
    }
  }

  async function generateMealPlan() {
    try {
      setLoading(true);
      const macros = calculateMacros(client);

      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .insert([{
          client_id: client.id,
          calories: macros.calories,
          protein_g: macros.protein_g,
          carbs_g: macros.carbs_g,
          fats_g: macros.fats_g,
        }])
        .select()
        .single();

      if (planError) {
        console.error('Error creating meal plan:', planError);
        Alert.alert('Error', 'Failed to generate meal plan');
        return;
      }

      for (let week = 1; week <= 4; week++) {
        for (let dayInWeek = 1; dayInWeek <= 7; dayInWeek++) {
          const dayNumber = (week - 1) * 7 + dayInWeek;
          
          const { data: dayData, error: dayError } = await supabase
            .from('meal_plan_days')
            .insert([{
              meal_plan_id: planData.id,
              day_number: dayNumber,
              week_number: week,
            }])
            .select()
            .single();

          if (dayError) {
            console.error('Error creating meal plan day:', dayError);
            continue;
          }

          const dailyMeals = generateDailyMeals(macros);
          const mealsToInsert = dailyMeals.map(meal => ({
            ...meal,
            meal_plan_day_id: dayData.id,
          }));

          const { error: mealsError } = await supabase
            .from('meals')
            .insert(mealsToInsert);

          if (mealsError) {
            console.error('Error creating meals:', mealsError);
          }
        }
      }

      Alert.alert('Success', '28-day meal plan generated!');
      await loadMealPlan();
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (!mealPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="fork.knife"
            android_material_icon_name="restaurant"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No meal plan yet</Text>
          <Text style={styles.emptySubtext}>Generate a 28-day meal plan for this client</Text>
          <TouchableOpacity style={styles.generateButton} onPress={generateMealPlan}>
            <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => (selectedWeek - 1) * 7 + i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.macrosCard}>
        <Text style={styles.macrosTitle}>Daily Targets</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{mealPlan.calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{mealPlan.protein_g}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{mealPlan.carbs_g}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{mealPlan.fats_g}g</Text>
            <Text style={styles.macroLabel}>Fats</Text>
          </View>
        </View>
      </View>

      <View style={styles.weekSelector}>
        {[1, 2, 3, 4].map((week) => (
          <TouchableOpacity
            key={week}
            style={[styles.weekButton, selectedWeek === week && styles.weekButtonActive]}
            onPress={() => {
              setSelectedWeek(week);
              setSelectedDay(null);
              loadMealsForWeek(mealPlan.id, week);
            }}
          >
            <Text style={[styles.weekButtonText, selectedWeek === week && styles.weekButtonTextActive]}>
              Week {week}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {weekDays.map((dayNumber, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayCard}
            onPress={() => setSelectedDay(selectedDay === dayNumber ? null : dayNumber)}
          >
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>Day {dayNumber}</Text>
              <IconSymbol
                ios_icon_name={selectedDay === dayNumber ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={selectedDay === dayNumber ? 'expand_less' : 'expand_more'}
                size={24}
                color={colors.textSecondary}
              />
            </View>
            
            {selectedDay === dayNumber && meals[dayNumber] && (
              <View style={styles.mealsContainer}>
                {meals[dayNumber].map((meal, mealIndex) => (
                  <View key={mealIndex} style={styles.mealItem}>
                    <Text style={styles.mealType}>{meal.meal_type}</Text>
                    <Text style={styles.mealTitle}>{meal.title}</Text>
                    <View style={styles.mealMacros}>
                      <Text style={styles.mealMacroText}>P: {meal.protein_g}g</Text>
                      <Text style={styles.mealMacroText}>C: {meal.carbs_g}g</Text>
                      <Text style={styles.mealMacroText}>F: {meal.fats_g}g</Text>
                      <Text style={styles.mealMacroText}>{meal.calories} cal</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
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
  macrosCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
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
  mealsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mealItem: {
    marginBottom: 16,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  mealMacroText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
