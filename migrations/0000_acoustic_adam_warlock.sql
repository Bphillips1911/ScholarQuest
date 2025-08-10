CREATE TABLE "admin_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "administrators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"permissions" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "administrators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "houses" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"motto" text NOT NULL,
	"academic_points" integer DEFAULT 0 NOT NULL,
	"attendance_points" integer DEFAULT 0 NOT NULL,
	"behavior_points" integer DEFAULT 0 NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar,
	"scholar_ids" text[] DEFAULT '{}',
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "parents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "password_reset_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"teacher_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pbis_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scholar_id" varchar NOT NULL,
	"teacher_name" text NOT NULL,
	"teacher_role" text NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"reason" text,
	"mustang_trait" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"entry_type" text DEFAULT 'positive' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pbis_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"description" text,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "point_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" varchar NOT NULL,
	"scholar_id" varchar,
	"category" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text,
	"added_by" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scholars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"student_id" text NOT NULL,
	"house_id" varchar,
	"grade" integer NOT NULL,
	"academic_points" integer DEFAULT 0 NOT NULL,
	"attendance_points" integer DEFAULT 0 NOT NULL,
	"behavior_points" integer DEFAULT 0 NOT NULL,
	"is_house_sorted" boolean DEFAULT false NOT NULL,
	"sorting_number" integer,
	"added_by_teacher" varchar,
	"username" varchar,
	"password_hash" varchar,
	"teacher_id" varchar,
	"needs_password_reset" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "scholars_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "scholars_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "student_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "student_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "teacher_auth" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"grade_role" text NOT NULL,
	"password_hash" varchar NOT NULL,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "teacher_auth_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "teacher_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teacher_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"subject" text,
	"can_see_grades" integer[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teachers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_administrators_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."administrators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_student_id_scholars_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."scholars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_teacher_id_teacher_auth_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher_auth"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbis_entries" ADD CONSTRAINT "pbis_entries_scholar_id_scholars_id_fk" FOREIGN KEY ("scholar_id") REFERENCES "public"."scholars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_scholar_id_scholars_id_fk" FOREIGN KEY ("scholar_id") REFERENCES "public"."scholars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholars" ADD CONSTRAINT "scholars_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholars" ADD CONSTRAINT "scholars_teacher_id_teacher_auth_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher_auth"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_student_id_scholars_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."scholars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_sessions" ADD CONSTRAINT "teacher_sessions_teacher_id_teacher_auth_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher_auth"("id") ON DELETE no action ON UPDATE no action;