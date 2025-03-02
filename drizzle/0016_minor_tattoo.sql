ALTER TABLE "connection" ALTER COLUMN "date_added" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "last_synced" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "metadata" text;