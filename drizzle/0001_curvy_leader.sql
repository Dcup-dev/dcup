CREATE TABLE "apiKey" (
	"name" text PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"api_key" text NOT NULL,
	"generated_time" timestamp NOT NULL,
	CONSTRAINT "apiKey_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_user_email_user_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."user"("email") ON DELETE cascade ON UPDATE no action;