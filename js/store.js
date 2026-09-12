/* ============================================================
   VENTURE CONNECT — State store
   Backed by Supabase (Postgres + Auth). `state` below is an
   in-memory CACHE ONLY, hydrated from Supabase on load and kept in
   sync on every write, so existing render code can keep reading it
   synchronously. Supabase — not this cache, not the browser — is
   the source of truth and the place every rule is actually enforced
   (see supabase/schema.sql for the RLS policies + triggers).
   ============================================================ */

const Store = (() => {

  const DEFAULT_WORKSPACE = {
    problem: "", solution: "", targetCustomer: "", market: "", businessModel: "",
    validation: "", competition: "", advantage: "", funding: "", useOfFunds: ""
  };
  const DEFAULT_FOUNDER_PROFILE = { name: "", college: "", location: "", skills: [], bio: "", socials: { linkedin: "", twitter: "", github: "" }, startupId: null, stageIdx: 0, workspace: Object.assign({}, DEFAULT_WORKSPACE) };
  const DEFAULT_INVESTOR_PROFILE = { name: "", org: "", title: "", bio: "", sectors: [], stages: [], ticketSize: "", location: "", socials: { linkedin: "", twitter: "", website: "" } };
  const DEFAULT_INCUBATOR_PROFILE = { name: "", org: "", type: "", bio: "", sectors: [], stages: [], supportTypes: [], location: "", socials: { linkedin: "", twitter: "", website: "" } };
  const DEFAULT_ORGANIZER_PROFILE = { name: "", org: "", type: "", bio: "", domains: [], location: "", socials: { linkedin: "", twitter: "", website: "" } };

  function defaults() {
    return {
      role: null,
      founder: Object.assign({}, DEFAULT_FOUNDER_PROFILE),
      investor: Object.assign({}, DEFAULT_INVESTOR_PROFILE),
      incubator: Object.assign({}, DEFAULT_INCUBATOR_PROFILE),
      organizer: Object.assign({}, DEFAULT_ORGANIZER_PROFILE),
      internal: Object.assign({}, INTERNAL_USER),
      session: null,           // { id, email }
      userStartups: [],
      opportunities: [],
      applications: [],
      saved: [],
      interested: [],
      queue: [],
      messages: {},
      notifications: [],
      notifRead: true,
      reviewResults: {}
    };
  }

  let state = defaults();

  /* ---------------- row <-> app-shape mapping ---------------- */

  function startupFromRow(r) {
    return {
      id: r.id, founderId: r.founder_id, name: r.name, tagline: r.tagline, sector: r.sector,
      stage: r.stage, location: r.location, logo: r.logo, qualityGate: r.quality_gate,
      score: r.score, scoreBreak: r.score_break || {}, fundingAsk: r.funding_ask,
      problem: r.problem, solution: r.solution, targetCustomer: r.target_customer, market: r.market,
      businessModel: r.business_model, validation: r.validation, competition: r.competition,
      advantage: r.advantage, useOfFunds: r.use_of_funds, workspace: r.workspace || Object.assign({}, DEFAULT_WORKSPACE),
      team: r.team || [], milestones: r.milestones || [], evidence: r.evidence || [],
      submitted: (r.created_at || "").slice(0, 10), lastActivity: "Synced"
    };
  }

  function oppFromRow(r) {
    return Object.assign({
      id: r.id, createdBy: r.org, ownerId: r.created_by, org: r.org, category: r.category, type: r.type,
      title: r.title, description: r.description, desc: r.description, status: r.status, applicationMode: r.application_mode,
      applicationUrl: r.application_url, teamRequirements: r.team_requirements, eventDate: r.event_date,
      views: r.views || 0, applicationLinkClicks: r.application_link_clicks || 0,
      createdAt: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }, r.details || {});
  }

  function appFromRow(r) {
    return {
      id: r.id, startupId: r.startup_id, opportunityId: r.opportunity_id,
      submittedAt: r.submitted_at, createdAt: r.submitted_at, lastUpdatedAt: r.last_updated_at, updatedBy: r.updated_by,
      submitted: new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastUpdate: new Date(r.last_updated_at).toLocaleString(),
      versions: r.versions || [], currentVersion: r.current_version, clarification: r.clarification,
      stage: r.stage, needsRevision: r.needs_revision, rejected: r.rejected,
      vcReview: r.vc_review || { decision: null, notes: "" }, pitch: r.pitch || { scores: {}, decision: null, notes: "" },
      interview: r.interview || { scheduled: "", completed: false, notes: "", decision: null },
      autoCheck: r.auto_check, evidenceStatus: r.evidence_status || {}, evidenceNotes: r.evidence_notes || {},
      gate: r.gate || { decision: null, notes: "", decidedAt: null }, investorAction: r.investor_action || null
    };
  }

  function profileIntoRole(role, row) {
    const socials = row.socials || {};
    if (role === "founder") return Object.assign({}, DEFAULT_FOUNDER_PROFILE, { name: row.name, college: row.college, location: row.location, skills: row.skills || [], bio: row.bio, socials, startupId: null });
    if (role === "investor") return Object.assign({}, DEFAULT_INVESTOR_PROFILE, { name: row.name, org: row.org, title: row.title, bio: row.bio, sectors: row.sectors || [], stages: row.stages || [], ticketSize: row.ticket_size, location: row.location, socials });
    if (role === "incubator") return Object.assign({}, DEFAULT_INCUBATOR_PROFILE, { name: row.name, org: row.org, type: row.org_type, bio: row.bio, sectors: row.sectors || [], stages: row.stages || [], supportTypes: row.support_types || [], location: row.location, socials });
    if (role === "organizer") return Object.assign({}, DEFAULT_ORGANIZER_PROFILE, { name: row.name, org: row.org, type: row.org_type, bio: row.bio, domains: row.domains || [], location: row.location, socials });
    return Object.assign({}, INTERNAL_USER);
  }

  /* ---------------- boot / session ---------------- */

  // Call once at app startup, before the first render. Populates the
  // in-memory cache for whoever is (or isn't) currently logged in.
  async function init() {
    state = defaults();
    const profile = await DB.getSessionProfile();
    if (!profile) return state;
    await hydrateForProfile(profile);
    return state;
  }

  async function hydrateForProfile(profile) {
    state.session = { id: profile.id, email: profile.email };
    state.role = profile.role;
    state[profile.role] = profileIntoRole(profile.role, profile);

    const [myStartups, visible, opps, apps, saved, interested, notifs] = await Promise.all([
      profile.role === "founder" ? DB.fetchMyStartups(profile.id) : Promise.resolve([]),
      DB.fetchVisibleStartups(),
      DB.fetchOpportunities(),
      DB.fetchApplications(),
      DB.fetchSaved(profile.id),
      DB.fetchInterested(profile.id),
      DB.fetchNotifications(profile.id)
    ]);

    const merged = new Map();
    myStartups.forEach(r => merged.set(r.id, startupFromRow(r)));
    visible.forEach(r => { if (!merged.has(r.id)) merged.set(r.id, startupFromRow(r)); });
    state.userStartups = [...merged.values()];

    if (profile.role === "founder" && myStartups[0]) {
      state.founder.startupId = myStartups[0].id;
      state.founder.workspace = myStartups[0].workspace || Object.assign({}, DEFAULT_WORKSPACE);
    }

    state.opportunities = opps.map(oppFromRow);
    state.applications = apps.map(appFromRow);
    state.saved = saved;
    state.interested = interested;
    state.notifications = notifs.map(n => ({ id: n.id, text: n.text, read: n.read, time: new Date(n.created_at).toLocaleString() }));

    const convStartupIds = new Set([
      ...(profile.role === "founder" ? myStartups.map(s => s.id) : []),
      ...interested
    ]);
    await Promise.all([...convStartupIds].map(sid => loadConversation(sid)));
  }

  function reset() { return DB.signOut().then(init); }

  /* ---------------- authentication ---------------- */

  const getRole = () => state.role;
  const setRole = (r) => { state.role = r; };
  const founder = () => state.founder;
  const investor = () => state.investor;
  const incubator = () => state.incubator;
  const organizer = () => state.organizer;
  const internal = () => state.internal;
  const me = () => {
    if (state.role === "investor") return state.investor;
    if (state.role === "incubator") return state.incubator;
    if (state.role === "organizer") return state.organizer;
    if (state.role === "internal") return state.internal;
    return state.founder;
  };
  const org = () => {
    if (state.role === "incubator") return state.incubator.org;
    if (state.role === "organizer") return state.organizer.org;
    return state.investor.org;
  };
  const sessionUser = () => state.session ? { email: state.session.email, role: state.role } : null;

  // role: 'founder' | 'investor' | 'incubator' | 'organizer'. Never 'internal' —
  // that role can only be granted later by the project owner directly in the
  // Supabase dashboard (see bottom of supabase/schema.sql). This is what
  // closes P0-3: there is no client-reachable path to an admin account.
  const registerAccount = async (email, password, role, profileFields) => {
    const res = await DB.signUp(email, password, role, profileFields);
    if (!res.ok) return res;
    const profile = await DB.fetchProfile(res.userId);
    await hydrateForProfile(profile);
    return { ok: true, profile };
  };

  const login = async (email, password) => {
    const res = await DB.signIn(email, password);
    if (!res.ok) return res;
    await hydrateForProfile(res.profile);
    return { ok: true, account: { name: res.profile.name || res.profile.org || res.profile.email, role: res.profile.role } };
  };

  // Admin sign-in is now just a normal Supabase Auth login. There is no
  // separate key — access is granted purely by profiles.role = 'internal'
  // in the database, which only the project owner can set via SQL.
  const adminLogin = async (email, password) => {
    const res = await login(email, password);
    if (!res.ok) return res;
    if (state.role !== "internal") {
      await signOut();
      return { ok: false, err: "This account does not have internal reviewer access." };
    }
    return { ok: true, account: { name: "Venture Connect Review", role: "internal" } };
  };

  const signOut = async () => { await DB.signOut(); state = defaults(); };

  /* new founder's startup, created in Postgres */
  const addUserStartup = async (data) => {
    const row = await DB.createStartup({
      founder_id: state.session.id,
      name: data.name || "My Startup",
      tagline: (data.description || "A student venture in the Venture Connect ecosystem.").slice(0, 80),
      sector: data.industry || "Other", stage: data.stage || "Idea Stage", location: data.location || "India",
      team: [{ name: data.founderName || "Founder", role: "Founder", detail: data.college || "" }],
      milestones: [{ name: "Complete the Idea Workspace", done: false }]
    });
    const startup = startupFromRow(row);
    state.userStartups.unshift(startup);
    state.founder.startupId = startup.id;
    return startup;
  };

  const myStartup = () => {
    if (state.founder.startupId) return state.userStartups.find(s => s.id === state.founder.startupId) || null;
    return state.userStartups[0] || null;
  };
  const getStartup = (id) => state.userStartups.find(s => s.id === id) || null;

  /* ---------------- quality gate stage indicator (UI only, not persisted) ---------------- */
  const stageIdx = () => state.founder.stageIdx;
  const setStageIdx = (i) => { state.founder.stageIdx = Math.max(0, Math.min(GATE_STAGES.length - 1, i)); };
  const advanceStage = () => {
    if (state.founder.stageIdx < GATE_STAGES.length - 1) { state.founder.stageIdx += 1; return true; }
    return false;
  };
  const stageState = (i) => {
    const cur = state.founder.stageIdx;
    if (i < cur) return "done";
    if (i === cur) return "current";
    return "pending";
  };

  /* ---------------- workspace ---------------- */
  const workspace = () => state.founder.workspace;
  const updateWorkspace = async (key, value) => {
    state.founder.workspace[key] = value; // optimistic local update
    const s = myStartup();
    if (s) {
      s.workspace = state.founder.workspace;
      await DB.updateStartup(s.id, { workspace: state.founder.workspace });
    }
  };
  const workspaceCompletion = () => {
    const w = state.founder.workspace;
    const filled = WORKSPACE_SECTIONS.filter(s => (w[s.key] || "").trim().length >= 25).length;
    return Math.round((filled / WORKSPACE_SECTIONS.length) * 100);
  };

  /* ---------------- investor lists ---------------- */
  const isSaved = (id) => state.saved.includes(id);
  const toggleSaved = async (id) => {
    if (isSaved(id)) { state.saved = state.saved.filter(x => x !== id); await DB.removeSaved(state.session.id, id); }
    else { state.saved = [...state.saved, id]; await DB.addSaved(state.session.id, id); }
    return isSaved(id);
  };
  const isInterested = (id) => state.interested.includes(id);
  const toggleInterested = async (id) => {
    if (isInterested(id)) { state.interested = state.interested.filter(x => x !== id); await DB.removeInterested(state.session.id, id); }
    else {
      state.interested = [...state.interested, id];
      await DB.addInterested(state.session.id, id);
      const s = getStartup(id);
      if (s && !state.messages[id]) {
        await loadConversation(id);
      }
    }
    return isInterested(id);
  };
  const removeFromQueue = (id) => { state.queue = state.queue.filter(x => x !== id); };

  /* ---------------- messaging ---------------- */
  async function loadConversation(startupId) {
    const s = getStartup(startupId);
    if (!s) return null;
    const rows = await DB.fetchMessages(startupId);
    state.messages[startupId] = {
      startupId,
      partner: { name: s.founder ? s.founder.name : s.name, role: "Founder, " + s.name },
      items: rows.map(r => ({ from: r.sender_id === state.session.id ? "me" : "partner", text: r.body, time: new Date(r.created_at).toLocaleString() }))
    };
    return state.messages[startupId];
  }
  const conversations = () => state.messages;
  const getConversation = (id) => state.messages[id] || null;
  const sendMessage = async (convId, text) => {
    const row = await DB.sendMessage(convId, state.session.id, text);
    if (!state.messages[convId]) await loadConversation(convId);
    state.messages[convId].items.push({ from: "me", text: row.body, time: new Date(row.created_at).toLocaleString() });
    return state.messages[convId];
  };

  /* ---------------- notifications ---------------- */
  const notifications = () => state.notifications;
  const unreadCount = () => state.notifications.filter(n => !n.read).length;
  const markNotifsRead = async () => {
    state.notifications.forEach(n => n.read = true);
    state.notifRead = true;
    if (state.session) await DB.markNotificationsRead(state.session.id);
  };

  /* ---------------- review results (investor QC page, local-only scratchpad) ---------------- */
  const reviewResults = () => state.reviewResults;
  const setReviewResult = (id, status) => { state.reviewResults[id] = { status, ranAt: new Date().toLocaleString() }; };

  /* ============================================================
     APPLICATION QUALITY CHECK ENGINE (unchanged — pure function,
     runs the same rule-based + meaning-based heuristics client-side
     as a *helpful preview* for founders. It does NOT decide the
     gate — only an internal reviewer's server-side action does that.)
     ============================================================ */

  const RE_PLACEHOLDER = /(lorem|ipsum|xxx+|tbd|todo|placeholder|asdf|待定|待補充|test answer|sample text|change me)/i;
  const STOPWORDS = new Set(["the","a","an","and","or","but","for","with","that","this","these","those","from","are","our","your","their","its","was","were","will","have","has","had","not","can","who","what","when","where","how","which","into","over","under","than","then","they","them","we","us","you","it","of","in","on","at","to","is","be","by","as","so","do","does","up","down"]);
  const SEGMENT_WORDS = /(student|farmer|hospital|school|college|campus|smallholder|small|micro|local|urban|rural|enterprise|smb|businesses|vendor|patient|parent|teacher|creator|freelancer|retail|restaurant|university|club|lab|cafeteria|family)/i;
  const REVENUE_WORDS = /(subscription|saas|commission|fee|freemium|license|advertis|sell|sale|revenue|margin|per seat|monthly|annual|%)/i;
  const EVIDENCE_WORDS = /(interview|survey|pilot|prototype|waitlist|beta|users|letters?|feedback|revenue|signup|download|trial|test|mou|loi|study|deploy)/i;
  const FUNDING_USE_WORDS = /(team|engineering|marketing|product|ops|operations|hardware|manufacturing|sales|trial|legal|compliance|design|%|buffer|build|hiring|expansion)/i;

  function tokens(text) { return (text || "").toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3 && !STOPWORDS.has(t)); }
  function overlap(a, b) { const ta = new Set(tokens(a)); return tokens(b).filter(t => ta.has(t)).length; }

  function ruleChecks(w, founderProfile) {
    const checks = [];
    const trimmed = {};
    WORKSPACE_SECTIONS.forEach(s => { trimmed[s.key] = (w[s.key] || "").trim(); });
    for (const s of WORKSPACE_SECTIONS) {
      const v = trimmed[s.key];
      if (!v) checks.push({ section: s.key, label: s.label, kind: "rule", status: "fail", title: "Missing required field", msg: s.label + " is empty. Add a specific answer so reviewers understand this section.", act: "Write 2–4 sentences answering: " + s.q });
      else if (v.length < 40) checks.push({ section: s.key, label: s.label, kind: "rule", status: "fail", title: "Answer too short", msg: "Your " + s.label.toLowerCase() + " answer is only " + v.length + " characters. Reviewers need enough detail to evaluate it.", act: "Expand to at least 40 characters with concrete specifics." });
      else if (RE_PLACEHOLDER.test(v)) checks.push({ section: s.key, label: s.label, kind: "rule", status: "fail", title: "Placeholder text detected", msg: s.label + " looks like placeholder text.", act: "Replace with your real answer." });
    }
    const keys = WORKSPACE_SECTIONS.map(s => s.key);
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = trimmed[keys[i]], b = trimmed[keys[j]];
      if (a && b && a.length > 40 && (a === b || a.includes(b) || b.includes(a))) {
        const labelA = WORKSPACE_SECTIONS.find(s => s.key === keys[i]).label;
        const labelB = WORKSPACE_SECTIONS.find(s => s.key === keys[j]).label;
        checks.push({ section: keys[i], kind: "rule", status: "fail", title: "Repeated answer", msg: labelA + " and " + labelB + " contain the same text. Duplicated answers reduce credibility.", act: "Write a distinct, specific answer for each section." });
      }
    }
    const allText = WORKSPACE_SECTIONS.map(s => trimmed[s.key] || "").join(" ");
    const urls = allText.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi) || [];
    for (const u of urls) if (/^www\./.test(u) || !/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(u)) checks.push({ section: "links", kind: "rule", status: "fail", title: "Invalid link format", msg: "\"" + u.slice(0, 40) + "...\" is not a valid https:// link.", act: "Use the full URL format starting with https://" });
    if (/link here|paste link|www\.\s/.test(allText)) checks.push({ section: "links", kind: "rule", status: "warn", title: "Placeholder link", msg: "A placeholder link was found.", act: "Replace it with the real URL or remove it." });
    if (!founderProfile || !(founderProfile.college || "").trim() || !(founderProfile.name || "").trim()) checks.push({ section: "eligibility", kind: "rule", status: "eligibility", title: "Eligibility mismatch", msg: "Venture Connect accepts student founders. Your profile is missing a name or college.", act: "Complete your Profile before submitting." });
    return checks;
  }

  function meaningChecks(w) {
    const checks = [];
    const p = (w.problem || "").trim(), s = (w.solution || "").trim(), c = (w.targetCustomer || "").trim();
    const m = (w.market || "").trim(), b = (w.businessModel || "").trim(), v = (w.validation || "").trim();
    const f = (w.useOfFunds || "").trim(), comp = (w.competition || "").trim(), adv = (w.advantage || "").trim();
    if (p.length >= 60 && !RE_PLACEHOLDER.test(p) && /\d/.test(p)) checks.push({ section: "problem", kind: "meaning", status: "pass", title: "Problem clarity", msg: "The problem is specific, quantified, and understandable.", act: "" });
    else checks.push({ section: "problem", kind: "meaning", status: "warn", title: "Problem clarity", msg: "Reviewers may struggle to understand the problem. Add specifics: who is affected, how often, and why it matters.", act: "Add a concrete scenario or a quantified cost of the problem." });
    if (overlap(p, s) >= 2) checks.push({ section: "solution", kind: "meaning", status: "pass", title: "Solution fit", msg: "The solution clearly connects to the problem described.", act: "" });
    else checks.push({ section: "solution", kind: "meaning", status: "warn", title: "Solution fit", msg: "The solution does not clearly address the problem. Reviewers need to see the mechanism.", act: "Explain step by step how the product removes the pain described in the problem." });
    if (SEGMENT_WORDS.test(c) || /\d/.test(c)) checks.push({ section: "targetCustomer", kind: "meaning", status: "pass", title: "Target customer", msg: "The target customer is a specific, identifiable segment.", act: "" });
    else checks.push({ section: "targetCustomer", kind: "meaning", status: "warn", title: "Target customer", msg: "Your target customer is too broad. Specify the exact customer segment.", act: "Name who exactly buys/uses this — segment, geography, and trigger event." });
    if (REVENUE_WORDS.test(b)) checks.push({ section: "businessModel", kind: "meaning", status: "pass", title: "Business model", msg: "The revenue mechanism is understandable.", act: "" });
    else checks.push({ section: "businessModel", kind: "meaning", status: "warn", title: "Business model", msg: "It is not clear how the startup makes money.", act: "State the revenue stream, pricing unit, and who pays." });
    if (overlap(c, m) >= 1 || overlap(p, m) >= 1) checks.push({ section: "market", kind: "meaning", status: "pass", title: "Internal consistency", msg: "Market, customer, and problem claims are consistent with each other.", act: "" });
    else checks.push({ section: "market", kind: "meaning", status: "warn", title: "Internal consistency", msg: "The market description does not align with the customer or problem described.", act: "Make sure the market size logic references the same segment as your target customer." });
    if (EVIDENCE_WORDS.test(v)) checks.push({ section: "validation", kind: "meaning", status: "pass", title: "Validation", msg: "Validation is explained with concrete evidence.", act: "" });
    else checks.push({ section: "validation", kind: "meaning", status: "warn", title: "Validation", msg: "Validation evidence is missing or unclear. Investors will discount claims without it.", act: "Add interviews, surveys, pilots, waitlists, or letters of intent with numbers." });
    if (FUNDING_USE_WORDS.test(f)) checks.push({ section: "useOfFunds", kind: "meaning", status: "pass", title: "Use of funds", msg: "The use of funds is broken down clearly.", act: "" });
    else checks.push({ section: "useOfFunds", kind: "meaning", status: "warn", title: "Use of funds", msg: "It is not clear how the funding will be spent.", act: "Allocate the raise: team, product, pilots, go-to-market — with percentages." });
    if (comp.length >= 30) checks.push({ section: "competition", kind: "meaning", status: "pass", title: "Competition", msg: "Existing alternatives are acknowledged.", act: "" });
    else checks.push({ section: "competition", kind: "meaning", status: "warn", title: "Competition", msg: "\"No competition\" is rarely true. List who else solves this problem, including the status quo.", act: "Name 2–3 direct competitors or alternatives and how they differ." });
    if (adv.length >= 30 && adv !== s) checks.push({ section: "advantage", kind: "meaning", status: "pass", title: "Competitive advantage", msg: "The defensible edge is articulated.", act: "" });
    else checks.push({ section: "advantage", kind: "meaning", status: "warn", title: "Competitive advantage", msg: "Why your solution wins is not clear.", act: "Explain the durable edge: technology, data, access, or distribution." });
    if (v && /(plan to|will do|we think|intend to|believe)/i.test(v) && !EVIDENCE_WORDS.test(v)) checks.push({ section: "validation", kind: "meaning", status: "review", title: "Manual review recommended", msg: "Validation is described as intent rather than evidence. A Venture Connect analyst should review this manually.", act: "Submit for manual review, or add concrete evidence first." });
    return checks;
  }

  function runQualityChecks(workspaceData, profileOverride) {
    const w = workspaceData || state.founder.workspace;
    const fp = profileOverride || state.founder;
    const rules = ruleChecks(w, fp);
    const meaning = meaningChecks(w);
    const fails = rules.filter(c => c.status === "fail").length;
    const eligibilityFails = rules.filter(c => c.status === "eligibility").length;
    const warns = [...rules, ...meaning].filter(c => c.status === "warn").length;
    const manual = meaning.filter(c => c.status === "review").length;
    let status;
    if (eligibilityFails > 0) status = "Eligibility Mismatch";
    else if (fails >= 6 || workspaceCompletion() < 40) status = "Incomplete";
    else if (fails > 0 || warns > 2) status = "Needs Revision";
    else if (manual > 0) status = "Manual Review";
    else status = "Ready to Submit";
    return { status, rules, meaning, meta: { fails, warns, manual } };
  }

  /* ---------------- opportunities ---------------- */
  const getOpportunities = () => state.opportunities;
  const getOpportunity = (id) => state.opportunities.find(o => o.id === id) || null;
  const myOpportunities = (orgName) => state.opportunities.filter(o => o.org === orgName);
  const createOpportunity = async (data, status) => {
    const modeled = new Set(["org", "category", "type", "title", "desc", "applicationMode", "applicationUrl", "teamRequirements", "eventDate"]);
    const details = {};
    Object.keys(data || {}).forEach(k => { if (!modeled.has(k)) details[k] = data[k]; });
    const row = await DB.createOpportunity({
      created_by: state.session.id, org: data.org || org(), category: data.category, type: data.type,
      title: data.title, description: data.desc || "", status: status || "draft",
      application_mode: data.applicationMode || "internal", application_url: data.applicationUrl || "",
      team_requirements: data.teamRequirements || "", event_date: data.eventDate || "", details
    });
    const opp = oppFromRow(row);
    state.opportunities.unshift(opp);
    return opp;
  };
  const updateOpportunity = async (id, patch) => {
    const modeled = new Set(["org", "category", "type", "title", "desc", "applicationMode", "applicationUrl", "teamRequirements", "eventDate", "status", "views", "applicationLinkClicks"]);
    const dbPatch = {};
    if ("status" in patch) dbPatch.status = patch.status;
    if ("title" in patch) dbPatch.title = patch.title;
    if ("desc" in patch) dbPatch.description = patch.desc;
    if ("applicationUrl" in patch) dbPatch.application_url = patch.applicationUrl;
    if ("applicationMode" in patch) dbPatch.application_mode = patch.applicationMode;
    if ("teamRequirements" in patch) dbPatch.team_requirements = patch.teamRequirements;
    if ("eventDate" in patch) dbPatch.event_date = patch.eventDate;
    if ("org" in patch) dbPatch.org = patch.org;
    if ("category" in patch) dbPatch.category = patch.category;
    if ("type" in patch) dbPatch.type = patch.type;
    const extra = {};
    Object.keys(patch || {}).forEach(k => { if (!modeled.has(k)) extra[k] = patch[k]; });
    if (Object.keys(extra).length) {
      const existing = state.opportunities.find(x => x.id === id);
      const mergedDetails = {};
      Object.keys(existing || {}).forEach(k => { if (!modeled.has(k) && k !== "id" && k !== "createdBy" && k !== "ownerId" && k !== "views" && k !== "applicationLinkClicks" && k !== "createdAt") mergedDetails[k] = existing[k]; });
      dbPatch.details = Object.assign(mergedDetails, extra);
    }
    const row = await DB.updateOpportunity(id, dbPatch);
    const o = state.opportunities.find(x => x.id === id);
    if (o && row) Object.assign(o, oppFromRow(row));
    return o;
  };
  const closeOpportunity = (id) => updateOpportunity(id, { status: "closed" });
  const reopenOpportunity = (id) => updateOpportunity(id, { status: "published" });
  const incrementViews = async (id) => {
    const o = state.opportunities.find(x => x.id === id);
    if (o) { o.views = (o.views || 0) + 1; await DB.updateOpportunity(id, { views: o.views }); }
  };
  const recordExternalApplicationClick = async (id) => {
    const o = state.opportunities.find(x => x.id === id);
    if (!o) return null;
    o.applicationLinkClicks = (o.applicationLinkClicks || 0) + 1;
    await DB.updateOpportunity(id, { application_link_clicks: o.applicationLinkClicks });
    return o.applicationLinkClicks;
  };
  const externalApplicationsForStartup = () => []; // click tracking now lives on the opportunity row itself

  /* ---------------- applications ---------------- */
  const getApplications = () => state.applications;
  const getApplication = (id) => state.applications.find(a => a.id === id) || null;
  const applicationsForStartup = (sid) => state.applications.filter(a => a.startupId === sid);
  const applicationsForOrg = (orgName) => state.applications.filter(a => { const o = state.opportunities.find(x => x.id === a.opportunityId); return o && o.createdBy === orgName; });
  const oppApplicationCount = (id) => state.applications.filter(a => a.opportunityId === id).length;
  const oppQualifiedCount = (id) => state.applications.filter(a => a.opportunityId === id && a.gate && a.gate.decision === "passed" && a.stage >= 7).length;
  const oppInterestedCount = (id) => state.applications.filter(a => a.opportunityId === id && state.interested.includes(a.startupId)).length;

  const workspaceSnapshot = (startupId) => {
    const s = getStartup(startupId);
    if (s && s.id === state.founder.startupId) return JSON.parse(JSON.stringify(state.founder.workspace));
    return s ? JSON.parse(JSON.stringify(workspaceLikeStartup(s))) : {};
  };
  const workspaceLikeStartup = (s) => ({ problem: s.problem, solution: s.solution, targetCustomer: s.targetCustomer, market: s.market, businessModel: s.businessModel, validation: s.validation, competition: s.competition, advantage: s.advantage, funding: s.fundingAsk || "", useOfFunds: s.useOfFunds || "" });

  const daysFrom = (iso, days) => new Date(new Date(iso).getTime() + days * 86400000);
  const applicationLifecycle = (app, now) => {
    const submittedAt = new Date(app.submittedAt || app.createdAt || Date.now());
    const current = now ? new Date(now) : new Date();
    const editingDeadline = daysFrom(submittedAt, 10);
    const reviewTarget = daysFrom(submittedAt, 30);
    const editingAllowed = current < editingDeadline && !app.rejected && !(app.gate && app.gate.decision);
    const targetReached = current >= reviewTarget && !(app.gate && app.gate.decision) && !app.rejected;
    const daysEditing = Math.max(0, Math.ceil((editingDeadline - current) / 86400000));
    const daysRemaining = Math.max(0, Math.ceil((reviewTarget - current) / 86400000));
    return { submittedAt, editingDeadline, reviewTarget, editingAllowed, targetReached, daysEditing, daysRemaining };
  };
  const applicationStatus = (app, now) => {
    const life = applicationLifecycle(app, now);
    if (app.rejected || (app.gate && app.gate.decision === "not-passed")) return "Not Approved";
    if (app.gate && app.gate.decision === "passed" && app.stage >= 7) return "Approved for Organization Review";
    if (app.clarification && app.clarification.status === "requested") return "Clarification Requested";
    if (life.editingAllowed) return app.versions && app.versions.length > 1 ? "Updated — Under Review" : "Editing Window Open";
    if (life.targetReached) return "Review Target Reached";
    return "Under Venture Connect Review";
  };

  // Founder-facing: create a new application (INSERT — RLS requires you own the startup).
  const createApplication = async (startupId, opportunityId) => {
    const submittedAt = new Date().toISOString();
    const snapshot = workspaceSnapshot(startupId);
    const row = await DB.createApplication({
      startup_id: startupId, opportunity_id: opportunityId, submitted_at: submittedAt, last_updated_at: submittedAt,
      updated_by: "founder", versions: [{ version: 1, submittedAt, updatedAt: submittedAt, updatedBy: "founder", workspace: snapshot }],
      current_version: 1, stage: 1
    });
    const app = appFromRow(row);
    state.applications.unshift(app);
    return app;
  };

  // Founder-facing: append a new version snapshot.
  const updateApplicationSnapshot = async (id, workspaceData, updatedBy) => {
    const a = state.applications.find(x => x.id === id);
    if (!a || !applicationLifecycle(a).editingAllowed) return null;
    const now = new Date().toISOString();
    const version = (a.currentVersion || 1) + 1;
    const versions = (a.versions || []).concat({ version, submittedAt: a.submittedAt, updatedAt: now, updatedBy: updatedBy || "founder", workspace: JSON.parse(JSON.stringify(workspaceData || {})) });
    const row = await DB.updateApplicationSnapshot(id, { versions, current_version: version, updated_by: updatedBy || "founder" });
    Object.assign(a, appFromRow(row));
    return a;
  };

  // Founder-facing: reply to a clarification request.
  const respondClarification = async (id, response) => {
    const a = state.applications.find(x => x.id === id);
    if (!a || !a.clarification || a.clarification.status !== "requested") return null;
    const clarification = Object.assign({}, a.clarification, { response, respondedAt: new Date().toISOString(), status: "responded" });
    const row = await DB.respondClarification(id, clarification);
    Object.assign(a, appFromRow(row));
    return a;
  };

  // Internal-only: generic patch used by the review workflow (autoCheck,
  // vcReview, pitch, interview, evidenceStatus/Notes, needsRevision,
  // rejected). Postgres rejects this write outright for non-internal
  // sessions — see trg_protect_application_review_fields.
  const updateApplication = async (id, patch) => {
    const a = state.applications.find(x => x.id === id);
    if (!a) return null;
    const dbPatch = {};
    if ("autoCheck" in patch) dbPatch.auto_check = patch.autoCheck;
    if ("vcReview" in patch) dbPatch.vc_review = patch.vcReview;
    if ("pitch" in patch) dbPatch.pitch = patch.pitch;
    if ("interview" in patch) dbPatch.interview = patch.interview;
    if ("needsRevision" in patch) dbPatch.needs_revision = patch.needsRevision;
    if ("rejected" in patch) dbPatch.rejected = patch.rejected;
    if ("evidenceStatus" in patch) dbPatch.evidence_status = patch.evidenceStatus;
    if ("evidenceNotes" in patch) dbPatch.evidence_notes = patch.evidenceNotes;
    const row = await DB.internalUpdateApplication(id, dbPatch);
    Object.assign(a, appFromRow(row));
    return a;
  };

  // Internal-only, routed through server-side RPCs (see schema.sql).
  const advanceApp = async (id) => {
    const row = await DB.advanceApplication(id);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
    return !!row;
  };
  const setGate = async (id, passed, notes) => {
    const row = await DB.setApplicationGate(id, passed, notes);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
    const s = a && state.userStartups.find(x => x.id === a.startupId);
    if (s) s.qualityGate = passed ? "passed" : "rejected";
  };
  const unlockApp = async (id) => {
    const row = await DB.unlockApplication(id);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
  };
  const rejectApp = async (id) => {
    const row = await DB.rejectApplication(id);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
  };
  const requestClarification = async (id, question) => {
    const row = await DB.requestClarification(id, question);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
  };

  // Org/investor-side: hide a qualified, unlocked application from their
  // queue. RLS only allows this on rows where the gate has passed AND the
  // opportunity belongs to the caller — see applications_update_opportunity_owner_investor_action.
  const rejectAppInvestor = async (id) => {
    const row = await DB.rejectApplicationInvestor(id);
    const a = state.applications.find(x => x.id === id);
    if (a && row) Object.assign(a, appFromRow(row));
  };

  /* ---------------- helpers for UI ---------------- */
  function visibleStartups() { return state.userStartups.filter(s => s.qualityGate === "passed" || s.qualityGate === "review"); }
  function passedStartups() { return state.userStartups.filter(s => s.qualityGate === "passed"); }
  function recommendedIds() { return [...state.userStartups].sort((a, b) => b.score - a.score).slice(0, 3).map(s => s.id); }

  return {
    get state() { return state; },
    init, reset,
    getRole, setRole, founder, investor, incubator, organizer, internal, me, org,
    sessionUser, registerAccount, login, adminLogin, signOut, addUserStartup,
    myStartup, getStartup,
    stageIdx, setStageIdx, advanceStage, stageState,
    workspace, updateWorkspace, workspaceCompletion,
    isSaved, toggleSaved, isInterested, toggleInterested, removeFromQueue,
    conversations, getConversation, sendMessage, loadConversation,
    notifications, unreadCount, markNotifsRead,
    reviewResults, setReviewResult,
    runQualityChecks,
    visibleStartups, passedStartups, recommendedIds,
    DEFAULT_WORKSPACE,
    getOpportunities, getOpportunity, myOpportunities,
    createOpportunity, updateOpportunity, closeOpportunity, reopenOpportunity, incrementViews, recordExternalApplicationClick, externalApplicationsForStartup,
    getApplications, getApplication, applicationsForStartup, applicationsForOrg,
    oppApplicationCount, oppQualifiedCount, oppInterestedCount,
    createApplication, updateApplication, updateApplicationSnapshot, applicationLifecycle, applicationStatus, requestClarification, respondClarification, advanceApp, setGate, unlockApp, rejectApp, rejectAppInvestor
  };
})();
