import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260429153715 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review" ("id" text not null, "shopify_product_id" text not null, "shopify_product_handle" text null, "storefront_origin" text null, "customer_name" text not null, "customer_email" text null, "rating" integer not null, "title" text not null, "content" text not null, "status" text check ("status" in ('draft', 'pending', 'approved', 'rejected', 'hidden', 'archived')) not null default 'pending', "verification_status" text check ("verification_status" in ('unverified', 'verified_purchase', 'manually_verified')) not null default 'unverified', "source" text check ("source" in ('storefront', 'admin', 'import')) not null default 'storefront', "published_at" timestamptz null, "approved_at" timestamptz null, "approved_by" text null, "rejected_at" timestamptz null, "rejected_by" text null, "hidden_at" timestamptz null, "hidden_by" text null, "archived_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_moderation_action" ("id" text not null, "review_id" text not null, "action" text check ("action" in ('submitted', 'approved', 'rejected', 'hidden', 'restored', 'archived', 'edited')) not null, "actor_id" text null, "actor_type" text check ("actor_type" in ('customer', 'admin', 'system')) not null default 'system', "from_status" text check ("from_status" in ('draft', 'pending', 'approved', 'rejected', 'hidden', 'archived')) null, "to_status" text check ("to_status" in ('draft', 'pending', 'approved', 'rejected', 'hidden', 'archived')) null, "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_moderation_action_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_moderation_action_deleted_at" ON "review_moderation_action" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_revision" ("id" text not null, "review_id" text not null, "rating" integer not null, "title" text not null, "content" text not null, "actor_id" text null, "actor_type" text check ("actor_type" in ('customer', 'admin', 'system')) not null default 'admin', "reason" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_revision_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_revision_deleted_at" ON "review_revision" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);

    this.addSql(`drop table if exists "review_moderation_action" cascade;`);

    this.addSql(`drop table if exists "review_revision" cascade;`);
  }

}
