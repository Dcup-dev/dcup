ALTER TABLE "user" DROP CONSTRAINT "user_api_key_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "api_key";