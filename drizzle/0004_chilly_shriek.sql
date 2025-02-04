CREATE TYPE "public"."plan" AS ENUM('Free', 'Basic', 'Pro', 'Business', 'Enterprise');--> statement-breakpoint
ALTER TABLE "apiKey" DROP CONSTRAINT "apiKey_user_email_user_email_fk";
--> statement-breakpoint
ALTER TABLE "apiKey" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan" "plan" DEFAULT 'Free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "volume" integer DEFAULT 1024 NOT NULL;--> statement-breakpoint
ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKey" DROP COLUMN "user_email";