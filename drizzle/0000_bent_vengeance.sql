CREATE TABLE "cv_document" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"person_name" text DEFAULT '' NOT NULL,
	"resume" jsonb,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	CONSTRAINT "cv_document_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "cv_document" ADD CONSTRAINT "cv_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cv_document_user_updated_idx" ON "cv_document" USING btree ("user_id","updated_at");
