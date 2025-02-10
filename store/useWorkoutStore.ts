import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CreateWorkoutInput, CreateExerciseInput, CreateSetInput } from "@/utils/types";

interface ActiveWorkout extends Omit<CreateWorkoutInput, 'duration'> {
  exercises: (Omit<CreateExerciseInput, 'workoutId'> & {
    id: string;
    duration: number;
    sets: Omit<CreateSetInput, 'exerciseId'>[];
    isCompleted?: boolean;
  })[];
}

interface WorkoutState {
  activeSession: ActiveWorkout | null;
  lastSavedAt: string | null;
}

interface WorkoutActions {
  setActiveSession: (session: ActiveWorkout | null) => void;
  updateActiveSession: (updater: (prev: ActiveWorkout | null) => ActiveWorkout | null) => void;
  clearActiveSession: () => void;
}

type WorkoutStore = WorkoutState & WorkoutActions;

// Helper function to convert dates in an object from ISO strings to Date objects
const convertDatesToObjects = (obj: any): any => {
  if (!obj) return obj;
  
  const newObj = { ...obj };
  
  // Convert known date fields
  const dateFields = ['date', 'startTime', 'endTime'];
  dateFields.forEach(field => {
    if (newObj[field] && typeof newObj[field] === 'string') {
      newObj[field] = new Date(newObj[field]);
    }
  });
  
  // Convert dates in exercises array
  if (Array.isArray(newObj.exercises)) {
    newObj.exercises = newObj.exercises.map((exercise: any) => ({
      ...exercise,
      startTime: exercise.startTime ? new Date(exercise.startTime) : undefined,
      endTime: exercise.endTime ? new Date(exercise.endTime) : undefined,
    }));
  }
  
  return newObj;
};

// Helper function to convert dates in an object to ISO strings
const convertDatesToISOStrings = (obj: any): any => {
  if (!obj) return obj;
  
  const newObj = { ...obj };
  
  // Convert known date fields
  const dateFields = ['date', 'startTime', 'endTime'];
  dateFields.forEach(field => {
    if (newObj[field] instanceof Date) {
      newObj[field] = newObj[field].toISOString();
    }
  });
  
  // Convert dates in exercises array
  if (Array.isArray(newObj.exercises)) {
    newObj.exercises = newObj.exercises.map((exercise: any) => ({
      ...exercise,
      startTime: exercise.startTime instanceof Date ? exercise.startTime.toISOString() : undefined,
      endTime: exercise.endTime instanceof Date ? exercise.endTime.toISOString() : undefined,
    }));
  }
  
  return newObj;
};

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeSession: null,
      lastSavedAt: null,

      setActiveSession: (session) => 
        set({ 
          activeSession: session,
          lastSavedAt: new Date().toISOString()
        }),

      updateActiveSession: (updater) => 
        set(state => {
          const updatedSession = updater(state.activeSession);
          return { 
            activeSession: updatedSession,
            lastSavedAt: new Date().toISOString()
          };
        }),

      clearActiveSession: () => 
        set({ 
          activeSession: null,
          lastSavedAt: null
        }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSession: convertDatesToISOStrings(state.activeSession),
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeSession = convertDatesToObjects(state.activeSession);
        }
      },
      version: 1, // Add version for future migrations if needed
    }
  )
);

// Optional: Add a hook for debugging
if (process.env.NODE_ENV === 'development') {
  useWorkoutStore.subscribe((state) => {
    console.log('Workout Store Updated:', state);
  });
}