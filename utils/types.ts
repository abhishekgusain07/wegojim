import { z } from "zod";

export type userCreateProps = z.infer<typeof userCreateSchema>;

const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email" }).describe("user email"),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" })
    .min(3, { message: "First name is required" })
    .describe("user first name"),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" })
    .min(3, { message: "Last name is required" })
    .describe("user last name"),
  profile_image_url: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .describe("user profile image URL"),
  user_id: z.string().describe("user ID"),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .nonempty({ message: "Email is required" })
    .describe("user email"),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "First name must only contain letters" })
    .describe("user first name"),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: "Last name must only contain letters" })
    .describe("user last name"),
  profile_image_url: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .describe("user profile image URL"),
  user_id: z.string().describe("user ID"),
});

// Workout related types
export type Workout = {
  id: string;
  userId: string;
  date: Date;
  createdAt: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
};

export type Exercise = {
  id: string;
  workoutId: string;
  exerciseName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
};

export type Set = {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
  setNumber: number;
  notes?: string;
};

// Input types for creating new records
export type CreateWorkoutInput = Omit<Workout, 'id' | 'createdAt'> & {
  exercises: {
    exerciseName: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    notes?: string;
    sets: {
      setNumber: number;
      reps: number;
      weight: number;
      notes?: string;
    }[];
  }[];
};

export type CreateExerciseInput = Omit<Exercise, 'id'>;

export type CreateSetInput = Omit<Set, 'id'>;

// Relationship types
export type WorkoutWithExercises = Workout & {
  exercises: ExerciseWithSets[];
};

export type ExerciseWithSets = Exercise & {
  sets: Set[];
};
