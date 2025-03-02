ALTER TABLE "connection" ADD COLUMN "directory" text;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "partition" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "documents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "pages" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "date_added" timestamp;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "last_synced" timestamp;