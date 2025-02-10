import { relations } from "drizzle-orm";
import { 
  pgTable, 
  serial, 
  text, 
  timestamp,
  integer,
  date,
  real 
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  createdTime: timestamp("created_time").defaultNow(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  profileImageUrl: text("profile_image_url"),
  clerkId: text("user_id").unique(),
  subscription: text("subscription"),
  credits: text("credits"),
});


export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  createdTime: timestamp("created_time").defaultNow(),
  subscriptionId: text("subscription_id"),
  stripeUserId: text("stripe_user_id"),
  status: text("status"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  planId: text("plan_id"),
  defaultPaymentMethodId: text("default_payment_method_id"),
  email: text("email"),
  userId: text("user_id"),
});

export const subscriptionPlans = pgTable("subscriptions_plans", {
  id: text("id").primaryKey(),
  createdTime: timestamp("created_time").defaultNow(),
  planId: text("plan_id"),
  name: text("name"),
  description: text("description"),
  amount: text("amount"),
  currency: text("currency"),
  interval: text("interval"),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  createdTime: timestamp("created_time").defaultNow(),
  invoiceId: text("invoice_id"),
  subscriptionId: text("subscription_id"),
  amountPaid: text("amount_paid"),
  amountDue: text("amount_due"),
  currency: text("currency"),
  status: text("status"),
  email: text("email"),
  userId: text("user_id"),
});

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
}));

export const workouts = pgTable("workouts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(),
  notes: text("notes"),
});

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
}));

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id),
  exerciseName: text("exercise_name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(),
  notes: text("notes"),
});

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
  }),
  sets: many(sets),
}));

export const sets = pgTable("sets", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  reps: integer("reps").notNull(),
  weight: real("weight").notNull(),
  setNumber: integer("set_number").notNull(),
  notes: text("notes"),
});

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(exercises, {
    fields: [sets.exerciseId],
    references: [exercises.id],
  }),
}));
