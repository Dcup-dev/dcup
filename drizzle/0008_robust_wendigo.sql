CREATE TYPE "public"."connectors" AS ENUM('GOOGLE_DRIVE', 'AWS', 'NOTION', 'SLACK', 'GMAIL', 'CONFLUENCE');--> statement-breakpoint
CREATE TABLE "connection" (
	"user_id" text NOT NULL,
	"service" "connectors" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expiry_date" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;