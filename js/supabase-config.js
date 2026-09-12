/* ============================================================
   VENTURE CONNECT — Supabase project config

   Fill these two values in from your own Supabase project:
   Supabase Dashboard → Project Settings → API.

   SUPABASE_URL    = "Project URL"
   SUPABASE_ANON_KEY = "anon public" key (NOT the service_role key)

   Note: the anon key is SAFE to ship in your frontend bundle —
   Supabase is designed this way. It has no power on its own; every
   table it touches is protected by the Row Level Security policies
   in supabase/schema.sql. Never put the service_role key here or
   anywhere in frontend code — that key bypasses RLS entirely.
   ============================================================ */

window.SUPABASE_CONFIG = {
  url: "https://txdfslazkixlvwfunllj.supabase.co",
  anonKey: "sb_publishable_-F6ebDIUkj7sBFOevcqXCw_bssgcwCG"
};
