import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260429153716 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "chat_escalation" ("id" text not null, "session_id" text not null, "status" text check ("status" in ('open', 'resolved', 'dismissed')) not null default 'open', "reason" text null, "requested_by_id" text null, "requested_by_type" text check ("requested_by_type" in ('customer', 'agent', 'system', 'ai')) not null default 'system', "resolved_by_id" text null, "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_escalation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_escalation_deleted_at" ON "chat_escalation" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "chat_message" ("id" text not null, "session_id" text not null, "sender_type" text check ("sender_type" in ('customer', 'agent', 'system', 'ai')) not null, "message_type" text check ("message_type" in ('message', 'note', 'system')) not null default 'message', "content" text not null, "agent_id" text null, "agent_name" text null, "is_internal" boolean not null default false, "has_attachments" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_message_deleted_at" ON "chat_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "chat_session" ("id" text not null, "storefront_origin" text null, "page_url" text null, "page_title" text null, "customer_name" text null, "customer_email" text null, "shopify_customer_id" text null, "shopify_customer_email" text null, "visitor_id" text null, "status" text check ("status" in ('open', 'waiting_for_customer', 'waiting_for_agent', 'resolved', 'closed', 'escalated')) not null default 'open', "source" text check ("source" in ('storefront', 'admin', 'ai_assistant')) not null default 'storefront', "assigned_agent_id" text null, "assigned_agent_name" text null, "first_response_at" timestamptz null, "last_message_at" timestamptz null, "resolved_at" timestamptz null, "closed_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_session_deleted_at" ON "chat_session" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "chat_escalation" cascade;`);

    this.addSql(`drop table if exists "chat_message" cascade;`);

    this.addSql(`drop table if exists "chat_session" cascade;`);
  }

}
