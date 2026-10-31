# Venture Connect — Supabase backend setup

This closes audit findings P0-1 through P0-4 (client-side-only auth,
no real database, hardcoded admin credentials, and an unenforced
quality gate) using Supabase's free tier, and the follow-up security review
(data leaks, quality-gate bypasses, XSS) with `supabase/hardening.sql`.

## 1. Create a free Supabase project
1. Go to https://supabase.com → New project (free tier is enough).
2. Wait for it to finish provisioning (~2 min).

## 2. Run the SQL (two files, in this order)
In your project: **SQL Editor → New query**, then run each file in full:

1. `supabase/schema.sql` — tables, base Row Level Security, the review RPCs.
2. `supabase/hardening.sql` — the security fixes. **Required**: the app reads
   views and calls functions that only exist after this file runs
   (`marketplace_founders`, `org_applications`, `thread_participants`,
   `increment_opportunity_views`, `record_application_click`,
   `reject_application_investor`) and signup depends on its profile trigger.

`hardening.sql` is safe to run more than once and on a database that already has data.

**Existing project?** Run only `hardening.sql`. Then deploy the new front end.
Deploy the front end *after* the SQL, never before.

## 3. Add your project keys
1. **Project Settings → API** → copy the **Project URL** and the
   **anon public** (publishable) key (NOT `service_role`).
2. Paste them into `js/supabase-config.js`.
   The anon key is safe to ship in the frontend — Supabase is
   designed this way, and RLS is what actually protects your data.
   Logged-out visitors can read nothing: every policy is `to authenticated`.

## 4. Authentication settings
In **Authentication → URL Configuration**:
- Set **Site URL** to your deployed address (for example your Netlify URL).
- Add that same address to **Redirect URLs**. "Forgot password" emails send people
  back to the page they came from, signed in with a recovery session, and
  the app then asks for a new password.

**Confirm email** can stay on (the default): the profile and the founder's startup are
created by a database trigger from the signup form data, so signup works before the
email is confirmed.

## 5. Deploy / open the app
Deploy the folder as-is (Netlify reads `netlify.toml` for the security headers).
There is no build step. The Supabase library is vendored in `js/vendor/`, so the
Content-Security-Policy needs no third-party script host.

## 6. Create your first internal reviewer account
There is no admin key anywhere in the app. Instead:
1. Sign up normally through the app as any role (e.g. founder) using
   the email you want to use for reviewing.
2. In Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'internal' where email = 'you@example.com';
   ```
3. Sign out, then log back in through **Admin sign in** on the auth
   page with that email/password.

A normal signed-up user can never grant themselves this role: the profile
insert policy blocks `role = 'internal'`, a trigger blocks role and email
changes, and the only way to set it is SQL run by the project owner.

## Tests
```
npm install
npm test
```
- `tests/rls.test.js` loads both SQL files into an in-process Postgres and tries each attack
  from the review as an ordinary user (read other people's messages, forge a passed
  quality gate, read internal review notes, change counters, escalate a role, and so on).
- `tests/events.test.js` checks the small interpreter that runs `onclick="..."` attributes
  without allowing inline scripts.

## What changed, mapped to the audits
| Finding | Fix |
|---|---|
| P0-1 Auth enforced client-side only | Real Supabase Auth sessions; every table read/write is authorized by Postgres RLS, not the browser. |
| P0-2 No real database | Postgres tables for profiles, startups, opportunities, applications, messages, notifications, saved/interested. |
| P0-3 Hardcoded admin credentials | Deleted. "Admin" = a normal account with `profiles.role = 'internal'`, settable only via direct SQL by the project owner. |
| P0-4 Quality gate not enforced server-side | Triggers reject any change to stage/gate/review fields unless the session is internal, **on insert as well as update**; gate decisions go through RPCs. |
| Messages readable by anyone who clicked "interested" | Threads are per (startup, participant). Only passed startups can be marked interesting, and only by investors and incubators. |
| Logged-out reads of startups and opportunities | Every policy is `to authenticated`; startups are visible to investors, incubators and organizers only once passed. |
| Internal review notes sent to organizations | Organizations read the `org_applications` view (unlocked applications only, no review notes) instead of the table. |
| Founder could insert a "passed" startup or application | Insert policy and trigger force un-gated defaults. |
| Application moved to another opportunity, or edited after its window | Blocked by trigger; the 10-day edit window is enforced in the database. |
| Profile email squatting, signup failing with email confirmation | Profile is created by a trigger from `auth.users`; its email always comes from there. |
| View and click counters failing for visitors | Counters move only through two RPCs. |
| Stored XSS (names, messages, notifications, titles, notes) | All user text is escaped with `esc()` before it goes into a page; toasts use `textContent`. |
| P2-1 Missing security headers | `netlify.toml`: strict CSP (`script-src 'self'`), HSTS, frame, referrer and permissions headers. |
| Forgot password did nothing | Uses Supabase password reset and a recovery screen. |
| Pages that crashed | Duplicate `OPP_TYPES` stopped the investor and organizer pages from loading; the missing `founderAppStatus` broke founder and review pages. |

## Known scope limits
- The client-side "quality check" engine in `store.js` is a *helpful preview* for
  founders (keyword rules, not AI) and never decides the gate. Only an internal
  reviewer's server-side action does, enforced by Postgres.
- Browsers log a harmless "Refused to execute inline event handler" message on each click.
  The strict CSP blocks the inline `onclick` attribute, and `js/events.js` then runs the
  same handler itself. Nothing is lost; it only adds console noise.
- Supabase's security advisor reports "Security Definer View" for `marketplace_founders`,
  `org_applications` and `thread_participants`. This is intentional: the views have to read
  tables the caller cannot read directly (founder names, application rows without review
  notes, who is interested). Each one filters by `auth.uid()` and the caller's role, and
  logged-out visitors cannot select from any of them. The advisor's "SECURITY DEFINER function
  executable" warnings for the review RPCs and RLS helpers are also intended: those functions
  check the caller's role themselves.
- Bundling and minification are not done (no build step by design).
