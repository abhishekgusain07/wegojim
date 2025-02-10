ALTER TABLE "exercises" ADD COLUMN "start_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "end_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "duration" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "start_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "end_time" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "duration" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "notes" text;