import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CreateWorkoutInput, CreateExerciseInput, CreateSetInput } from '@/utils/types'

export interface ActiveWorkout extends Omit<CreateWorkoutInput, 'duration'> {
  exercises: (Omit<CreateExerciseInput, 'workoutId'> & {
    id: string;
    duration: number;
    sets: Omit<CreateSetInput, 'exerciseId'>[];
    isCompleted?: boolean;
  })[];
}

interface WorkoutSessionState {
  activeSession: ActiveWorkout | null;
  startSession: () => void;
  endSession: () => void;
  restartSession: () => void;
  addExercise: (exerciseName: string, notes?: string) => void;
  addSet: (exerciseId: string, reps: number, weight: number, notes?: string) => void;
  completeExercise: (exerciseId: string) => void;
  deleteExercise: (exerciseId: string) => void;
  deleteSet: (exerciseId: string, setIndex: number) => void;
  clearSession: () => void;
}

// Helper function to ensure dates are Date objects
const ensureDateObjects = (session: ActiveWorkout | null): ActiveWorkout | null => {
  if (!session) return null;
  return {
    ...session,
    date: new Date(session.date),
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    exercises: session.exercises.map(exercise => ({
      ...exercise,
      startTime: new Date(exercise.startTime),
      endTime: new Date(exercise.endTime),
    })),
  };
};

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,

      startSession: () => {
        const now = new Date();
        set({
          activeSession: {
            userId: "", // This will be filled with the actual user ID
            date: now,
            startTime: now,
            endTime: now,
            notes: "",
            exercises: [],
          },
        });
      },

      endSession: () => {
        const session = get().activeSession;
        if (!session) return;
        
        const endTime = new Date();
        set((state) => ({
          activeSession: state.activeSession ? ensureDateObjects({
            ...state.activeSession,
            endTime,
          }) : null,
        }));
      },

      restartSession: () => {
        const now = new Date();
        set({
          activeSession: {
            userId: "", // This will be filled with the actual user ID
            date: now,
            startTime: now,
            endTime: now,
            notes: "",
            exercises: [],
          },
        });
      },

      addExercise: (exerciseName: string, notes?: string) => {
        const now = new Date();
        set((state) => {
          const currentSession = ensureDateObjects(state.activeSession);
          if (!currentSession) return state;
          
          return {
            activeSession: {
              ...currentSession,
              exercises: [
                ...currentSession.exercises,
                {
                  id: Date.now().toString(),
                  exerciseName,
                  startTime: now,
                  endTime: now,
                  duration: 0,
                  sets: [],
                  notes: notes || "",
                  isCompleted: false,
                },
              ],
            },
          };
        });
      },

      addSet: (exerciseId: string, reps: number, weight: number, notes?: string) => {
        set((state) => ({
          activeSession: state.activeSession ? ensureDateObjects({
            ...state.activeSession,
            exercises: state.activeSession.exercises.map((ex) => {
              if (ex.id === exerciseId) {
                const newSet = {
                  reps,
                  setNumber: ex.sets.length + 1,
                  weight,
                  notes,
                };
                
                return {
                  ...ex,
                  endTime: new Date(),
                  sets: [...ex.sets, newSet],
                };
              }
              return ex;
            }),
          }) : null,
        }));
      },

      completeExercise: (exerciseId: string) => {
        set((state) => ({
          activeSession: state.activeSession ? ensureDateObjects({
            ...state.activeSession,
            exercises: state.activeSession.exercises.map((ex) => {
              if (ex.id === exerciseId) {
                return {
                  ...ex,
                  endTime: new Date(),
                  isCompleted: true,
                };
              }
              return ex;
            }),
          }) : null,
        }));
      },

      deleteExercise: (exerciseId: string) => {
        set((state) => ({
          activeSession: state.activeSession ? ensureDateObjects({
            ...state.activeSession,
            exercises: state.activeSession.exercises.filter((ex) => ex.id !== exerciseId),
          }) : null,
        }));
      },

      deleteSet: (exerciseId: string, setIndex: number) => {
        set((state) => ({
          activeSession: state.activeSession ? ensureDateObjects({
            ...state.activeSession,
            exercises: state.activeSession.exercises.map((ex) => {
              if (ex.id === exerciseId) {
                const newSets = [...ex.sets];
                newSets.splice(setIndex, 1);
                return {
                  ...ex,
                  sets: newSets,
                };
              }
              return ex;
            }),
          }) : null,
        }));
      },

      clearSession: () => {
        set({ activeSession: null });
      },
    }),
    {
      name: 'workout-session-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeSession: state.activeSession }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeSession = ensureDateObjects(state.activeSession);
        }
      },
    }
  )
)