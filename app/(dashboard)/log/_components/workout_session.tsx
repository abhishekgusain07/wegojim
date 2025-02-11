"use client"
import { useState, useEffect } from "react";
import { Plus, Dumbbell, Check, Timer, X, CalendarDays, RotateCcw, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateWorkoutInput, CreateExerciseInput, CreateSetInput, WorkoutWithExercises } from "@/utils/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { intervalToDuration } from "date-fns";
import { createWorkout } from "@/utils/data/workout/createWorkout";
import { fetchWorkouts } from "@/utils/data/workout/fetchWorkouts";

// Form Schemas
const addExerciseSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name is required"),
  notes: z.string().optional(),
});

const addSetSchema = z.object({
  reps: z.coerce.number().min(1, "Reps must be at least 1"),
  weight: z.coerce.number().min(0, "Weight cannot be negative"),
  notes: z.string().optional(),
});

type AddExerciseForm = z.infer<typeof addExerciseSchema>;
type AddSetForm = z.infer<typeof addSetSchema>;

interface ActiveWorkout extends Omit<CreateWorkoutInput, 'duration'> {
  exercises: (Omit<CreateExerciseInput, 'workoutId'> & {
    id: string;
    duration: number;
    sets: Omit<CreateSetInput, 'exerciseId'>[];
    isCompleted?: boolean;
  })[];
}

