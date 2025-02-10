"use server";

import { db } from "@/db/drizzle";
import { workouts, exercises, sets } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getUserIdFromClerkId } from "../user/getUserFromClerkId";
import { eq, InferSelectModel } from "drizzle-orm";
import { WorkoutWithExercises } from "@/utils/types";


interface FlatQueryResult {
    workouts: {
      id: string;
      userId: string;
      date: string;
      createdAt: Date | null;
      startTime: Date;
      endTime: Date;
      duration: number;
      notes?: string | null;
    };
    exercises: {
      id: string;
      exerciseName: string;
      duration: number;
      startTime: Date;
      endTime: Date;
      notes?: string | null;
    };
    sets: {
      id: string;
      exerciseId: string;
      setNumber: number;
      reps: number;
      weight: number;
      notes?: string | null;
    };
  }

  type DrizzleJoinResult = {
    workouts: InferSelectModel<typeof workouts>;
    exercises: InferSelectModel<typeof exercises>;
    sets: InferSelectModel<typeof sets>;
  };
  
function transformWorkoutData(flatData:FlatQueryResult[]): WorkoutWithExercises[] {
    const workoutMap = new Map<string, WorkoutWithExercises>();
  
    flatData.forEach((row) => {
      const workoutId = row.workouts.id;
  
      // If workout doesn't exist in map, create it with empty exercises array
      if (!workoutMap.has(workoutId)) {
        workoutMap.set(workoutId, {
          ...row.workouts,
          exercises: []
        });
      }
  
      const workout = workoutMap.get(workoutId)!;
      const exerciseId = row.exercises.id;
  
      // Find existing exercise or create new one
      let exercise = workout.exercises.find(e => e.id === exerciseId);
      if (!exercise) {
        exercise = {
          ...row.exercises,
          sets: []
        };
        workout.exercises.push(exercise);
      }
  
      // Add set to exercise if it doesn't exist
      const setExists = exercise.sets.some(s => s.id === row.sets.id);
      if (!setExists) {
        exercise.sets.push(row.sets);
      }
    });
  
    // Sort sets by setNumber within each exercise
    for (const workout of workoutMap.values()) {
      workout.exercises.forEach(exercise => {
        exercise.sets.sort((a, b) => a.setNumber - b.setNumber);
      });
    }
  
    return Array.from(workoutMap.values());
  }
/**
 * Fetches workouts for the current user, along with their related exercises and sets.
 * 
 * @returns {Promise<WorkoutWithExercises[]>} An array of workouts with their related exercises and sets.
 */
export const fetchWorkouts = async (): Promise<WorkoutWithExercises[]> => {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            throw new Error("Unauthorized");
        }
        const userId = await getUserIdFromClerkId({ clerkId });
        if (!userId) {
            throw new Error("User not found");
        }

        const today = new Date();

        const res:FlatQueryResult[] = await db
            .select()
            .from(workouts)
            .where(eq(workouts.userId, userId) && eq(workouts.date, today.toISOString().split('T')[0]))
            .innerJoin(exercises, eq(exercises.workoutId, workouts.id))
            .innerJoin(sets, eq(sets.exerciseId, exercises.id)) as DrizzleJoinResult[];

        // Transform the result to match WorkoutWithExercises structure
        const workoutsWithExercises = transformWorkoutData(res);
        console.log("today workouts: ", workoutsWithExercises);
        return workoutsWithExercises;
    } catch (error) {
        console.error("Failed to fetch workouts:", error);
        throw error;
    }
};