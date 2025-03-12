ALTER TABLE "pocessed_file" ADD PRIMARY KEY ("name");--> statement-breakpoint
ALTER TABLE "pocessed_file" ADD CONSTRAINT "pocessed_file_name_unique" UNIQUE("name");