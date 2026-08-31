CREATE TABLE "anonymous_visitor" (
	"id_hash" text PRIMARY KEY NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visit_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "anonymous_visitor_last_seen_idx" ON "anonymous_visitor" USING btree ("last_seen_at");