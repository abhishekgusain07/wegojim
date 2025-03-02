"use server"
import { sql } from "drizzle-orm";
import { exercises, sets, workouts } from "../../../db/schema"
import { db } from "@/db/drizzle";

/**
 * Get progress for a specific exercise over time
 * @param userId The user ID
 * @param exerciseName The exact exercise name to track
 * @param limit Optional limit for number of workouts to retrieve
 */
export async function getExerciseProgress({ userId, exerciseName, limit = 10}:{
    userId: string;
    exerciseName: string;
    limit ?: number
}) {
  // Get all workouts where this exercise was performed
  const results = await db
    .select({
      date: workouts.date,
      workoutId: workouts.id,
      exerciseId: exercises.id,
      reps: sets.reps,
      weight: sets.weight,
      setNumber: sets.setNumber
    })
    .from(workouts)
    .innerJoin(exercises, sql`${exercises.workoutId} = ${workouts.id}`)
    .innerJoin(sets, sql`${sets.exerciseId} = ${exercises.id}`)
    .where(sql`${workouts.userId} = ${userId} AND LOWER(${exercises.exerciseName}) = LOWER(${exerciseName})`)
    .orderBy(sql`${workouts.date} DESC`)
    .limit(limit);
  
  // Process results to get meaningful statistics per workout
  const workoutStats = [];
  const workoutMap = new Map();
  
  for (const row of results) {
    if (!workoutMap.has(row.workoutId)) {
      workoutMap.set(row.workoutId, {
        date: row.date,
        sets: [],
        maxWeight: 0,
        totalVolume: 0, // weight × reps
        maxOneRepMax: 0 // estimated 1RM
      });
    }
    
    const workout = workoutMap.get(row.workoutId);
    workout.sets.push({
      reps: row.reps,
      weight: row.weight,
      setNumber: row.setNumber
    });
    

    if (row.weight > workout.maxWeight) {
      workout.maxWeight = row.weight;
    }
    

    workout.totalVolume += row.weight * row.reps;
    
    
    if (row.reps <= 10) { // Formula becomes less accurate with higher reps
      const oneRepMax = row.weight * (36 / (37 - row.reps));
      if (oneRepMax > workout.maxOneRepMax) {
        workout.maxOneRepMax = oneRepMax;
      }
    }
  }
  
  // Convert map to array for return
  for (const [workoutId, stats] of workoutMap.entries()) {
    workoutStats.push({
      workoutId,
      ...stats
    });
  }
  
  return workoutStats;
}

/**
 * Function to normalize exercise names for better matching
 * @param exerciseName The original exercise name input
 */
function normalizeExerciseName(exerciseName:string) {
  // Convert to lowercase
  let normalized = exerciseName.toLowerCase();
  
  // Remove common filler words
  normalized = normalized.replace(/\b(the|with|using|on|at|for)\b/g, '');
  
  // Standardize common variations
  const variations = {
    'bench': 'bench press',
    'bp': 'bench press',
    'ohp': 'overhead press',
    'dl': 'deadlift',
    'sqt': 'squat',
    'pullup': 'pull-up',
    'chinup': 'chin-up'
  };
  
  // Replace known variations
  for (const [short, full] of Object.entries(variations)) {
    // Match as whole word with word boundary
    const regex = new RegExp(`\\b${short}\\b`, 'g');
    normalized = normalized.replace(regex, full);
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Search for exercise progress with fuzzy name matching
 * @param userId The user ID
 * @param exerciseNameQuery The approximate exercise name to search
 */
export async function searchExerciseProgress({userId, exerciseNameQuery}:{
    userId: string;
    exerciseNameQuery: string;
}) {
  const normalizedQuery = normalizeExerciseName(exerciseNameQuery);
  
  // Get all unique exercise names this user has used
  const exerciseNames = await db
    .selectDistinct({
      name: exercises.exerciseName
    })
    .from(exercises)
    .innerJoin(workouts, sql`${exercises.workoutId} = ${workouts.id}`)
    .where(sql`${workouts.userId} = ${userId}`);
  
  // Find closest matches
  const matches = exerciseNames
    .map(e => ({
      original: e.name,
      normalized: normalizeExerciseName(e.name),
      // Calculate simple similarity score (higher = more similar)
      similarity: calculateSimilarity(normalizedQuery, normalizeExerciseName(e.name))
    }))
    .filter(e => e.similarity > 0.6) // Keep only reasonably similar names
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Get top 5 matches
  
  // Return progress for top match if found
  if (matches.length > 0) {
    return {
      bestMatch: matches[0].original,
      otherMatches: matches.slice(1).map(m => m.original),
      progress: await getExerciseProgress({userId, exerciseName:matches[0].original})
    };
  }
  
  return {
    bestMatch: null,
    otherMatches: [],
    progress: []
  };
}

/**
 * Calculate similarity between two strings (0-1 scale)
 * This is a simple implementation - consider using a library like string-similarity in production
 */
function calculateSimilarity(str1: string, str2:string) {
  // Simple case - exact match
  if (str1 === str2) return 1;
  
  // Simple case - one is substring of the other
  if (str1.includes(str2)) return 0.9;
  if (str2.includes(str1)) return 0.9;
  
  // Count common words
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  
  // Calculate Jaccard similarity (intersection over union)
  const uniqueWords = new Set([...words1, ...words2]);
  return commonWords.length / uniqueWords.size;
}