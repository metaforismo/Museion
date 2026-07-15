-- Server-owned JSON state for compiler, Judge, learner profile, and lesson sessions.
-- Browser roles receive no table privileges; only the server secret may access it.

create table if not exists public.museion_state (
  namespace text not null check (namespace in ('compiler_run', 'judge_session', 'learner_profile', 'learner_session')),
  id text not null check (char_length(id) between 1 and 128),
  owner_id text not null check (char_length(owner_id) between 1 and 128),
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (namespace, id)
);

create index if not exists museion_state_owner_namespace_idx
  on public.museion_state (owner_id, namespace);
create index if not exists museion_state_expires_at_idx
  on public.museion_state (expires_at);

alter table public.museion_state enable row level security;
alter table public.museion_state force row level security;

revoke all on table public.museion_state from public, anon, authenticated;
grant select, insert, update, delete on table public.museion_state to service_role;

comment on table public.museion_state is
  'Server-owned, expiring Museion application state. Never query from a browser client.';
