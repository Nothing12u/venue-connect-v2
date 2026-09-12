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

  /* ---------------- auth ---------------- */

  async function signUp(email, password, role, profileFields) {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { ok: false, err: error.message };
    const uid = data.user && data.user.id;
    if (!uid) {
      // Email confirmation is on: no session/user id yet.
      return { ok: false, err: "Check your inbox to confirm your email, then log in." };
    }
    const row = Object.assign({ id: uid, email, role }, profileFields || {});
    const { error: perr } = await sb.from("profiles").insert(row);
    if (perr) return { ok: false, err: perr.message };
    return { ok: true, userId: uid };
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
  async function fetchVisibleStartups() {
    const { data, error } = await sb.from("startups").select("*").eq("quality_gate", "passed");
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

  async function updateOpportunity(id, patch) {
    const { data, error } = await sb.from("opportunities").update(patch).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  }

  /* ---------------- applications ---------------- */

  async function fetchApplications() {
    // RLS scopes this to: your own startup's applications, applications to
    // your opportunities that have been unlocked, or all of them if internal.
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

  // Org/investor-only, permitted by applications_update_opportunity_owner_investor_action.
  async function rejectApplicationInvestor(id) {
    const { data, error } = await sb.from("applications").update({ investor_action: "rejected" }).eq("id", id).select().maybeSingle();
    if (error) throw error;
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

  async function fetchMessages(startupId) {
    const { data, error } = await sb.from("messages").select("*").eq("startup_id", startupId).order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  async function sendMessage(startupId, senderId, body) {
    const { data, error } = await sb.from("messages").insert({ startup_id: startupId, sender_id: senderId, body }).select().single();
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
    signUp, signIn, signOut, getSessionProfile, fetchProfile, updateProfile,
    fetchMyStartups, fetchVisibleStartups, createStartup, updateStartup,
    fetchOpportunities, createOpportunity, updateOpportunity,
    fetchApplications, createApplication, updateApplicationSnapshot, respondClarification,
    internalUpdateApplication, advanceApplication, setApplicationGate, unlockApplication, rejectApplication, requestClarification, rejectApplicationInvestor,
    fetchSaved, addSaved, removeSaved, fetchInterested, addInterested, removeInterested,
    fetchMessages, sendMessage, fetchNotifications, markNotificationsRead
  };
})();
