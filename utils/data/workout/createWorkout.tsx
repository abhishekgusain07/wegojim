"use server";

import { db } from "@/db/drizzle";
import { exercises, sets, workouts } from "@/db/schema";
import { CreateWorkoutInput, Workout } from "@/utils/types";
import { auth } from "@clerk/nextjs/server";
import { uid } from "uid";
import { getUserIdFromClerkId } from "../user/getUserFromClerkId";

export const createWorkout = async ({workoutData}:{workoutData: CreateWorkoutInput}) => {
  try {
    const { userId:clerkId } = await auth();
    if (!clerkId) {
      throw new Error("User not found");
    }
    const userId = await getUserIdFromClerkId({ clerkId });
    if (!userId) {
      throw new Error("User not found");
    }
    const workout = await db.insert(workouts).values({
      id: uid(32),
      userId,
      date: new Date(workoutData.date),
      startTime: new Date(workoutData.startTime),
      endTime: new Date(workoutData.endTime),
      duration: workoutData.duration,
      notes: workoutData.notes || ''
    }).returning();

    //create exercises
    await Promise.all(workoutData.exercises.map(async (exercise: {exerciseName: string, startTime: Date, endTime: Date, duration: number, notes?: string, sets: {setNumber: number, reps: number, weight: number, notes?: string}[]}) => {
       const insertedExercise = await db.insert(exercises).values({
        id: uid(32),
        workoutId: workout[0].id,
        exerciseName: exercise.exerciseName,
        startTime: new Date(exercise.startTime),
        endTime: new Date(exercise.endTime),
        duration: exercise.duration,
        notes: exercise.notes
      }).returning()
      const insertedSets = await Promise.all(exercise.sets.map(async (set: {setNumber: number, reps: number, weight: number, notes?: string}) => {
        return db.insert(sets).values({
          id: uid(32),
          exerciseId: insertedExercise[0].id,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          notes: set.notes
        }).returning();
      }))
      return { ...insertedExercise[0], sets }
    }))

    return workout
  } catch (error: any) {
    throw new Error(error.message);
  }
};
