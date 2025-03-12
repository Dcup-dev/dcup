CREATE TABLE "pocessed_file" (
	"name" text NOT NULL,
	"connection_id" text NOT NULL,
	"total_pages" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pocessed_file" ADD CONSTRAINT "pocessed_file_connection_id_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connection"("id") ON DELETE cascade ON UPDATE no action;