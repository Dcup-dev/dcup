CREATE TYPE "public"."importMode" AS ENUM('Fast', 'Hi-res');--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "expiry_date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "directory" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "folder_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "date_added" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "connection" ALTER COLUMN "date_added" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connection" ADD COLUMN "import_mode" "importMode" DEFAULT 'Fast' NOT NULL;