-- ============================================================
-- VENTURE CONNECT — security hardening (run AFTER schema.sql)
--
-- Safe to run more than once, and safe to run on a database that
-- already has data. Run the whole file in:
--   Supabase Dashboard → SQL Editor → New query.
--
-- What this fixes (see the repo review):
--   1. messages / interested_startups leaked across users
--   2. anonymous (logged-out) reads of startups and opportunities
--   3. whole application rows (internal review notes) exposed to
--      the organization that posted the opportunity
--   4. quality-gate bypass by INSERTing a row with gate fields set
--   5. applications re-pointed to another opportunity / edited after
--      the 10-day window / clarification replies blocked by trigger
--   6. profile email squatting; signup breaking when email
--      confirmation is on (profile is now created by a DB trigger)
--   7. view / click counters silently failing for non-owners
--   8. founders' names invisible to investors (safe view added)
--   9. founders could not see who they were talking to (safe view added)
-- ============================================================

-- ---------------------------------------------------------------
-- 0. Helpers (SECURITY DEFINER so policies can look across tables
--    without recursing through RLS)
-- ---------------------------------------------------------------
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_startup_founder(p_startup text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.startups where id = p_startup and founder_id = auth.uid());
$$;

create or replace function public.startup_is_passed(p_startup text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.startups where id = p_startup and quality_gate = 'passed');
$$;

create or replace function public.user_interested_in(p_user uuid, p_startup text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.interested_startups where user_id = p_user and startup_id = p_startup);
$$;

-- True when the session is NOT an end user: the SQL editor, a migration, or the
-- service_role key (none of these carry a user id), or an internal reviewer.
-- The protective triggers below use it, so the project owner can still bootstrap the
-- first reviewer (see SUPABASE_SETUP.md) and fix data by hand, while every request
-- made with a user's JWT (auth.uid() is set) still goes through the checks.
-- Anonymous requests never get this far: RLS has no policy that lets them write.
create or replace function public.is_trusted_session()
returns boolean language sql stable as $$
  select auth.uid() is null or public.is_internal();
$$;

create or replace function public.jsonb_text_array(j jsonb)
returns text[] language sql immutable as $$
  select case when jsonb_typeof(j) = 'array'
              then coalesce(array(select jsonb_array_elements_text(j)), '{}')
              else '{}'::text[] end;
$$;

-- ---------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------
alter table public.profiles add column if not exists extra jsonb default '{}'::jsonb;

-- The profile row is now created by a trigger from the signup metadata, so
-- it works even when "Confirm email" is on (no session exists at signup).
-- Role can never be 'internal' here; the email always comes from auth.users.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r  text  := coalesce(m->>'role', 'founder');
  st jsonb := case when jsonb_typeof(m->'startup') = 'object' then m->'startup' else null end;
  pid uuid := new.id;
begin
  if r not in ('founder', 'investor', 'incubator', 'organizer') then r := 'founder'; end if;

  insert into public.profiles
    (id, email, role, name, org, title, bio, college, grad_year, location,
     skills, sectors, stages, org_type, domains, support_types, socials)
  values
    (pid, new.email, r,
     left(coalesce(m->>'name', ''), 200), left(coalesce(m->>'org', ''), 200),
     left(coalesce(m->>'title', ''), 200), left(coalesce(m->>'bio', ''), 2000),
     left(coalesce(m->>'college', ''), 200), left(coalesce(m->>'grad_year', ''), 20),
     left(coalesce(m->>'location', ''), 200),
     public.jsonb_text_array(m->'skills'), public.jsonb_text_array(m->'sectors'),
     public.jsonb_text_array(m->'stages'), left(coalesce(m->>'org_type', ''), 200),
     public.jsonb_text_array(m->'domains'), public.jsonb_text_array(m->'support_types'),
     case when jsonb_typeof(m->'socials') = 'object' then m->'socials' else '{}'::jsonb end)
  on conflict (id) do nothing;

  if r = 'founder' and st is not null then
    insert into public.startups (founder_id, name, tagline, sector, stage, location, team, milestones)
    values (pid,
            left(coalesce(nullif(st->>'name', ''), 'My Startup'), 200),
            left(coalesce(st->>'tagline', ''), 200),
            left(coalesce(nullif(st->>'sector', ''), 'Other'), 100),
            left(coalesce(nullif(st->>'stage', ''), 'Idea Stage'), 100),
            left(coalesce(nullif(st->>'location', ''), 'India'), 100),
            case when jsonb_typeof(st->'team') = 'array' then st->'team' else '[]'::jsonb end,
            case when jsonb_typeof(st->'milestones') = 'array' then st->'milestones' else '[]'::jsonb end);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fallback client-side insert (only if the trigger ever did not run): the email
