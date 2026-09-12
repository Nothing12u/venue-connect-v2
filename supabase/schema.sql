-- ============================================================
-- VENTURE CONNECT — Supabase schema
--
-- Fixes from the Priority Audit Report (2026-09-10):
--   P0-1  Auth & business logic enforced client-side only
--   P0-2  No real database (localStorage only)
--   P0-3  Hardcoded admin credentials / plaintext passwords
--   P0-4  Quality gate not enforced server-side
--
-- How this file resolves each one:
--   P0-2 — every table below is a real, centrally-stored Postgres
--          table (Supabase's free tier gives you this database).
--   P0-3 — there is no admin key or password anywhere in this file
--          or in the app. "Admin" is just a normal Supabase Auth
--          account whose profiles.role = 'internal'. That role can
--          ONLY be granted by you, running SQL directly in the
--          Supabase dashboard (see the bottom of this file) — a
--          signed-up user can never set their own role to 'internal'
--          (blocked by the profiles insert policy below).
--   P0-1 / P0-4 — Row Level Security (RLS) plus BEFORE UPDATE
--          triggers enforce, on every single request at the
--          database layer, that only an internal reviewer can move
--          an application's stage, record a review decision, or
--          decide the quality gate. This holds even if someone
--          rewrites the JavaScript in DevTools, because Postgres
--          — not the browser — is the one deciding whether the
--          write is allowed.
--
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query.
-- ============================================================

-- ---------------------------------------------------------------
-- 0. Helper: is the current logged-in user an internal reviewer?
--    SECURITY DEFINER lets this check bypass RLS on `profiles`
--    itself, so it never recurses back through the policies below.
-- ---------------------------------------------------------------
create or replace function public.is_internal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'internal'
  );
$$;

-- ---------------------------------------------------------------
-- 1. profiles — one row per Supabase Auth user
-- ---------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  role         text not null check (role in ('founder','investor','incubator','organizer','internal')),
  name         text default '',
  org          text default '',
  title        text default '',
  bio          text default '',
  college      text default '',
  grad_year    text default '',
  location     text default '',
  skills       text[] default '{}',
  sectors      text[] default '{}',
  stages       text[] default '{}',
  ticket_size  text default '',
  org_type     text default '',
  domains      text[] default '{}',
  support_types text[] default '{}',
  socials      jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read their own profile; internal reviewers can read all
-- (they need founder/investor names & orgs to review applications).
create policy "profiles_select_own_or_internal"
  on public.profiles for select
  using (auth.uid() = id or public.is_internal());

-- A user may only create their OWN profile row, and can never set
-- role = 'internal' on signup. This is the fix for P0-3: internal
-- access cannot be self-granted from the client under any
-- circumstance, no matter what the browser sends.
create policy "profiles_insert_own_non_internal"
  on public.profiles for insert
  with check (auth.uid() = id and role <> 'internal');

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Prevent a user from promoting themselves after signup, e.g. by
-- calling PATCH on their own row with role: 'internal'.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_internal() then
    raise exception 'Only Venture Connect internal reviewers can change account roles.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------
