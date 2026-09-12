# Venture Connect — Supabase backend setup

This closes audit findings P0-1 through P0-4 (client-side-only auth,
no real database, hardcoded admin credentials, and an unenforced
quality gate) using Supabase's free tier.

## 1. Create a free Supabase project
1. Go to https://supabase.com → New project (free tier is enough).
2. Wait for it to finish provisioning (~2 min).

## 2. Run the schema
1. In your project: **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and run it.
   This creates every table, Row Level Security policy, and the
   server-side triggers/RPCs that enforce the quality gate.

## 3. Add your project keys
1. **Project Settings → API** → copy the **Project URL** and the
   **anon public** key (NOT `service_role`).
2. Paste them into `js/supabase-config.js`.
   The anon key is safe to ship in the frontend — Supabase is
   designed this way, and RLS is what actually protects your data.

## 4. Deploy / open the app
Deploy the folder as-is (Netlify, Vercel, or just open `index.html`
locally). On load it now calls `Store.init()`, which talks to
Supabase instead of reading `localStorage`.

## 5. Create your first internal reviewer account
There is no admin key anywhere in the app anymore (that was P0-3).
Instead:
1. Sign up normally through the app as any role (e.g. founder) using
   the email you want to use for reviewing.
2. In Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'internal' where email = 'you@example.com';
   ```
3. Sign out, then log back in through **Admin sign in** on the auth
   page with that email/password.

A normal signed-up user can never grant themselves this role — the
`profiles` insert policy blocks `role = 'internal'` outright, and the
only way to set it is by running SQL directly against the database,
which bypasses RLS.

## What changed, mapped to the audit
| Audit item | Fix |
|---|---|
| P0-1 Auth enforced client-side only | Real Supabase Auth sessions; every table read/write is authorized by Postgres RLS, not the browser. |
| P0-2 No real database | Postgres tables for profiles, startups, opportunities, applications, messages, notifications, saved/interested. |
| P0-3 Hardcoded admin credentials | Deleted. "Admin" = a normal account with `profiles.role = 'internal'`, settable only via direct SQL by the project owner. |
| P0-4 Quality gate not enforced server-side | `applications` table has a `BEFORE UPDATE` trigger that rejects any change to stage/gate/review fields unless the session's role is `internal`; gate decisions go through dedicated Postgres RPCs (`set_application_gate`, `advance_application`, `unlock_application`, `reject_application`). |
| P2-1 Missing security headers | `netlify.toml` added with CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |

## Known scope limits (be aware of these)
- **Email confirmation**: if your Supabase project has "Confirm email"
  turned on (default), a brand-new signup won't get a session until
  the user clicks the confirmation email. You can turn this off for
  testing in **Authentication → Providers → Email**.
- The client-side "quality check" engine in `store.js` is unchanged —
  it's a *helpful preview* for founders and never decides the gate.
  Only an internal reviewer's server-side action does, enforced by
  Postgres.
- P1/P2/P3 items from the report (mobile nav, `<form>` tags, XSS
  sanitization, SEO metadata, bundling/minification) are not addressed
  by this change — they're separate frontend fixes, not backend ones.