-- must match the authenticated user's own email, and role can never be internal.
drop policy if exists "profiles_insert_own_non_internal" on public.profiles;
create policy "profiles_insert_own_non_internal"
  on public.profiles for insert to authenticated
  with check (
    auth.uid() = id
    and role <> 'internal'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "profiles_select_own_or_internal" on public.profiles;
create policy "profiles_select_own_or_internal"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_internal());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql as $$
begin
  if not public.is_trusted_session() then
    if new.role is distinct from old.role then
      raise exception 'Only Venture Connect internal reviewers can change account roles.';
    end if;
    if new.email is distinct from old.email or new.id is distinct from old.id then
      raise exception 'Email and id cannot be changed.';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- 2. startups
-- ---------------------------------------------------------------
do $$ begin
  alter table public.startups add constraint startups_id_format check (id ~ '^[A-Za-z0-9_-]{1,64}$');
exception when duplicate_object then null; when check_violation then raise notice 'startups_id_format skipped: existing ids do not match'; end $$;

drop policy if exists "startups_select_owner_or_internal_or_passed" on public.startups;
drop policy if exists "startups_select_scoped" on public.startups;
create policy "startups_select_scoped"
  on public.startups for select to authenticated
  using (
    founder_id = auth.uid()
    or public.is_internal()
    or (quality_gate = 'passed' and public.current_role_name() in ('investor', 'incubator', 'organizer'))
  );

-- A new startup always starts un-gated with a zero score; only an internal
-- reviewer (UPDATE trigger below / RPCs) can change that afterwards.
drop policy if exists "startups_insert_own" on public.startups;
create policy "startups_insert_own"
  on public.startups for insert to authenticated
  with check (
    founder_id = auth.uid()
    and public.current_role_name() = 'founder'
    and quality_gate = 'in-progress'
    and score = 0
    and coalesce(score_break, '{}'::jsonb) = '{}'::jsonb
  );

drop policy if exists "startups_update_owner_or_internal" on public.startups;
create policy "startups_update_owner_or_internal"
  on public.startups for update to authenticated
  using (founder_id = auth.uid() or public.is_internal())
  with check (founder_id = auth.uid() or public.is_internal());

create or replace function public.protect_startup_gate_fields()
returns trigger language plpgsql as $$
begin
  if not public.is_trusted_session() then
    if new.quality_gate is distinct from old.quality_gate
       or new.score is distinct from old.score
       or new.score_break is distinct from old.score_break then
      raise exception 'Only Venture Connect internal reviewers can update quality gate fields.';
    end if;
    if new.founder_id is distinct from old.founder_id or new.id is distinct from old.id then
      raise exception 'A startup cannot be transferred or re-keyed.';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

-- Founder name / college / bio for marketplace startups. Investors cannot read
-- other users' profiles, so this narrow view exposes only what the UI shows,
-- and only for startups that passed the gate.
create or replace view public.marketplace_founders as
  select s.id as startup_id, p.name, p.college, p.location, p.bio, p.skills, p.socials
  from public.startups s
  join public.profiles p on p.id = s.founder_id
  where s.quality_gate = 'passed'
    and public.current_role_name() in ('investor', 'incubator', 'organizer', 'internal');
revoke all on public.marketplace_founders from anon, public;
grant select on public.marketplace_founders to authenticated;

-- ---------------------------------------------------------------
-- 3. opportunities
-- ---------------------------------------------------------------
do $$ begin
  alter table public.opportunities add constraint opportunities_id_format check (id ~ '^[A-Za-z0-9_-]{1,64}$');
exception when duplicate_object then null; when check_violation then raise notice 'opportunities_id_format skipped: existing ids do not match'; end $$;

drop policy if exists "opportunities_select_published_or_own_or_internal" on public.opportunities;
create policy "opportunities_select_published_or_own_or_internal"
  on public.opportunities for select to authenticated
  using (status = 'published' or created_by = auth.uid() or public.is_internal());

drop policy if exists "opportunities_insert_own" on public.opportunities;
create policy "opportunities_insert_own"
  on public.opportunities for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.current_role_name() in ('investor', 'incubator', 'organizer')
    and views = 0 and application_link_clicks = 0
  );

