CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"workout_id" text NOT NULL,
	"exercise_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"invoice_id" text,
	"subscription_id" text,
	"amount_paid" text,
	"amount_due" text,
	"currency" text,
	"status" text,
	"email" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" text PRIMARY KEY NOT NULL,
	"exercise_id" text NOT NULL,
	"reps" integer NOT NULL,
	"weight" real NOT NULL,
	"set_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"plan_id" text,
	"name" text,
	"description" text,
	"amount" text,
	"currency" text,
	"interval" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"subscription_id" text,
	"stripe_user_id" text,
	"status" text,
	"start_date" text,
	"end_date" text,
	"plan_id" text,
	"default_payment_method_id" text,
	"email" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"email" text,
	"first_name" text,
	"last_name" text,
	"gender" text,
	"profile_image_url" text,
	"user_id" text,
	"subscription" text,
	"credits" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;