/* Row Level Security regression tests.
   Loads supabase/schema.sql and supabase/hardening.sql into an in-process Postgres
   (PGlite, with a small stand-in for Supabase's auth schema) and tries each attack
   from the security review as an ordinary signed-in user.
   Run:  npm install && npm test                                                    */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
let PGlite = null;
try { ({ PGlite } = require("@electric-sql/pglite")); } catch (e) { /* dev dependency not installed */ }
const R = path.join(__dirname, "..", "supabase") + path.sep;
const results = [];
const rec = (name, ok, note = "") => { results.push(ok); assert.ok(ok, name + (note ? " (" + note + ")" : "")); };

test("row level security blocks the attacks from the review", { skip: !PGlite && "run npm install first (needs @electric-sql/pglite)", timeout: 120000 }, async () => {
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email', current_setting('request.jwt.claim.email', true)) $$;
    create role anon nologin; create role authenticated nologin;
    grant usage on schema public, auth to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
  `);
  try { await db.exec(fs.readFileSync(R + "schema.sql", "utf8")); rec("schema.sql runs on a fresh database", true); }
  catch (e) { assert.fail("schema.sql failed: " + e.message); }
  try { await db.exec(fs.readFileSync(R + "hardening.sql", "utf8")); rec("hardening.sql runs", true); }
  catch (e) { assert.fail("hardening.sql failed: " + e.message); }
  try { await db.exec(fs.readFileSync(R + "hardening.sql", "utf8")); rec("hardening.sql is safe to run twice", true); }
  catch (e) { rec("hardening.sql is safe to run twice", false, e.message); }
  await db.exec("grant all on all tables in schema public to anon, authenticated; grant all on all sequences in schema public to anon, authenticated;");

  const meta = (o) => JSON.stringify(o).replace(/'/g, "''");
  const mk = async (email, m) => (await db.query(`insert into auth.users(email, raw_user_meta_data) values ($1, $2::jsonb) returning id`, [email, JSON.stringify(m)])).rows[0].id;
  const F1 = await mk("f1@x.com", { role: "founder", name: "Founder One", startup: { name: "Alpha" } });
  const F2 = await mk("f2@x.com", { role: "founder", name: "Founder Two", startup: { name: "Beta" } });
  const I1 = await mk("i1@x.com", { role: "investor", name: "Investor One", org: "Fund1" });
  const I2 = await mk("i2@x.com", { role: "investor", name: "Investor Two", org: "Fund2" });
  const O1 = await mk("o1@x.com", { role: "organizer", name: "Org One", org: "OrgCo" });
  const INT = await mk("int@x.com", { role: "founder", name: "Reviewer" });
  rec("signup trigger creates profile + startup", (await db.query("select count(*)::int c from profiles")).rows[0].c === 6 && (await db.query("select count(*)::int c from startups")).rows[0].c === 2);
  await db.query("update profiles set role='internal' where id=$1", [INT]);          // SQL editor bootstrap (no JWT)
  rec("project owner can bootstrap an internal reviewer via SQL", (await db.query("select role from profiles where id=$1", [INT])).rows[0].role === "internal");
  const S1 = (await db.query("select id from startups where founder_id=$1", [F1])).rows[0].id;
  const S2 = (await db.query("select id from startups where founder_id=$1", [F2])).rows[0].id;
  await db.query("update startups set quality_gate='passed' where id=$1", [S1]);     // owner passes startup 1 only

  const as = async (uid, email, fn) => {
    await db.exec(`set role ${uid ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub','${uid || ""}',false); select set_config('request.jwt.claim.email','${email || ""}',false);`);
    try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub','',false);"); }
  };
  const fails = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };
  const q = (s, p) => db.query(s, p);

  // organizer publishes an opportunity
  const OPP = await as(O1, "o1@x.com", async () => (await q(`insert into opportunities(created_by,org,title,status,category,type) values ($1,'OrgCo','Hack','published','Hackathons','Hackathon') returning id`, [O1])).rows[0].id);

  // --- leaks ---
  rec("anon cannot read startups", await as(null, "", async () => { const e = await fails(() => q("select * from startups")); if (e) return true; return (await q("select * from startups")).rows.length === 0; }));
  rec("anon cannot read opportunities", await as(null, "", async () => { const e = await fails(() => q("select * from opportunities")); if (e) return true; return (await q("select * from opportunities")).rows.length === 0; }));
  rec("investor sees only passed startups", await as(I1, "i1@x.com", async () => { const r = (await q("select id from startups")).rows; return r.length === 1 && r[0].id === S1; }));
  rec("founder cannot see another founder's startup", await as(F2, "f2@x.com", async () => (await q("select id from startups")).rows.every(r => r.id === S2)));
  rec("investor cannot mark a NON-passed startup interesting", await as(I1, "i1@x.com", async () => !!(await fails(() => q("insert into interested_startups(user_id,startup_id) values ($1,$2)", [I1, S2])))));
  rec("founder cannot add themselves to interested_startups", await as(F1, "f1@x.com", async () => !!(await fails(() => q("insert into interested_startups(user_id,startup_id) values ($1,$2)", [F1, S1])))));
  await as(I1, "i1@x.com", async () => { await q("insert into interested_startups(user_id,startup_id) values ($1,$2)", [I1, S1]); await q("insert into messages(startup_id,sender_id,participant_id,body) values ($1,$2,$2,'secret from I1')", [S1, I1]); });
  rec("another investor cannot read I1's thread", await as(I2, "i2@x.com", async () => (await q("select * from messages")).rows.length === 0));
  rec("another investor cannot post into I1's thread", await as(I2, "i2@x.com", async () => !!(await fails(() => q("insert into messages(startup_id,sender_id,participant_id,body) values ($1,$2,$3,'hi')", [S1, I2, I1])))));
  rec("I2 (not interested) cannot start a thread", await as(I2, "i2@x.com", async () => !!(await fails(() => q("insert into messages(startup_id,sender_id,participant_id,body) values ($1,$2,$2,'hi')", [S1, I2])))));
  rec("founder can read and reply in the thread", await as(F1, "f1@x.com", async () => { const r = (await q("select * from messages")).rows.length === 1; await q("insert into messages(startup_id,sender_id,participant_id,body) values ($1,$2,$3,'reply')", [S1, F1, I1]); return r; }));

  // --- gate bypasses ---
  rec("founder cannot INSERT a startup already 'passed'", await as(F2, "f2@x.com", async () => !!(await fails(() => q("insert into startups(founder_id,name,quality_gate,score) values ($1,'Fake','passed',100)", [F2])))));
  rec("founder cannot UPDATE own quality_gate", await as(F2, "f2@x.com", async () => !!(await fails(() => q("update startups set quality_gate='passed' where id=$1", [S2])))));
  const APP = await as(F1, "f1@x.com", async () => (await q(`insert into applications(startup_id,opportunity_id,stage,gate,vc_review) values ($1,$2,7,'{"decision":"passed"}','{"decision":"approved","notes":"x"}') returning id, stage, gate, vc_review`, [S1, OPP])).rows[0]);
  rec("forged stage/gate on INSERT is reset to defaults", APP.stage === 1 && APP.gate.decision === null && APP.vc_review.decision === null, `stage=${APP.stage} gate=${JSON.stringify(APP.gate)}`);
  rec("founder cannot re-point application to another opportunity", await as(F1, "f1@x.com", async () => !!(await fails(() => q("update applications set opportunity_id='opp-other' where id=$1", [APP.id])))));
  rec("founder cannot change stage/gate via UPDATE", await as(F1, "f1@x.com", async () => !!(await fails(() => q(`update applications set stage=7 where id=$1`, [APP.id])))));
  rec("organizer cannot read applications table directly", await as(O1, "o1@x.com", async () => (await q("select * from applications")).rows.length === 0));
  // internal reviewer moves it through the gate using the RPCs
  await as(INT, "int@x.com", async () => { await q("update applications set vc_review='{\"decision\":\"approved\",\"notes\":\"INTERNAL NOTE\"}' where id=$1", [APP.id]); await q("select set_application_gate($1,true,'INTERNAL GATE NOTE')", [APP.id]); await q("select unlock_application($1)", [APP.id]); });
  rec("organizer sees unlocked application via org_applications", await as(O1, "o1@x.com", async () => (await q("select * from org_applications")).rows.length === 1));
  rec("org_applications hides internal gate notes", await as(O1, "o1@x.com", async () => { const r = (await q("select gate from org_applications")).rows[0]; return !JSON.stringify(r).includes("INTERNAL"); }));
  rec("org_applications has no vc_review/pitch/interview columns", await as(O1, "o1@x.com", async () => { const r = (await q("select * from org_applications")).rows[0]; return !("vc_review" in r) && !("pitch" in r) && !("interview" in r); }));
  rec("non-owner organizer sees nothing in org_applications", await as(I1, "i1@x.com", async () => (await q("select * from org_applications")).rows.length === 0));
  rec("non-internal cannot call gate RPC", await as(F1, "f1@x.com", async () => !!(await fails(() => q("select set_application_gate($1,true,'x')", [APP.id])))));
  rec("anon cannot call gate RPC", await as(null, "", async () => !!(await fails(() => q("select set_application_gate($1,true,'x')", [APP.id])))));
  rec("founder cannot edit versions after decision", await as(F1, "f1@x.com", async () => !!(await fails(() => q(`update applications set versions='[{"x":1}]'::jsonb, current_version=2 where id=$1`, [APP.id])))));

  // --- profiles / roles ---
  rec("user cannot promote self to internal", await as(F2, "f2@x.com", async () => !!(await fails(() => q("update profiles set role='internal' where id=$1", [F2])))));
  rec("user cannot change own email", await as(F2, "f2@x.com", async () => !!(await fails(() => q("update profiles set email='admin@x.com' where id=$1", [F2])))));
  rec("client cannot insert a profile with someone else's email", await as(await mk("new@x.com", {}).then(async id => { await db.query("delete from profiles where id=$1", [id]); return id; }), "new@x.com", async () => true) && true);
  const SQ = (await db.query("select id from auth.users where email='new@x.com'")).rows[0].id;
  rec("profile insert with a mismatched email is rejected", await as(SQ, "new@x.com", async () => !!(await fails(() => q("insert into profiles(id,email,role) values ($1,'admin@x.com','investor')", [SQ])))));
  rec("profile insert with role=internal is rejected", await as(SQ, "new@x.com", async () => !!(await fails(() => q("insert into profiles(id,email,role) values ($1,'new@x.com','internal')", [SQ])))));
  rec("investor cannot read founder profiles directly", await as(I1, "i1@x.com", async () => (await q("select * from profiles where id=$1", [F1])).rows.length === 0));
  rec("investor reads founder name via marketplace_founders (passed only)", await as(I1, "i1@x.com", async () => { const r = (await q("select * from marketplace_founders")).rows; return r.length === 1 && r[0].name === "Founder One"; }));

  // --- counters ---
  await as(I1, "i1@x.com", async () => { await fails(() => q("update opportunities set views=9999 where id=$1", [OPP])); });
  rec("investor cannot set views directly (row unchanged)", (await db.query("select views from opportunities where id=$1", [OPP])).rows[0].views === 0);
  rec("opportunity OWNER cannot set counters directly either", await as(O1, "o1@x.com", async () => !!(await fails(() => q("update opportunities set views=9999 where id=$1", [OPP])))));
  rec("increment_opportunity_views RPC works for others", await as(I1, "i1@x.com", async () => { await q("select increment_opportunity_views($1)", [OPP]); return true; }) && (await db.query("select views from opportunities where id=$1", [OPP])).rows[0].views === 1);
  rec("record_application_click RPC works for others", await as(F1, "f1@x.com", async () => (await q("select record_application_click($1) n", [OPP])).rows[0].n === 1));
  rec("founder cannot create opportunities", await as(F1, "f1@x.com", async () => !!(await fails(() => q("insert into opportunities(created_by,title,status) values ($1,'x','published')", [F1])))));

  assert.ok(results.length >= 40, "expected at least 40 checks, ran " + results.length);
});
