
import { SessionSet } from './supabase';

type OverloadSuggestion = {
  suggestedWeight: number;
  reason: string;
  lastWeight: number;
};

export function calculateProgressiveOverload(
  exerciseName: string,
  recentSessions: SessionSet[][]
): OverloadSuggestion {
  if (recentSessions.length === 0) {
    return {
      suggestedWeight: 20,
      reason: 'First session - start with a moderate weight',
      lastWeight: 0,
    };
  }

  const lastSession = recentSessions[0];
  const avgWeight = lastSession.reduce((sum, set) => sum + set.weight_kg, 0) / lastSession.length;
  const avgRPE = lastSession.reduce((sum, set) => sum + (set.rpe || 7), 0) / lastSession.length;
  const successRate = lastSession.filter(set => set.success).length / lastSession.length;

  let suggestedWeight = avgWeight;
  let reason = '';

  if (successRate >= 1.0 && avgRPE <= 7) {
    // All sets completed with RPE ≤ 7 → increase 2.5-5%
    suggestedWeight = avgWeight * 1.025;
    reason = 'All sets completed with low RPE - increase weight';
  } else if (successRate >= 1.0 && avgRPE >= 8) {
    // All sets completed with RPE 8-9 → maintain or small increase
    suggestedWeight = avgWeight * 1.0125;
    reason = 'All sets completed but high RPE - small increase';
  } else if (successRate < 0.5) {
    // Failed ≥50% sets → deload 5-10%
    suggestedWeight = avgWeight * 0.925;
    reason = 'Failed most sets - deload weight';
  } else {
    // Maintain weight
    suggestedWeight = avgWeight;
    reason = 'Maintain current weight';
  }

  // Round to nearest 2.5kg
  suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

  return {
    suggestedWeight,
    reason,
    lastWeight: Math.round(avgWeight * 10) / 10,
  };
}
