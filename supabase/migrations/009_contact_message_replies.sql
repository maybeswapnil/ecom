-- 009_contact_message_replies.sql
--
-- Track admin replies to contact form submissions so the admin inbox can
-- show reply history. Written only via the service-role client (admin
-- reply action), so no additional RLS policy is needed beyond 008's.

alter table contact_messages add column replied_at timestamptz;
alter table contact_messages add column reply_body text;
