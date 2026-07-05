-- 008_contact_messages.sql
--
-- Contact form submissions. Public (anon) can insert; nobody can select/update
-- via RLS — the admin panel reads/updates through the service-role client
-- (see lib/supabase/admin.ts), same pattern as every other admin-only table.

create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy anon_insert_contact_messages on contact_messages
  for insert to anon with check (true);