drop policy if exists "opportunities_update_own_or_internal" on public.opportunities;
create policy "opportunities_update_own_or_internal"
  on public.opportunities for update to authenticated
  using (created_by = auth.uid() or public.is_internal())
  with check (created_by = auth.uid() or public.is_internal());

-- Counters only move through the two RPCs below (they set a transaction-local flag).
create or replace function public.protect_opportunity_fields()
returns trigger language plpgsql as $$
begin
  if not public.is_trusted_session() then
    if new.created_by is distinct from old.created_by or new.id is distinct from old.id then
      raise exception 'An opportunity cannot be transferred or re-keyed.';
    end if;
    if (new.views is distinct from old.views or new.application_link_clicks is distinct from old.application_link_clicks)
       and coalesce(current_setting('app.counter_rpc', true), '') <> '1' then
      raise exception 'Counters can only be changed through the counter functions.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_opportunity_fields on public.opportunities;
create trigger trg_protect_opportunity_fields
  before update on public.opportunities
  for each row execute function public.protect_opportunity_fields();

create or replace function public.increment_opportunity_views(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.counter_rpc', '1', true);
  update public.opportunities set views = coalesce(views, 0) + 1
    where id = p_id and status = 'published';
end;
$$;

create or replace function public.record_application_click(p_id text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform set_config('app.counter_rpc', '1', true);
  update public.opportunities set application_link_clicks = coalesce(application_link_clicks, 0) + 1
    where id = p_id and status = 'published'
    returning application_link_clicks into n;
  return n;
end;
$$;

revoke all on function public.increment_opportunity_views(text) from public, anon;
revoke all on function public.record_application_click(text) from public, anon;
grant execute on function public.increment_opportunity_views(text) to authenticated;
grant execute on function public.record_application_click(text) to authenticated;

-- ---------------------------------------------------------------
-- 4. applications
-- ---------------------------------------------------------------
do $$ begin
  alter table public.applications add constraint applications_id_format check (id ~ '^[A-Za-z0-9_-]{1,64}$');
exception when duplicate_object then null; when check_violation then raise notice 'applications_id_format skipped: existing ids do not match'; end $$;

do $$ begin
  create unique index if not exists applications_startup_opportunity_uniq on public.applications (startup_id, opportunity_id);
exception when others then raise notice 'applications_startup_opportunity_uniq skipped: duplicates exist'; end $$;

-- Organizers/investors no longer read the table directly (it holds internal
-- review notes). They read the narrow view below instead.
drop policy if exists "applications_select_owner_or_internal_or_opp_owner_if_unlocked" on public.applications;
drop policy if exists "applications_select_owner_or_internal" on public.applications;
create policy "applications_select_owner_or_internal"
  on public.applications for select to authenticated
  using (public.is_internal() or public.is_startup_founder(startup_id));

drop policy if exists "applications_insert_owner" on public.applications;
create policy "applications_insert_owner"
  on public.applications for insert to authenticated
  with check (
    public.is_startup_founder(startup_id)
    and opportunity_id in (select id from public.opportunities where status = 'published')
  );

drop policy if exists "applications_update_owner_or_internal" on public.applications;
create policy "applications_update_owner_or_internal"
  on public.applications for update to authenticated
  using (public.is_internal() or public.is_startup_founder(startup_id))
  with check (public.is_internal() or public.is_startup_founder(startup_id));

drop policy if exists "applications_update_opportunity_owner_investor_action" on public.applications;

-- A founder-created application always starts at stage 1 with every review
-- field blank, whatever the client sent.
create or replace function public.force_application_defaults()
returns trigger language plpgsql as $$
begin
  if not public.is_trusted_session() then
    new.stage := 1;
    new.current_version := 1;
    new.updated_by := 'founder';
    new.needs_revision := false;
    new.rejected := false;
    new.clarification := null;
    new.vc_review := '{"decision":null,"notes":""}'::jsonb;
    new.pitch := '{"scores":{},"decision":null,"notes":""}'::jsonb;
    new.interview := '{"scheduled":"","completed":false,"notes":"","decision":null}'::jsonb;
    new.auto_check := null;
    new.evidence_status := '{}'::jsonb;
    new.evidence_notes := '{}'::jsonb;
    new.gate := '{"decision":null,"notes":"","decidedAt":null}'::jsonb;
    new.investor_action := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_force_application_defaults on public.applications;
create trigger trg_force_application_defaults
  before insert on public.applications
  for each row execute function public.force_application_defaults();

create or replace function public.protect_application_review_fields()
returns trigger language plpgsql as $$
declare
  v_is_opp_owner boolean;
  v_old_status text := old.clarification ->> 'status';
  v_new_status text := new.clarification ->> 'status';
begin
  select (old.gate ->> 'decision' = 'passed' and old.stage >= 7
          and old.opportunity_id in (select id from public.opportunities where created_by = auth.uid()))
    into v_is_opp_owner;

  if not public.is_trusted_session() then
    if new.id is distinct from old.id
       or new.startup_id is distinct from old.startup_id
       or new.opportunity_id is distinct from old.opportunity_id then
      raise exception 'An application cannot be moved to another startup or opportunity.';
    end if;

    if new.investor_action is distinct from old.investor_action and not coalesce(v_is_opp_owner, false) then
      raise exception 'Only the opportunity owner can update investor_action, and only once unlocked.';
    end if;

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
       or (new.clarification ->> 'question') is distinct from (old.clarification ->> 'question') then
      raise exception 'Only Venture Connect internal reviewers can update review or quality-gate fields on an application.';
    end if;

    -- A founder may answer a requested clarification (requested -> responded) but
    -- may not otherwise change its status.
    if v_new_status is distinct from v_old_status
       and not (v_old_status = 'requested' and v_new_status = 'responded') then
      raise exception 'Only Venture Connect internal reviewers can change clarification status.';
    end if;

    -- The 10-day editing window and the decision lock are enforced here, not just in the UI.
    if (new.versions is distinct from old.versions or new.current_version is distinct from old.current_version)
       and not coalesce(v_is_opp_owner, false)
       and (old.rejected
            or old.gate ->> 'decision' is not null
            or now() > old.submitted_at + interval '10 days') then
      raise exception 'This application can no longer be edited.';
    end if;

    if coalesce(v_is_opp_owner, false) and not (
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

-- What an organization is allowed to see about applications to ITS opportunities:
-- only unlocked (gate passed, stage 7) ones, and none of the internal review notes.
create or replace view public.org_applications as
  select a.id, a.startup_id, a.opportunity_id, a.submitted_at, a.last_updated_at, a.updated_by,
         a.versions, a.current_version, a.stage, a.rejected, a.investor_action,
         jsonb_build_object('decision', a.gate ->> 'decision', 'decidedAt', a.gate -> 'decidedAt', 'notes', '') as gate
  from public.applications a
  where a.gate ->> 'decision' = 'passed'
    and a.stage >= 7
    and a.opportunity_id in (select id from public.opportunities where created_by = auth.uid());
revoke all on public.org_applications from anon, public;
grant select on public.org_applications to authenticated;

-- Hide a qualified application from the organization's own queue.
create or replace function public.reject_application_investor(p_app_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.applications
     set investor_action = 'rejected'
   where id = p_app_id
     and gate ->> 'decision' = 'passed'
     and stage >= 7
     and opportunity_id in (select id from public.opportunities where created_by = auth.uid());
  return found;
end;
$$;
revoke all on function public.reject_application_investor(text) from public, anon;
grant execute on function public.reject_application_investor(text) to authenticated;

-- ---------------------------------------------------------------
-- 5. saved / interested: only passed startups, only for org-side roles
-- ---------------------------------------------------------------
drop policy if exists "saved_owner_only" on public.saved_startups;
drop policy if exists "saved_select_own" on public.saved_startups;
drop policy if exists "saved_insert_own" on public.saved_startups;
drop policy if exists "saved_delete_own" on public.saved_startups;
create policy "saved_select_own" on public.saved_startups for select to authenticated using (user_id = auth.uid());
create policy "saved_delete_own" on public.saved_startups for delete to authenticated using (user_id = auth.uid());
create policy "saved_insert_own" on public.saved_startups for insert to authenticated
  with check (user_id = auth.uid()
              and public.current_role_name() in ('investor', 'incubator')
              and public.startup_is_passed(startup_id));

drop policy if exists "interested_owner_only" on public.interested_startups;
drop policy if exists "interested_select_own" on public.interested_startups;
drop policy if exists "interested_insert_own" on public.interested_startups;
drop policy if exists "interested_delete_own" on public.interested_startups;
create policy "interested_select_own" on public.interested_startups for select to authenticated using (user_id = auth.uid());
create policy "interested_delete_own" on public.interested_startups for delete to authenticated using (user_id = auth.uid());
create policy "interested_insert_own" on public.interested_startups for insert to authenticated
  with check (user_id = auth.uid()
              and public.current_role_name() in ('investor', 'incubator')
              and public.startup_is_passed(startup_id));

-- ---------------------------------------------------------------
-- 6. messages: one thread per (startup, org-side participant)
-- ---------------------------------------------------------------
alter table public.messages add column if not exists participant_id uuid references public.profiles(id) on delete cascade;

-- Backfill: an existing message sent by someone who is not the startup's founder
-- belongs to that sender's own thread.
update public.messages m
   set participant_id = m.sender_id
 where m.participant_id is null
   and not exists (select 1 from public.startups s where s.id = m.startup_id and s.founder_id = m.sender_id);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select to authenticated
  using (
    sender_id = auth.uid()
    or participant_id = auth.uid()
    or public.is_startup_founder(startup_id)
    or public.is_internal()
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and participant_id is not null
    and length(body) between 1 and 4000
    and (
      -- the investor/incubator side of the thread
      (participant_id = auth.uid()
       and public.user_interested_in(auth.uid(), startup_id)
       and public.startup_is_passed(startup_id))
      or
      -- the founder replying to a participant who marked the startup interesting
      (public.is_startup_founder(startup_id)
       and public.user_interested_in(participant_id, startup_id))
    )
  );

create index if not exists messages_startup_participant_idx on public.messages (startup_id, participant_id, created_at);

-- Founders cannot read other users' profiles, but they need to know WHO marked their
-- startup as interesting (and so who they can reply to). This view exposes only a
-- display name / organisation / role, and only for the founder's own startups
-- (or to an internal reviewer).
create or replace view public.thread_participants as
  select i.startup_id, p.id as participant_id, p.name, p.org, p.title, p.role
  from public.interested_startups i
  join public.startups s on s.id = i.startup_id
  join public.profiles p on p.id = i.user_id
  where s.founder_id = auth.uid() or public.is_internal();
revoke all on public.thread_participants from anon, public;
grant select on public.thread_participants to authenticated;

-- ---------------------------------------------------------------
-- 7. notifications: users read and mark their own; nothing else
-- ---------------------------------------------------------------
drop policy if exists "notifications_owner_only" on public.notifications;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------
-- 8. internal RPCs: logged-in users only, never anonymous
-- ---------------------------------------------------------------
revoke all on function public.advance_application(text) from public, anon;
revoke all on function public.set_application_gate(text, boolean, text) from public, anon;
revoke all on function public.unlock_application(text) from public, anon;
revoke all on function public.reject_application(text) from public, anon;
grant execute on function public.advance_application(text) to authenticated;
grant execute on function public.set_application_gate(text, boolean, text) to authenticated;
grant execute on function public.unlock_application(text) to authenticated;
grant execute on function public.reject_application(text) to authenticated;

-- set_application_gate only ever moves a startup to 'passed' / 'rejected'; make
-- a re-decision on a different application of the same startup consistent.
-- (No change needed to the function body; privileges above are the fix.)

-- ---------------------------------------------------------------
-- 9. Helper functions
--    - user_interested_in() only answers about yourself, or for a startup you own
--      (it used to let any signed-in user ask whether anyone else was interested).
--    - Logged-out visitors can no longer call the helpers through the API.
--    - A fixed search_path on every function that did not have one.
-- ---------------------------------------------------------------
create or replace function public.user_interested_in(p_user uuid, p_startup text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.interested_startups where user_id = p_user and startup_id = p_startup)
     and (p_user = auth.uid() or public.is_startup_founder(p_startup) or public.is_internal());
$$;

revoke execute on function public.current_role_name() from public, anon;
revoke execute on function public.is_startup_founder(text) from public, anon;
revoke execute on function public.startup_is_passed(text) from public, anon;
revoke execute on function public.user_interested_in(uuid, text) from public, anon;
revoke execute on function public.is_internal() from public, anon;
grant execute on function public.current_role_name() to authenticated;
grant execute on function public.is_startup_founder(text) to authenticated;
grant execute on function public.startup_is_passed(text) to authenticated;
grant execute on function public.user_interested_in(uuid, text) to authenticated;
grant execute on function public.is_internal() to authenticated;

alter function public.is_trusted_session() set search_path = public;
alter function public.jsonb_text_array(jsonb) set search_path = public;
alter function public.prevent_role_escalation() set search_path = public;
alter function public.protect_startup_gate_fields() set search_path = public;
alter function public.protect_opportunity_fields() set search_path = public;
alter function public.force_application_defaults() set search_path = public;
alter function public.protect_application_review_fields() set search_path = public;
