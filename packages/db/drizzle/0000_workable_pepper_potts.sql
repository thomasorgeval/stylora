CREATE TYPE "public"."database_connection_test_status" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TYPE "public"."database_engine" AS ENUM('postgresql');--> statement-breakpoint
CREATE TYPE "public"."database_ssl_mode" AS ENUM('disable', 'prefer', 'require', 'verify-ca', 'verify-full');--> statement-breakpoint
CREATE TABLE "database_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"engine" "database_engine" DEFAULT 'postgresql' NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 5432 NOT NULL,
	"database_name" text NOT NULL,
	"username" text NOT NULL,
	"password_encrypted" text NOT NULL,
	"ssl_mode" "database_ssl_mode" DEFAULT 'prefer' NOT NULL,
	"connection_options" jsonb,
	"last_tested_at" timestamp with time zone,
	"last_test_status" "database_connection_test_status",
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "database_connections_project_id_idx" ON "database_connections" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "database_connections_project_name_idx" ON "database_connections" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_organization_slug_idx" ON "projects" USING btree ("organization_id","slug");