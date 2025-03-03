ALTER TABLE "connection" ALTER COLUMN "expiry_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "directory" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "date_added" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "date_added" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "folder_name" text NOT NULL;