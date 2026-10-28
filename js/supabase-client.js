/* ============================================================
   VENTURE CONNECT — Supabase service layer
   Every network call the app makes goes through here.
   Loaded after the Supabase JS CDN script and supabase-config.js.
   ============================================================ */

const sb = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);

const DB = (() => {

  let recoveryPending = false;
  const recoveryCallbacks = [];
  // Must stay synchronous and must not call other supabase methods (it runs inside the auth lock).
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") { recoveryPending = true; recoveryCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } }); }
  });

  /* ---------------- auth ---------------- */

  // The profile (and, for founders, the first startup) is created inside the
  // database by the on_auth_user_created trigger from this metadata, so signup
  // works even when "Confirm email" is on and no session exists yet.
  async function signUp(email, password, role, profileFields, startup) {
    const meta = Object.assign({}, profileFields || {}, { role });
    if (startup) meta.startup = startup;
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
    if (error) return { ok: false, err: error.message };
    const uid = data.user && data.user.id;
    if (!uid || !data.session) {
      // Email confirmation is on: the account exists but there is no session yet.
      return { ok: true, needsConfirmation: true };
    }
    let profile = await fetchProfile(uid);
    if (!profile) {
      // Fallback for a database that has not run supabase/hardening.sql yet.
      const row = Object.assign({ id: uid, email, role }, profileFields || {});
      const { error: perr } = await sb.from("profiles").insert(row);
      if (perr) return { ok: false, err: perr.message };
      profile = await fetchProfile(uid);
    }
    return { ok: true, userId: uid, profile };
  }

  async function resetPassword(email) {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { ok: false, err: error.message } : { ok: true };
  }

  async function updatePassword(password) {
    const { error } = await sb.auth.updateUser({ password });
    return error ? { ok: false, err: error.message } : { ok: true };
  }

  // supabase-js fires PASSWORD_RECOVERY while it is still initialising (it reads the
  // recovery link from the URL), which can be before the app has booted. The listener is
  // therefore registered at load time (below) and remembers the event for late subscribers.
  function onPasswordRecovery(cb) {
    recoveryCallbacks.push(cb);
    if (recoveryPending) cb();
  }

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, err: "Incorrect email or password." };
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { ok: false, err: "No profile found for this account." };
    return { ok: true, profile };
  }

  async function signOut() {
    await sb.auth.signOut();
  }

  async function getSessionProfile() {
    const { data } = await sb.auth.getSession();
    if (!data.session) return null;
    return fetchProfile(data.session.user.id);
  }

  async function fetchProfile(id) {
    const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data;
  }

  async function updateProfile(id, patch) {
    const { data, error } = await sb.from("profiles").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  /* ---------------- startups ---------------- */

  async function fetchMyStartups(founderId) {
    const { data, error } = await sb.from("startups").select("*").eq("founder_id", founderId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Passed-gate startups visible on the discovery marketplace (investor/incubator side).
  // Internal reviewers need every startup, because they review ones that have not passed yet.
  async function fetchVisibleStartups(role) {
    let q = sb.from("startups").select("*");
    if (role !== "internal") q = q.eq("quality_gate", "passed");
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  // Founder name / college / bio for marketplace startups (view; passed gate only).
  async function fetchMarketplaceFounders() {
    const { data, error } = await sb.from("marketplace_founders").select("*");
    if (error) { console.warn("marketplace_founders unavailable (run supabase/hardening.sql):", error.message); return []; }
    return data || [];
  }

  // Internal reviewers can read founder profiles directly.
  async function fetchFounderProfiles() {
    const { data, error } = await sb.from("profiles").select("id,name,college,location,bio,skills,socials").eq("role", "founder");
    if (error) throw error;
    return data || [];
  }

  async function createStartup(row) {
    const { data, error } = await sb.from("startups").insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function updateStartup(id, patch) {
    const { data, error } = await sb.from("startups").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  /* ---------------- opportunities ---------------- */

  async function fetchOpportunities() {
    // RLS already limits rows to: published, or your own (any status), or internal.
    const { data, error } = await sb.from("opportunities").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function createOpportunity(row) {
    const { data, error } = await sb.from("opportunities").insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function incrementOpportunityViews(id) {
    const { error } = await sb.rpc("increment_opportunity_views", { p_id: id });
    if (error) throw error;
  }
  async function recordApplicationClick(id) {
    const { data, error } = await sb.rpc("record_application_click", { p_id: id });
    if (error) throw error;
    return data;
  }

  async function updateOpportunity(id, patch) {
    const { data, error } = await sb.from("opportunities").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  /* ---------------- applications ---------------- */

  async function fetchApplications(role) {
    // Founders and internal reviewers read the table (RLS: own startup's rows, or all).
    // Organizations read org_applications instead: unlocked applications to their
    // own opportunities only, with the internal review notes left out.
    if (role === "investor" || role === "incubator" || role === "organizer") {
      const v = await sb.from("org_applications").select("*").order("submitted_at", { ascending: false });
      if (!v.error) return v.data || [];
      console.warn("org_applications unavailable (run supabase/hardening.sql):", v.error.message);
    }
    const { data, error } = await sb.from("applications").select("*").order("submitted_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function createApplication(row) {
    const { data, error } = await sb.from("applications").insert(row).select().single();
    if (error) throw error;
    return data;
  }

  // Founder-only: append a new workspace snapshot version. Blocked by the
  // review-fields trigger from touching stage/gate/etc — enforced in Postgres.
  async function updateApplicationSnapshot(id, patch) {
    const { data, error } = await sb.from("applications").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  // Founder-only: respond to a clarification request (only the .response
  // sub-field is writable by a founder — status/question stay internal-only).
  async function respondClarification(id, clarificationPatch) {
    const { data, error } = await sb.from("applications").update({ clarification: clarificationPatch }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  // Internal-only generic patch (autoCheck, vcReview, pitch, interview,
  // evidenceStatus/Notes, needsRevision, rejected). The DB trigger rejects
  // this for any non-internal session regardless of what's sent.
  async function internalUpdateApplication(id, patch) {
    const { data, error } = await sb.from("applications").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  // Internal-only server-side RPCs — the quality gate itself.
  async function advanceApplication(id) {
    const { data, error } = await sb.rpc("advance_application", { p_app_id: id });
    if (error) throw error;
    return data;
  }
  async function setApplicationGate(id, passed, notes) {
    const { data, error } = await sb.rpc("set_application_gate", { p_app_id: id, p_passed: passed, p_notes: notes || "" });
    if (error) throw error;
    return data;
  }
  async function unlockApplication(id) {
    const { data, error } = await sb.rpc("unlock_application", { p_app_id: id });
    if (error) throw error;
    return data;
  }
  async function rejectApplication(id) {
    const { data, error } = await sb.rpc("reject_application", { p_app_id: id });
    if (error) throw error;
    return data;
  }
  async function requestClarification(id, question) {
    return internalUpdateApplication(id, { clarification: { status: "requested", question: question || "Please clarify the submitted information.", response: "", requestedAt: new Date().toISOString() } });
  }

  // Org/investor-only: server-side RPC checks the opportunity is theirs and the application is unlocked.
  async function rejectApplicationInvestor(id) {
    const { data: ok, error } = await sb.rpc("reject_application_investor", { p_app_id: id });
    if (error) throw error;
    if (!ok) return null;
    const { data, error: rerr } = await sb.from("org_applications").select("*").eq("id", id).maybeSingle();
    if (rerr) throw rerr;
    return data;
  }

  /* ---------------- saved / interested ---------------- */

  async function fetchSaved(userId) {
    const { data, error } = await sb.from("saved_startups").select("startup_id").eq("user_id", userId);
    if (error) throw error;
    return (data || []).map(r => r.startup_id);
  }
  async function addSaved(userId, startupId) {
    const { error } = await sb.from("saved_startups").insert({ user_id: userId, startup_id: startupId });
    if (error) throw error;
  }
  async function removeSaved(userId, startupId) {
    const { error } = await sb.from("saved_startups").delete().eq("user_id", userId).eq("startup_id", startupId);
    if (error) throw error;
  }

  async function fetchInterested(userId) {
    const { data, error } = await sb.from("interested_startups").select("startup_id").eq("user_id", userId);
    if (error) throw error;
    return (data || []).map(r => r.startup_id);
  }
  async function addInterested(userId, startupId) {
    const { error } = await sb.from("interested_startups").insert({ user_id: userId, startup_id: startupId });
    if (error) throw error;
  }
  async function removeInterested(userId, startupId) {
    const { error } = await sb.from("interested_startups").delete().eq("user_id", userId).eq("startup_id", startupId);
    if (error) throw error;
  }

  /* ---------------- messages ---------------- */

  // Accepts one startup id or an array. RLS decides which threads come back: an
  // investor/incubator gets only their own thread, a founder gets every thread on their startups.
  async function fetchMessages(startupIds) {
    const ids = Array.isArray(startupIds) ? startupIds : [startupIds];
    if (!ids.length) return [];
    const { data, error } = await sb.from("messages").select("*").in("startup_id", ids).order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  // Display name / organisation of the people who marked a founder's startups as interesting.
  async function fetchThreadParticipants() {
    const { data, error } = await sb.from("thread_participants").select("*");
    if (error) { console.warn("thread_participants unavailable (run supabase/hardening.sql):", error.message); return []; }
    return data || [];
  }
  // participantId = the investor/incubator side of the thread. Investors pass their own id;
  // a founder replying passes the id of the participant they are answering.
  async function sendMessage(startupId, senderId, participantId, body) {
    const { data, error } = await sb.from("messages").insert({ startup_id: startupId, sender_id: senderId, participant_id: participantId, body }).select().single();
    if (error) throw error;
    return data;
  }

  /* ---------------- notifications ---------------- */

  async function fetchNotifications(userId) {
    const { data, error } = await sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function markNotificationsRead(userId) {
    const { error } = await sb.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    if (error) throw error;
  }

  return {
    signUp, signIn, signOut, getSessionProfile, fetchProfile, updateProfile, resetPassword, updatePassword, onPasswordRecovery,
    fetchMyStartups, fetchVisibleStartups, fetchMarketplaceFounders, fetchFounderProfiles, createStartup, updateStartup,
    fetchOpportunities, createOpportunity, updateOpportunity, incrementOpportunityViews, recordApplicationClick,
    fetchApplications, createApplication, updateApplicationSnapshot, respondClarification,
    internalUpdateApplication, advanceApplication, setApplicationGate, unlockApplication, rejectApplication, requestClarification, rejectApplicationInvestor,
    fetchSaved, addSaved, removeSaved, fetchInterested, addInterested, removeInterested,
    fetchMessages, fetchThreadParticipants, sendMessage, fetchNotifications, markNotificationsRead
  };
})();
