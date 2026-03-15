CREATE TYPE "public"."decision_workflow_status" AS ENUM('not_started', 'awaiting_owner', 'resumed', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "workflow_thread_id" text;--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "workflow_name" text;--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "workflow_status" "decision_workflow_status" DEFAULT 'not_started' NOT NULL;