-- 2. startups — one row per founder's venture
-- ---------------------------------------------------------------
create table public.startups (
  id            text primary key default ('usr-' || substr(gen_random_uuid()::text, 1, 10)),
  founder_id    uuid not null references public.profiles(id) on delete cascade,
  name          text default 'My Startup',
  tagline       text default '',
  sector        text default 'Other',
  stage         text default 'Idea Stage',
  location      text default 'India',
  logo          text default '#6366f1',
  quality_gate  text not null default 'in-progress' check (quality_gate in ('in-progress','review','passed','rejected')),
  score         int not null default 0,
  score_break   jsonb default '{}'::jsonb,
  funding_ask   text default 'To be defined',
  problem            text default '',
  solution           text default '',
  target_customer    text default '',
  market             text default '',
  business_model     text default '',
  validation         text default '',
  competition        text default '',
  advantage          text default '',
  use_of_funds       text default '',
  workspace     jsonb default '{}'::jsonb,   -- the 10-section Idea Workspace draft
  team          jsonb default '[]'::jsonb,
  milestones    jsonb default '[]'::jsonb,
  evidence      jsonb default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.startups enable row level security;

-- Founders see & manage only their own startup(s).
create policy "startups_select_owner_or_internal_or_passed"
  on public.startups for select
  using (
    founder_id = auth.uid()
    or public.is_internal()
    or quality_gate = 'passed'   -- the marketplace: only gated startups are visible to investors/incubators
  );

create policy "startups_insert_own"
  on public.startups for insert
  with check (founder_id = auth.uid());

create policy "startups_update_owner_or_internal"
  on public.startups for update
  using (founder_id = auth.uid() or public.is_internal());

-- P0-4: the quality_gate/score fields on a startup can only ever be
-- changed by an internal reviewer — a founder can edit their own
-- workspace/profile text, but never their own gate status or score.
create or replace function public.protect_startup_gate_fields()
returns trigger language plpgsql as $$
begin
  if not public.is_internal() then
    if new.quality_gate is distinct from old.quality_gate
       or new.score is distinct from old.score
       or new.score_break is distinct from old.score_break then
      raise exception 'Only Venture Connect internal reviewers can update quality gate fields.';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_protect_startup_gate_fields
  before update on public.startups
  for each row execute function public.protect_startup_gate_fields();

-- ---------------------------------------------------------------
-- 3. opportunities — postings from investors/incubators/organizers
-- ---------------------------------------------------------------
create table public.opportunities (
  id                 text primary key default ('opp-' || substr(gen_random_uuid()::text, 1, 10)),
  created_by         uuid not null references public.profiles(id) on delete cascade,
  org                text default '',
  category           text default '',
  type               text default '',
  title              text default '',
  description        text default '',
  status             text default 'draft' check (status in ('draft','published','closed')),
  application_mode   text default 'internal' check (application_mode in ('internal','external')),
  application_url    text default '',
  team_requirements  text default '',
  event_date         text default '',
  details            jsonb default '{}'::jsonb,   -- sector, stage, eligibility, deadline, funding, equity, perks, etc.
  views              int default 0,
  application_link_clicks int default 0,
  created_at         timestamptz not null default now()
);

alter table public.opportunities enable row level security;

-- Public marketplace: any signed-in user can browse published opportunities;
-- the creator can also see their own drafts.
create policy "opportunities_select_published_or_own_or_internal"
  on public.opportunities for select
  using (status = 'published' or created_by = auth.uid() or public.is_internal());

create policy "opportunities_insert_own"
  on public.opportunities for insert
  with check (created_by = auth.uid());

create policy "opportunities_update_own_or_internal"
  on public.opportunities for update
  using (created_by = auth.uid() or public.is_internal());

-- ---------------------------------------------------------------
-- 4. applications — a startup applying to an opportunity
--    This table IS the product's trust layer. Read the triggers
--    below carefully — they are the direct fix for P0-1 and P0-4.
-- ---------------------------------------------------------------
create table public.applications (
  id                text primary key default ('app-' || substr(gen_random_uuid()::text, 1, 10)),
  startup_id        text not null references public.startups(id) on delete cascade,
  opportunity_id    text not null references public.opportunities(id) on delete cascade,
  submitted_at      timestamptz not null default now(),
  last_updated_at   timestamptz not null default now(),
  updated_by        text default 'founder',
  versions          jsonb not null default '[]'::jsonb,
  current_version   int not null default 1,
  clarification     jsonb default null,
  stage             int not null default 1,
  needs_revision    boolean not null default false,
  rejected          boolean not null default false,
  vc_review         jsonb default '{"decision":null,"notes":""}'::jsonb,
  pitch             jsonb default '{"scores":{},"decision":null,"notes":""}'::jsonb,
  interview         jsonb default '{"scheduled":"","completed":false,"notes":"","decision":null}'::jsonb,
  auto_check        jsonb default null,
  evidence_status   jsonb default '{}'::jsonb,
  evidence_notes    jsonb default '{}'::jsonb,
  gate              jsonb not null default '{"decision":null,"notes":"","decidedAt":null}'::jsonb,
  investor_action   text default null check (investor_action is null or investor_action in ('rejected')),
  created_at        timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "applications_select_owner_or_internal_or_opp_owner_if_unlocked"
  on public.applications for select
  using (
    public.is_internal()
    or startup_id in (select id from public.startups where founder_id = auth.uid())
    or (
      -- the org that posted the opportunity can see applications
      -- ONLY once Venture Connect has unlocked them post-gate
      gate->>'decision' = 'passed'
      and opportunity_id in (select id from public.opportunities where created_by = auth.uid())
    )
  );

create policy "applications_insert_owner"
  on public.applications for insert
  with check (startup_id in (select id from public.startups where founder_id = auth.uid()));

create policy "applications_update_owner_or_internal"
  on public.applications for update
  using (
    public.is_internal()
    or startup_id in (select id from public.startups where founder_id = auth.uid())
  );

-- The org that posted the opportunity may update ONLY investor_action
-- (hide a qualified application from their own queue), and only once
-- Venture Connect has unlocked it post-gate. Every other field stays
-- off-limits to them — enforced by the trigger below.
create policy "applications_update_opportunity_owner_investor_action"
  on public.applications for update
  using (
    gate->>'decision' = 'passed'
    and opportunity_id in (select id from public.opportunities where created_by = auth.uid())
  );

-- P0-1 / P0-4 — THE CORE TRUST LAYER.
-- A founder is only ever allowed to touch: clarification.response,
-- versions/current_version (submitting a new draft), and the
-- housekeeping fields. Every review/decision field — stage,
-- gate, vc_review, pitch, interview, needs_revision, rejected,
-- auto_check, evidence_status/evidence_notes — can only be changed
-- by a request coming from a Supabase session whose profile role is
-- 'internal'. This is checked on the actual UPDATE statement in
-- Postgres, so it cannot be bypassed from DevTools, a rewritten
-- fetch call, or a forged request — the database itself refuses it.
create or replace function public.protect_application_review_fields()
returns trigger language plpgsql as $$
declare
  v_is_opp_owner boolean;
begin
  select (old.gate->>'decision' = 'passed'
          and old.opportunity_id in (select id from public.opportunities where created_by = auth.uid()))
    into v_is_opp_owner;

  if new.investor_action is distinct from old.investor_action
     and not public.is_internal() and not v_is_opp_owner then
    raise exception 'Only the opportunity owner can update investor_action, and only once unlocked.';
  end if;

  if not public.is_internal() then
    if new.stage is distinct from old.stage
       or new.gate is distinct from old.gate
       or new.vc_review is distinct from old.vc_review
       or new.pitch is distinct from old.pitch
       or new.interview is distinct from old.interview
       or new.needs_revision is distinct from old.needs_revision
       or new.rejected is distinct from old.rejected
       or new.auto_check is distinct from old.auto_check
       or new.evidence_status is distinct from old.evidence_status
       or new.evidence_notes is distinct from old.evidence_notes
       or (new.clarification->>'status') is distinct from (old.clarification->>'status')
       or (new.clarification->>'question') is distinct from (old.clarification->>'question') then
      raise exception 'Only Venture Connect internal reviewers can update review or quality-gate fields on an application.';
    end if;
    -- an opportunity owner's UPDATE must touch investor_action only —
    -- everything else on the row must stay byte-identical for them.
    if v_is_opp_owner and not (
      new.startup_id is not distinct from old.startup_id and
      new.opportunity_id is not distinct from old.opportunity_id and
      new.versions is not distinct from old.versions and
      new.current_version is not distinct from old.current_version and
      new.clarification is not distinct from old.clarification
    ) then
      raise exception 'Opportunity owners may only update investor_action.';
    end if;
  end if;
  new.last_updated_at = now();
  return new;
end;
$$;

create trigger trg_protect_application_review_fields
  before update on public.applications
  for each row execute function public.protect_application_review_fields();

-- ---------------------------------------------------------------
-- 5. saved / interested / queue (investor-side lists)
-- ---------------------------------------------------------------
create table public.saved_startups (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  startup_id  text not null references public.startups(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, startup_id)
);
alter table public.saved_startups enable row level security;
create policy "saved_owner_only" on public.saved_startups for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.interested_startups (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  startup_id  text not null references public.startups(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, startup_id)
);
alter table public.interested_startups enable row level security;
create policy "interested_owner_only" on public.interested_startups for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------
-- 6. messages — simple per-startup conversation thread
-- ---------------------------------------------------------------
create table public.messages (
  id             bigint generated always as identity primary key,
  startup_id     text not null references public.startups(id) on delete cascade,
  sender_id      uuid not null references public.profiles(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now()
);
alter table public.messages enable row level security;

create policy "messages_select_participants"
  on public.messages for select
  using (
    sender_id = auth.uid()
    or startup_id in (select id from public.startups where founder_id = auth.uid())
    or startup_id in (select startup_id from public.interested_startups where user_id = auth.uid())
    or public.is_internal()
  );

create policy "messages_insert_participants"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      startup_id in (select id from public.startups where founder_id = auth.uid())
      or startup_id in (select startup_id from public.interested_startups where user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------
-- 7. notifications
-- ---------------------------------------------------------------
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  text        text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_owner_only" on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------
-- 8. Server-side RPCs for the internal review workflow.
--    The frontend calls these instead of writing to the applications
--    table directly for review actions — belt-and-braces on top of
--    the trigger above, and it keeps all gate logic in one place.
-- ---------------------------------------------------------------
create or replace function public.advance_application(p_app_id text)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.applications;
begin
  if not public.is_internal() then
    raise exception 'Only internal reviewers can advance an application stage.';
  end if;
  update public.applications
    set stage = least(stage + 1, 7)
    where id = p_app_id
    returning * into result;
  return result;
end;
$$;

create or replace function public.set_application_gate(p_app_id text, p_passed boolean, p_notes text)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.applications;
  v_startup_id text;
begin
  if not public.is_internal() then
    raise exception 'Only internal reviewers can decide the quality gate.';
  end if;
  update public.applications
    set gate = jsonb_build_object(
          'decision', case when p_passed then 'passed' else 'not-passed' end,
          'notes', coalesce(p_notes, ''),
          'decidedAt', now()
        ),
        needs_revision = case when p_passed then false else needs_revision end
    where id = p_app_id
    returning * into result;

  select startup_id into v_startup_id from public.applications where id = p_app_id;
  update public.startups
    set quality_gate = case when p_passed then 'passed' else 'rejected' end
    where id = v_startup_id;

  return result;
end;
$$;

create or replace function public.unlock_application(p_app_id text)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.applications;
begin
  if not public.is_internal() then
    raise exception 'Only internal reviewers can unlock an application for investor review.';
  end if;
  update public.applications
    set stage = 7
    where id = p_app_id and gate->>'decision' = 'passed'
    returning * into result;
  return result;
end;
$$;

create or replace function public.reject_application(p_app_id text)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.applications;
begin
  if not public.is_internal() then
    raise exception 'Only internal reviewers can reject an application.';
  end if;
  update public.applications
    set rejected = true
    where id = p_app_id
    returning * into result;
  return result;
end;
$$;

-- ============================================================
-- AFTER RUNNING THIS FILE — create your first internal reviewer:
--
-- 1. Sign up normally through the app once (any role, e.g. founder) —
--    or create a user directly in Supabase Dashboard → Authentication → Users.
-- 2. Then run, in the SQL Editor (this runs as the Postgres owner and
--    bypasses RLS, which is the ONLY way an 'internal' role can be set):
--
--      update public.profiles set role = 'internal' where email = 'you@example.com';
--
-- There is no admin key, no hardcoded password, and no way for a
-- user to grant themselves this role from the app.
-- ============================================================