const WorkoutSession = () => {
  const [activeSession, setActiveSession] = useState<ActiveWorkout | null>(null);
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingWorkout, setSavingWorkout] = useState<boolean>(false);

  const exerciseForm = useForm<AddExerciseForm>({
    resolver: zodResolver(addExerciseSchema),
    defaultValues: {
      exerciseName: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchTodaysWorkouts();
  }, []);

  const fetchTodaysWorkouts = async () => {
    try {
      setIsLoading(true);
      const workouts = await fetchWorkouts();
      setTodaysWorkouts(workouts);
    } catch (error) {
      console.error('Failed to fetch today\'s workouts:', error);
      toast.error('Failed to load today\'s workouts');
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = () => {
    const now = new Date();
    setActiveSession({
      userId: "", // This will be filled with the actual user ID
      date: now,
      startTime: now,
      endTime: new Date(),
      notes: "",
      exercises: [],
    });
    toast.success("Workout Started");
  };

  const endSession = async () => {
    if (!activeSession) return;
    setSavingWorkout(true);
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - activeSession.startTime.getTime()) / 1000); // duration in seconds

    const workoutData: CreateWorkoutInput = {
      userId: activeSession.userId,
      date: activeSession.date,
      startTime: activeSession.startTime,
      endTime,
      duration,
      exercises: activeSession.exercises.map(exercise => ({
        exerciseName: exercise.exerciseName,
        duration: exercise.endTime.getTime() - exercise.startTime.getTime(),
        startTime: exercise.startTime,
        endTime: exercise.endTime,
        notes: exercise.notes,
        sets: exercise.sets.map((set, index) => ({
          setNumber: index + 1,
          reps: set.reps,
          weight: set.weight,
          notes: set.notes
        }))
      }))
    };

    if (
      !workoutData.exercises || 
      workoutData.exercises.length === 0 || 
      workoutData.exercises.some(exercise => !exercise.sets || exercise.sets.length === 0)
    ) {
      toast.error("cannot save empty workouts")
      setSavingWorkout(false);
      return;
    }

    
    try {
      console.log("Workout data to send:", workoutData)
      const workout = await createWorkout({workoutData})
      toast.success("Workout Saved");
      setActiveSession(null);
      await fetchTodaysWorkouts();
    } catch (error) {
      toast.error("Failed to save workout");
      console.error(error);
    }finally{
      setSavingWorkout(false);
    }
  };

  const restartSession = () => {
    const now = new Date();
    setActiveSession({
      userId: activeSession?.userId || "",
      date: now,
      startTime: now,
      endTime: new Date(),
      notes: "",
      exercises: [],
    });
    toast.success("Workout Restarted");
    exerciseForm.reset(); // Reset the exercise form
  };

  const onAddExercise = (data: AddExerciseForm) => {
    if (!activeSession) return;
    
    const now = new Date();
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            id: Date.now().toString(),
            exerciseName: data.exerciseName,
            startTime: now,
            endTime: now,
            duration: 0,
            sets: [],
            notes: data.notes || "",
            isCompleted: false,
          },
        ],
      };
    });
    exerciseForm.reset();
    toast.success(`Added ${data.exerciseName}`);
  };

  const addSet = (exerciseId: string, reps: number, weight: number, notes?: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
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
      };
    });
    toast.success(`Added set: ${reps} reps × ${weight}kg`);
  };

  const completeExercise = (exerciseId: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              endTime: new Date(),
              isCompleted: true,
            };
          }
          return ex;
        }),
      };
    });
    toast.success("Exercise completed!");
  };

  const deleteExercise = (exerciseId: string) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
      };
    });
    toast.success("Exercise deleted");
  };

  const deleteSet = (exerciseId: string, setIndex: number) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
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
      };
    });
    toast.success("Set deleted");
  };

  return (
    <div className="h-full w-full">
      {/* Mobile Header - Only visible on small screens */}
      <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Workout Log</h2>
          </div>
          {!activeSession && (
            <Button
              onClick={startSession}
              size="sm"
              className="bg-primary/10 hover:bg-primary/20 text-primary border-0"
            >
              <Timer className="w-4 h-4 mr-2" />
              New Workout
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 h-[calc(100%-4rem)] lg:h-full gap-4 lg:gap-6 p-4 lg:p-6">
        {/* Today's Workouts Section - Bottom on mobile, Left on desktop */}
        <div className={cn(
          "lg:col-span-2 h-full flex flex-col gap-4 order-2 lg:order-1",
          activeSession && "hidden lg:flex" // Hide on mobile when workout is active
        )}>
          <div className="hidden lg:flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Today's Progress</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todaysWorkouts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted/50 p-6 rounded-full">
                  <Dumbbell className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">No workouts recorded today</p>
                  <p className="text-sm text-muted-foreground">Start your first workout for today!</p>
                </div>
              </div>
            ) : (
              todaysWorkouts.map((workout) => (
                <Card key={workout.id} className="p-4 bg-gradient-to-br from-background/80 to-muted/30 shadow-lg rounded-lg transition-transform hover:scale-105">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{new Date(workout.startTime).toLocaleDateString()}</h3>
                    <p className="text-sm text-muted-foreground">Duration: {workout.duration} seconds</p>
                    <div className="mt-2">
                      {workout.exercises.map((exercise) => (
                        <div key={exercise.id} className="flex justify-between items-center border-b border-muted/30 py-2">
                          <span className="font-medium">{exercise.exerciseName}</span>
                          <span className="text-sm text-muted-foreground">{exercise.sets.length} sets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Active Workout Section - Top on mobile, Right on desktop */}
        <div className="lg:col-span-3 h-full order-1 lg:order-2 w-full">
          {!activeSession ? (
            <div className="h-full flex items-center justify-center">
              <Card className="w-full max-w-md p-6 lg:p-8 text-center space-y-6">
                <div className="relative mx-auto w-20 lg:w-24 h-20 lg:h-24">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                  <div className="relative bg-primary/20 w-full h-full rounded-full flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Ready to Train?</h1>
                  <p className="text-muted-foreground mt-2">Track your progress and crush your goals</p>
                </div>
                <Button
                  onClick={startSession}
                  size="lg"
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Start New Workout
                </Button>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4 lg:gap-6 min-w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl lg:text-2xl font-bold">Active Workout</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    Started at {activeSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 ">
                  <Button 
                    variant="outline"
                    onClick={restartSession}
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setActiveSession(null);
                      toast.success("Workout cancelled");
                    }}
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                  <Button 
                    onClick={endSession}
                    size="sm"
                    className="gap-2"
                    disabled={savingWorkout}
                  >
                    {savingWorkout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {savingWorkout ? "Saving" : "Finish"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Add Exercise Form */}
              <Card className="p-4">
                <Form {...exerciseForm}>
                  <form onSubmit={exerciseForm.handleSubmit(onAddExercise)} className="space-y-4">
                    <div className="flex gap-3">
                      <FormField
                        control={exerciseForm.control}
                        name="exerciseName"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Add a new exercise..."
                                {...field}
                                className="flex-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit"
                        className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    </div>
                    <FormField
                      control={exerciseForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Add notes for this exercie ..."
                              {...field}
                              className="bg-muted/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </Card>

              {/* Exercises List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {activeSession.exercises.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
                    <Plus className="w-8 h-8" />
                    <p>Add your first exercise to begin tracking</p>
                  </div>
                ) : (
                  activeSession.exercises.map((exercise, index) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onAddSet={(exerciseId, reps, weight, notes) => addSet(exerciseId, reps, weight, notes)}
                      onComplete={completeExercise}
                      onDelete={deleteExercise}
                      onDeleteSet={deleteSet}
                      isFirst={index === 0}
                    />
                  ))
                )}
              </div>

              {/* Mobile View History Button */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    // You'll need to add state management for this
                    // For now, we'll just hide/show based on activeSession
                  }}
                >
                  <CalendarDays className="w-4 h-4" />
                  View Today's History
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExerciseCard = ({
  exercise,
  onAddSet,
  onComplete,
  onDelete,
  onDeleteSet,
  isFirst,
}: {
  exercise: ActiveWorkout['exercises'][0] & { isCompleted?: boolean };
  onAddSet: (exerciseId: string, reps: number, weight: number, notes?: string) => void;
  onComplete: (exerciseId: string) => void;
  onDelete: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setIndex: number) => void;
  isFirst: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(!exercise.isCompleted);
  const form = useForm<AddSetForm>({
    resolver: zodResolver(addSetSchema),
    defaultValues: {
      reps: 0,
      weight: 0,
      notes: "",
    },
  });

  const handleAddSet = (data: AddSetForm) => {
    onAddSet(exercise.id, data.reps, data.weight, data.notes);
    form.reset({ reps: 0, weight: 0, notes: "" });
  };

  const duration = exercise.isCompleted 
    ? Math.round((exercise.endTime.getTime() - exercise.startTime.getTime()) / 1000)
    : Math.round((new Date().getTime() - exercise.startTime.getTime()) / 1000);

  const formattedDuration = intervalToDuration({ start: 0, end: duration * 1000 });
  const durationString = `${formattedDuration.hours !== undefined ? `${formattedDuration.hours}h ` : '0h '}${formattedDuration.minutes !== undefined ? `${formattedDuration.minutes}m ` : '0m '}${formattedDuration.seconds !== undefined ? `${formattedDuration.seconds}s` : '0s'}`;

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer",
        isFirst && "animate-slide-in",
        exercise.isCompleted && "opacity-80"
      )}
      onClick={() => exercise.isCompleted && setIsExpanded(!isExpanded)}
    >
      <div className="p-4 space-y-3">
        {/* Exercise Header - Always visible */}
        <div 
          className={cn(
            "flex flex-col gap-2",
            exercise.isCompleted && "cursor-pointer"
          )}
          onClick={(e) => {
            if (exercise.isCompleted) {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                exercise.isCompleted ? "bg-green-500" : "bg-primary"
              )}></div>
              <h3 className="font-semibold text-lg tracking-tight">{exercise.exerciseName}</h3>
            </div>
            <div className="flex items-center gap-2">
              {!exercise.isCompleted && (
                <Button
                  onClick={() => {
                    onComplete(exercise.id)
                    setIsExpanded(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Complete</span>
                </Button>
              )}
              <Button
                onClick={() => onDelete(exercise.id)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Exercise Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4" />
              <span>{exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              <span>{durationString}</span>
            </div>
            {exercise.isCompleted && (
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </div>

          {/* Exercise Notes */}
          {exercise.notes && (
            <p className="text-sm text-muted-foreground">{exercise.notes}</p>
          )}
        </div>

        {!exercise.isCompleted && (
          <div className="space-y-4">
            {/* Add Set Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSet)} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:pt-7">
                    <Button 
                      type="submit"
                      className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="sm:hidden">Add Set</span>
                    </Button>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="How did you feel in this set ? "
                          {...field}
                          className="bg-muted/50"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}

        {/* Sets History */}
        {isExpanded && exercise.sets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60"></div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                <span className="text-sm font-medium text-muted-foreground">Sets History</span>
              </div>
              <div className="h-px flex-1 bg-border/60"></div>
            </div>
            <div className="space-y-3">
              {exercise.sets.map((set, index) => (
                <div
                  key={index}
                  className="bg-card hover:bg-accent/50 transition-colors rounded-lg p-4 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-sm text-muted-foreground">Reps</span>
                            <p className="text-lg font-semibold">{set.reps}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Weight</span>
                            <p className="text-lg font-semibold text-primary">{set.weight}<span className="text-sm ml-1">kg</span></p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => onDeleteSet(exercise.id, index)}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {set.notes && (
                      <div className="pl-12">
                        <p className="text-sm text-muted-foreground">{set.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WorkoutSession;