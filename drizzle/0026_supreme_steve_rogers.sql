ALTER TABLE "connection" ADD COLUMN "is_syncing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" DROP COLUMN "import_mode";--> statement-breakpoint
DROP TYPE "public"."importMode";