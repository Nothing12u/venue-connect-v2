/* ============================================================
   VENTURE CONNECT — Shared pages: Founder Opportunities,
   Messaging, Notifications, User menu
   ============================================================ */

/* ---------------- FOUNDER OPPORTUNITIES ---------------- */
let oppFilter = "All";
let founderOppQuery = "";
let founderOppType = "All";
let founderOppSector = "All";
let founderOppLocation = "All";
let founderOppSort = "relevance";

function founderOpportunities() {
  const list = Store.getOpportunities().filter(o => o.status === "published");
  let filtered = oppFilter === "All" ? list : list.filter(o => o.category === oppFilter);
  const query = founderOppQuery.trim().toLowerCase();
  if (query) filtered = filtered.filter(o => [o.title, o.org, o.desc, o.eligibility, o.category].join(" ").toLowerCase().includes(query));
  if (founderOppType !== "All") filtered = filtered.filter(o => (o.typeLabel || o.category) === founderOppType);
  if (founderOppSector !== "All") filtered = filtered.filter(o => (o.sector || "Other") === founderOppSector);
  if (founderOppLocation !== "All") filtered = filtered.filter(o => (o.location || "Remote") === founderOppLocation);
  if (founderOppSort === "title") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  if (founderOppSort === "deadline") filtered = [...filtered].sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));

  const typeOptions = [...new Set(list.map(o => o.typeLabel || o.category))].sort();
  const sectorOptions = [...new Set(list.map(o => o.sector || "Other"))].sort();
  const locationOptions = [...new Set(list.map(o => o.location || "Remote"))].sort();

  const chips = ["All", ...OPP_CATEGORIES].map(c =>
    '<button class="chip' + (oppFilter === c ? " active" : "") + '" onclick="App.oppFilter(\'' + c + '\')">' + c + '</button>'
  ).join("");

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Opportunities</h1><p class="sub">Incubators, accelerators, grants, and investors looking for student ventures. Apply — Venture Connect handles the quality process.</p></div>' +
    '</div>' +

    '<div class="marketplace-tools glass" style="padding:12px 14px;margin-bottom:20px">' +
      '<div class="search-box" style="flex:1;min-width:220px"><span>' + Icon("search", 15) + '</span><input class="input" aria-label="Search opportunities" placeholder="Search opportunities" value="' + escapeHtml(founderOppQuery) + '" oninput="App.founderOppSearch(this.value)" /></div>' +
      '<div class="marketplace-selects">' +
        '<select class="select" aria-label="Filter by type" onchange="App.founderOppType(this.value)"><option value="All">All types</option>' + typeOptions.map(x => '<option value="' + escapeHtml(x) + '"' + (founderOppType === x ? ' selected' : '') + '>' + escapeHtml(x) + '</option>').join("") + '</select>' +
        '<select class="select" aria-label="Filter by domain" onchange="App.founderOppSector(this.value)"><option value="All">All domains</option>' + sectorOptions.map(x => '<option value="' + escapeHtml(x) + '"' + (founderOppSector === x ? ' selected' : '') + '>' + escapeHtml(x) + '</option>').join("") + '</select>' +
        '<select class="select" aria-label="Filter by location" onchange="App.founderOppLocation(this.value)"><option value="All">All locations</option>' + locationOptions.map(x => '<option value="' + escapeHtml(x) + '"' + (founderOppLocation === x ? ' selected' : '') + '>' + escapeHtml(x) + '</option>').join("") + '</select>' +
        '<select class="select" aria-label="Sort opportunities" onchange="App.founderOppSort(this.value)"><option value="relevance"' + (founderOppSort === "relevance" ? ' selected' : '') + '>Recommended</option><option value="deadline"' + (founderOppSort === "deadline" ? ' selected' : '') + '>Deadline</option><option value="title"' + (founderOppSort === "title" ? ' selected' : '') + '>Name</option></select>' +
      '</div>' +
    '</div>' +
    '<div class="row-wrap" style="margin-bottom:20px">' + chips + '</div>' +

    (filtered.length
      ? '<div class="grid-3">' + filtered.map(o => {
          const applied = Store.applicationsForStartup(Store.founder().startupId).find(a => a.opportunityId === o.id);
          return '<div class="glass card glass-hover opp-card fade-up">' +
            '<span class="badge ' + (o.applicationMode === "external" ? "badge-info" : "badge-violet") + ' opp-cat">' + (o.applicationMode === "external" ? Icon("external", 11) + 'External application' : o.category) + '</span>' +
            '<div class="opp-title">' + o.title + '</div>' +
            '<div class="opp-org">' + Icon("briefcase", 13) + ' ' + o.org + '</div>' +
            '<div class="row-wrap">' +
              '<span class="tag">' + (o.sector || "Other") + '</span>' +
              '<span class="tag">' + Icon("mapPin", 10) + ' ' + (o.location || "Remote") + '</span>' +
              (o.funding ? '<span class="tag">' + Icon("wallet", 10) + ' ' + o.funding + '</span>' : '') +
            '</div>' +
            '<p class="small muted" style="line-height:1.6">' + o.desc.slice(0, 140) + (o.desc.length > 140 ? "…" : "") + '</p>' +
            '<div class="tiny faint" style="margin-bottom:4px">Eligibility: ' + (o.eligibility || "Open to student founders") + '</div>' +
            '<div class="opp-meta">' +
              '<span class="opp-deadline">' + Icon("calendar", 12) + ' Deadline: <b>' + o.deadline + '</b></span>' +
              '<button class="btn ' + (applied ? "btn-ghost" : "btn-primary") + ' btn-sm" onclick="App.navigate(\'' + (applied ? '#/founder/application/' + applied.id : '#/founder/opportunity/' + o.id) + '\')">' + (applied ? Icon("eye", 13) + 'View Application' : Icon("arrowR", 13) + (o.applicationMode === "external" ? 'View Hackathon' : 'Apply Now')) + '</button>' +
            '</div>' +
          '</div>';
        }).join("") + '</div>'
      : emptyState("briefcase", "No opportunities here yet", "New programs, competitions, and funding rounds are added by investors and incubators. Try another category or check back soon.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.oppFilter(\'All\')">' + Icon("grid", 15) + 'Show all opportunities</button>'));

  return html;
}

/* ---------------- FOUNDER OPPORTUNITY DETAIL + APPLY ---------------- */
function founderOpportunityDetail(id) {
  const o = Store.getOpportunity(id);
  if (!o) return errorPage();
  Store.incrementViews(id);

  const already = Store.applicationsForStartup(Store.founder().startupId).find(a => a.opportunityId === id);
  const appStatus = already ? founderAppStatus(already) : null;
  const closed = o.status !== "published";
  const external = o.applicationMode === "external" || o.type === "hackathon";
  const externalReady = /^https?:\/\//i.test(o.applicationUrl || "");

  return '<div class="page-head">' +
      '<div><a href="#/founder/opportunities" class="small semibold" style="color:var(--accent-deep)">' + Icon("chevL", 13) + ' All opportunities</a></div>' +
    '</div>' +
    '<div class="glass-strong card" style="padding:28px;max-width:780px;margin:0 auto">' +
      '<div class="row-between" style="flex-wrap:wrap;gap:12px;margin-bottom:6px">' +
        '<span class="badge ' + (external ? "badge-info" : "badge-violet") + '">' + (external ? Icon("external", 12) + 'External application' : o.category) + '</span>' +
        '<span class="badge badge-neutral">' + (o.sector || "Other") + '</span>' +
      '</div>' +
      '<h1 class="h2" style="margin:10px 0 4px">' + o.title + '</h1>' +
      '<div class="small muted">' + Icon("briefcase", 12) + ' ' + o.org + ' · ' + Icon("mapPin", 12) + ' ' + (o.location || "Remote") + '</div>' +

      (external
        ? '<div class="status-banner info" style="margin-top:18px"><span class="sb-ic">' + Icon("external", 20) + '</span><div><b>Application handled by organizer</b><p>Application and registration happen on the organizer\'s official website.</p></div></div>'
        : already
        ? '<div class="status-banner success" style="margin-top:18px"><span class="sb-ic">' + Icon("send", 20) + '</span>' +
            '<div><b>Application Submitted</b><p>' + appStatus.label + ' · Venture Connect quality control is underway.</p></div>' +
            '<button class="btn btn-primary" onclick="App.navigate(\'#/founder/application/' + already.id + '\')">' + Icon("eye", 14) + 'View Status</button></div>'
        : closed
          ? '<div class="status-banner danger" style="margin-top:18px"><span class="sb-ic">' + Icon("x", 20) + '</span><div><b>Applications closed</b><p>This opportunity is no longer accepting applications.</p></div></div>'
          : '') +

      '<div class="divider"></div>' +
      '<div class="semibold small" style="margin-bottom:8px">' + (external ? 'About' : 'About the opportunity') + '</div>' +
      '<p class="muted" style="line-height:1.7;font-size:14.5px;margin-bottom:18px">' + o.desc + '</p>' +

      '<div class="grid-2">' +
        '<div><div class="semibold small" style="margin-bottom:6px">Who can apply</div>' +
        '<p class="muted small" style="line-height:1.6">' + o.eligibility + '</p></div>' +
        '<div><div class="semibold small" style="margin-bottom:6px">What selected startups receive</div>' +
        '<div class="col" style="gap:6px">' + (o.perks || []).map(pk =>
          '<div class="row" style="gap:9px"><span class="badge badge-success" style="padding:2px 7px">' + Icon("check", 10) + '</span><span class="small">' + pk + '</span></div>'
        ).join("") + '</div></div>' +
      '</div>' +

      '<div style="padding:15px 17px;border-radius:15px;background:rgba(255,255,255,.55);border:1px solid var(--hairline);margin:18px 0">' +
        '<div class="kv" style="grid-template-columns:150px 1fr">' +
          (external ? '<dt>Domains</dt><dd>' + (o.sector || "Other") + '</dd><dt>Team requirements</dt><dd>' + (o.teamRequirements || "—") + '</dd><dt>Event date</dt><dd>' + (o.eventDate || o.startDate || "—") + '</dd>' : '') +
          '<dt>Funding / Support</dt><dd>' + (o.funding || "—") + '</dd>' +
          '<dt>Equity</dt><dd>' + (o.equity || "None") + '</dd>' +
          '<dt>Timeline</dt><dd>' + (o.duration || "—") + (o.startDate ? " · starts " + o.startDate : "") + '</dd>' +
          '<dt>Deadline</dt><dd>' + o.deadline + '</dd>' +
          '<dt>Location</dt><dd>' + (o.location || "Remote") + '</dd>' +
          '<dt>' + (external ? 'Application' : 'Application requirements') + '</dt><dd style="font-weight:500">' + (external ? 'Handled on the organizer\'s official website.' : 'Completed Idea Workspace with strong answers — Venture Connect runs automated checks, review, pitch, interview, and evidence verification before the investor sees your application.') + '</dd>' +
        '</div>' +
      '</div>' +

      (external
        ? (closed ? '' : '<button class="btn btn-primary btn-block btn-lg" ' + (externalReady ? '' : 'disabled ') + 'onclick="App.applyNow(\'' + o.id + '\')">' + Icon("external", 16) + 'Apply on Organizer Website</button>' + (!externalReady ? '<p class="tiny faint" style="text-align:center;margin-top:8px">The organizer has not added a valid application URL yet.</p>' : ''))
        : already
        ? '<button class="btn btn-soft btn-block btn-lg" onclick="App.navigate(\'#/founder/applications\')">' + Icon("layers", 15) + 'View My Applications</button>'
        : closed
          ? ''
          : '<button class="btn btn-primary btn-block btn-lg" onclick="App.applyNow(\'' + o.id + '\')">' + Icon("send", 16) + 'Apply Now</button>') +
    '</div>';
}

/* ---------------- FOUNDER APPLICATION REVIEW ---------------- */
function founderApplicationReview(oppId) {
  const o = Store.getOpportunity(oppId);
  if (!o || o.applicationMode === "external" || o.type === "hackathon") return errorPage();
  const w = Store.workspace();
  const rows = WORKSPACE_SECTIONS.map(sec => '<div class="application-preview-row"><dt>' + sec.label + '</dt><dd>' + escapeHtml(w[sec.key] || "Not answered") + '</dd></div>').join("");
  return '<div class="page-head"><div><a href="#/founder/opportunity/' + o.id + '" class="small semibold" style="color:var(--accent-deep)">' + Icon("chevL", 13) + ' Back to opportunity</a><h1 class="h1" style="margin-top:10px">Review your application</h1><p class="sub">Your Idea Workspace will be submitted to Venture Connect for review.</p></div><span class="badge badge-indigo">Version 1 · Draft</span></div>' +
    '<div class="glass-strong card application-review-card"><div class="row-between" style="flex-wrap:wrap;gap:12px;margin-bottom:18px"><div><div class="tiny faint semibold">APPLICATION FOR</div><div class="h2">' + o.title + '</div><div class="small muted">' + o.org + ' · ' + (o.category || "Opportunity") + '</div></div><span class="badge badge-info">Venture Connect review</span></div>' +
    '<div class="application-preview-list">' + rows + '</div>' +
    '<div class="status-banner info" style="margin-top:18px"><span class="sb-ic">' + Icon("shield", 20) + '</span><div><b>Submit to Venture Connect</b><p>After submission, you will have 10 days to update this application. Venture Connect will then continue its review for up to 30 days.</p></div></div>' +
    '<div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-ghost" onclick="App.navigate(\'#/founder/opportunity/' + o.id + '\')">Cancel</button><button class="btn btn-primary btn-lg" onclick="App.submitApplication(\'' + o.id + '\')">' + Icon("send", 16) + 'Submit Application</button></div></div>';
}

/* ---------------- MESSAGING ---------------- */
let activeConv = null;

function messagingPage(role, convId) {
  const entries = Object.entries(Store.conversations()).map(([k, c]) => ({ key: k, ...c }));
  const orgRoles = ["investor", "incubator", "organizer"];
  const isInvestor = orgRoles.includes(role);
  const convs = entries.filter(c => isInvestor ? c.startupId : !c.startupId);

  if (convId && Store.getConversation(convId)) activeConv = convId;
  if (!activeConv || !Store.getConversation(activeConv) || !convs.some(c => c.key === activeConv)) activeConv = convs.length ? convs[0].key : null;

  const conv = Store.getConversation(activeConv);
  const startup = conv && conv.startupId ? Store.getStartup(conv.startupId) : null;

  const listHtml = convs.map(c => {
    const st = c.startupId ? Store.getStartup(c.startupId) : null;
    const name = st ? st.name : c.partner.name;
    const sub = st ? st.tagline : c.partner.role;
    const last = c.items[c.items.length - 1];
    return '<div class="msg-item' + (c.key === activeConv ? " active" : "") + '" onclick="App.openConv(\'' + c.key + '\')">' +
      (st ? startupLogo(st, 36) : personAvatar(c.partner.name, 36)) +
      '<div style="flex:1;min-width:0"><div class="m-name">' + name + '</div><div class="m-prev">' + (last ? last.text : sub) + '</div></div>' +
      '<div class="m-time">' + (last ? last.time.split(",")[0] : "") + '</div>' +
    '</div>';
  }).join("");

  const msgs = conv ? conv.items.map(m =>
    '<div class="bubble ' + (m.from === "me" ? "mine" : "theirs") + '">' + m.text + '<span class="b-time">' + m.time + '</span></div>'
  ).join("") : "";

  const headMeta = startup
    ? '<div class="mh-meta">' + gateBadge(startup.qualityGate) + '<span class="score-chip" style="font-size:11px;padding:2px 8px">' + startup.score + '/100</span></div>'
    : '<div class="mh-meta"><span class="tag">' + (conv ? conv.partner.role : "") + '</span></div>';

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Messaging</h1><p class="sub">Conversations with founders, investors, and incubator partners.</p></div>' +
    '</div>' +

    '<div class="msg-layout">' +
      '<div class="glass msg-list">' +
        (listHtml || emptyState("message", "No conversations", "Conversations appear here after you mark a startup as Interested.")) +
      '</div>' +

      '<div class="glass msg-pane">' +
        (conv
          ? '<div class="msg-head">' +
              (startup ? startupLogo(startup, 42) : personAvatar(conv.partner.name, 42)) +
              '<div style="flex:1;min-width:0"><div class="mh-title">' + (startup ? "Conversation with " + startup.name : conv.partner.name) + '</div>' + headMeta + '</div>' +
              '<button class="icon-btn" onclick="App.navigate(\'' + (startup ? "#/" + role + "/startup/" + startup.id : "#/" + role + "/profile") + '\')">' + Icon("external", 15) + '</button>' +
            '</div>'
          : '') +
        '<div class="msg-body" id="msg-body">' +
          '<div class="msg-day">TODAY</div>' + msgs +
        '</div>' +
        (conv
          ? '<div class="msg-composer">' +
              '<input class="input" id="msg-input" placeholder="Write a message…" onkeydown="if(event.key===\'Enter\')App.sendMsg()" />' +
              '<button class="btn btn-primary" onclick="App.sendMsg()">' + Icon("send", 15) + '</button>' +
            '</div>'
          : '') +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- NOTIFICATIONS DROPDOWN ---------------- */
function notificationsHtml() {
  const items = Store.notifications();
  return '<div class="dd-head">Notifications</div>' +
    items.map(n =>
      '<div class="notif-item' + (n.read ? "" : " unread") + '" onclick="App.closeDropdown()">' +
        '<span class="n-ic ' + (n.tone === "success" ? "green" : n.tone === "violet" ? "violet" : n.tone === "info" ? "blue" : "amber") + ' card-title-ic">' + Icon(n.icon, 15) + '</span>' +
        '<div><div class="n-text">' + n.text + '</div><div class="n-time">' + n.time + '</div></div>' +
      '</div>'
    ).join("") +
    '<div class="dd-sep"></div>' +
    '<button class="dd-item" onclick="App.markNotifs()">' + Icon("check", 14) + 'Mark all as read</button>';
}

/* ---------------- USER MENU DROPDOWN ---------------- */
function userMenuHtml() {
  const p = Store.me();
  const role = Store.getRole();
  const roleLabel = role === "investor" ? "Investor account" : role === "incubator" ? "Incubator account" : role === "organizer" ? "Organizer account" : role === "internal" ? "Venture Connect internal" : "Founder account";
  const orgLine = (role === "investor" || role === "incubator" || role === "organizer" || role === "internal") ? p.org : p.college;

  return '<div class="dd-head">' + roleLabel + '</div>' +
    '<div class="dd-item" style="pointer-events:none;flex-direction:column;align-items:flex-start;gap:1px">' +
      '<span class="semibold">' + p.name + '</span><span class="tiny faint">' + orgLine + '</span>' +
    '</div>' +
    '<div class="dd-sep"></div>' +
    (role !== "founder" ? '<button class="dd-item" onclick="App.switchRole(\'founder\')">' + Icon("spark", 14) + 'Switch to Founder view</button>' : '') +
    (role !== "investor" ? '<button class="dd-item" onclick="App.switchRole(\'investor\')">' + Icon("trending", 14) + 'Switch to Investor view</button>' : '') +
    (role !== "incubator" ? '<button class="dd-item" onclick="App.switchRole(\'incubator\')">' + Icon("layers", 14) + 'Switch to Incubator view</button>' : '') +
    (role !== "organizer" ? '<button class="dd-item" onclick="App.switchRole(\'organizer\')">' + Icon("calendar", 14) + 'Switch to Organizer view</button>' : '') +
    (role !== "internal" ? '<button class="dd-item" onclick="App.switchRole(\'internal\')">' + Icon("shield", 14) + 'Open Venture Connect Review (internal)</button>' : '') +
    '<button class="dd-item" onclick="App.navigate(\'#/\');App.closeDropdown()">' + Icon("home", 14) + 'View landing page</button>' +
    '<div class="dd-sep"></div>' +
    '<button class="dd-item" onclick="App.reset()">' + Icon("refresh", 14) + 'Reset Data</button>' +
    '<button class="dd-item danger" onclick="App.signOut()">' + Icon("logout", 14) + 'Sign out</button>';
}
