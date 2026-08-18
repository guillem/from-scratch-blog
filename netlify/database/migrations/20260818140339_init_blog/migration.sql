CREATE TYPE "post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "post_tags_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body_markdown" text NOT NULL,
	"status" "post_status" DEFAULT 'draft'::"post_status" NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "posts_title_not_empty" CHECK (char_length(btrim("title")) > 0),
	CONSTRAINT "posts_published_requires_published_at" CHECK ("status" <> 'published' OR "published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "tags_name_not_empty" CHECK (char_length(btrim("name")) > 0)
);
--> statement-breakpoint
CREATE INDEX "post_tags_tag_id_idx" ON "post_tags" ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_unique" ON "posts" ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_published_at_idx" ON "posts" ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique" ON "tags" ("name");--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;