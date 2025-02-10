"use client"

import { useState } from "react"
import { Plus, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from "framer-motion"

const exercises = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row"]

interface ExerciseFormProps {
  onExerciseComplete: (exercise: {
    id: string
    name: string
    sets: Array<{ reps: string; weight: string }>
  }) => void
}

export default function ExerciseForm({ onExerciseComplete }: ExerciseFormProps) {
  const [sets, setSets] = useState([{ reps: "", weight: "" }])
  const [selectedExercise, setSelectedExercise] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const addSet = () => {
    setSets([...sets, { reps: "", weight: "" }])
  }

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (selectedExercise && sets.some((set) => set.reps && set.weight)) {
      onExerciseComplete({
        id: Date.now().toString(),
        name: selectedExercise,
        sets: sets,
      })
      setSelectedExercise("")
      setSets([{ reps: "", weight: "" }])
    }
  }

  return (
    <Card className="overflow-hidden bg-[#1E293B]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Log Exercise</h2>

        <div className="space-y-4">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-[#0F172A] text-left hover:bg-[#1E293B]">
                {selectedExercise || "Select exercise..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search exercises..." className="border-none focus:ring-0" />
                <CommandList>
                  <CommandEmpty>No exercises found.</CommandEmpty>
                  <CommandGroup>
                    {exercises.map((exercise) => (
                      <CommandItem
                        key={exercise}
                        onSelect={() => {
                          setSelectedExercise(exercise)
                          setIsOpen(false)
                        }}
                        className="cursor-pointer"
                      >
                        {exercise}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <AnimatePresence>
            {selectedExercise && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {sets.map((set, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F172A] text-sm font-medium text-[#00FF88]">
                      #{index + 1}
                    </div>
                    <Input
                      type="number"
                      placeholder="Reps"
                      className="bg-[#0F172A] transition-colors focus:border-[#00FF88]"
                      value={set.reps}
                      onChange={(e) => {
                        const newSets = [...sets]
                        newSets[index].reps = e.target.value
                        setSets(newSets)
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Weight"
                      className="bg-[#0F172A] transition-colors focus:border-[#00FF88]"
                      value={set.weight}
                      onChange={(e) => {
                        const newSets = [...sets]
                        newSets[index].weight = e.target.value
                        setSets(newSets)
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(index)}
                      className="hover:bg-red-500/10 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {selectedExercise && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-dashed hover:border-[#00FF88] hover:text-[#00FF88]"
                onClick={addSet}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Set
              </Button>

              <Button className="w-full bg-[#00FF88] text-[#0F172A] hover:bg-[#00FF88]/90" onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Save Exercise
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Card>
  )
}

