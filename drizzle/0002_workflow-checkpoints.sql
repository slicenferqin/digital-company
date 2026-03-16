CREATE TABLE IF NOT EXISTS "workflow_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_name" text NOT NULL,
	"thread_id" text NOT NULL,
	"checkpoint_namespace" text DEFAULT '' NOT NULL,
	"checkpoint_id" text NOT NULL,
	"checkpoint_json" jsonb NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parent_checkpoint_id" text,
	"pending_writes_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_checkpoints_thread_checkpoint_idx" ON "workflow_checkpoints" USING btree ("thread_id","checkpoint_namespace","checkpoint_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_checkpoints_thread_updated_idx" ON "workflow_checkpoints" USING btree ("workflow_name","thread_id","updated_at");