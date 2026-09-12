/* ============================================================
   VENTURE CONNECT — Investor pages: Dashboard, Discover,
   Review, Queue, Interested, Saved, Opportunities (create &
   manage), Applications, Profile
   ============================================================ */

let invFilter = { q: "", sector: "All", sort: "score" };
let oppMgmtFilter = "all";
let invAppFilter = "all";
const SECTORS = ["All", "AgriTech", "ClimateTech", "FinTech", "HealthTech", "EdTech", "DeepTech", "SaaS"];

/* ---------------- startup card (discovery) ---------------- */
function startupCard(s, opts) {
  opts = opts || {};
  const saved = Store.isSaved(s.id);
  const interested = Store.isInterested(s.id);
  return '<div class="glass card glass-hover startup-card fade-up">' +
    '<div class="sc-top">' +
      startupLogo(s, 46) +
      '<div style="flex:1;min-width:0">' +
        '<div class="sc-name">' + s.name + (opts.rec ? ' <span class="badge badge-violet" style="padding:2px 8px">' + Icon("star", 10) + ' Recommended</span>' : '') + '</div>' +
        '<div class="sc-tag">' + s.tagline + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="row-wrap">' +
      '<span class="tag">' + s.sector + '</span><span class="tag">' + s.stage + '</span>' +
      '<span class="tag">' + Icon("mapPin", 11) + ' ' + s.location.split(",")[0] + '</span>' +
      gateBadge(s.qualityGate) +
    '</div>' +
    '<div class="sc-meta">' +
      '<span>' + Icon("trending", 12) + ' Readiness <b>' + s.score + '/100</b></span>' +
      '<span>' + Icon("verify", 12) + ' Validation <b>' + (s.evidence.some(e => e.status === "Verified") ? "Verified" : "In review") + '</b></span>' +
      '<span>' + Icon("wallet", 12) + ' Seeking <b>' + s.fundingAsk + '</b></span>' +
      '<span>' + Icon("calendar", 12) + ' Submitted <b>' + fmtDate(s.submitted) + '</b></span>' +
    '</div>' +
    '<div class="sc-actions">' +
      '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + Icon("eye", 14) + 'Review</button>' +
      '<button class="btn ' + (saved ? "btn-success" : "btn-ghost") + ' btn-sm" onclick="App.toggleSaved(\'' + s.id + '\', this)">' + Icon("bookmark", 14) + (saved ? "Saved" : "Save") + '</button>' +
      '<button class="btn ' + (interested ? "btn-danger" : "btn-ghost") + ' btn-sm" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("heart", 14) + 'Interested</button>' +
    '</div>' +
  '</div>';
}

/* ---------------- DASHBOARD ---------------- */
function orgProfilePct() {
  const role = Store.getRole();
  const p = Store.me();
  if (role === "investor") {
    const fields = [p.role, p.website, p.location, p.ticket, p.geography, p.thesis || p.focus, p.linkedin, (p.portfolio && p.portfolio.length) ? "y" : ""];
    return Math.min(100, Math.round(fields.filter(Boolean).length / fields.length * 100));
  }
  if (role === "incubator") {
    const fields = [p.orgType, p.website, p.location, (p.support && p.support.length) ? "y" : "", p.duration, p.funding, p.equity, p.description];
    return Math.min(100, Math.round(fields.filter(Boolean).length / fields.length * 100));
  }
  const fields = [p.website, p.location, p.about, p.phone];
  return Math.min(100, Math.round(fields.filter(Boolean).length / fields.length * 100));
}

function investorDashboard() {
  const inv = Store.investor();
  const org = inv.org;
  const myOpps = Store.myOpportunities(org);
  const published = myOpps.filter(o => o.status === "published");
  const qualifiedApps = Store.applicationsForOrg(org).filter(a => a.gate && a.gate.decision === "passed" && a.stage >= 7 && a.investorAction !== "rejected");
  const recIds = Store.recommendedIds();
  const recs = Store.passedStartups().filter(s => recIds.includes(s.id)).slice(0, 2);

  const stats = [
    { label: "Review queue", val: Store.state.queue.length, icon: "layers" },
    { label: "New qualified startups", val: recs.length, icon: "eye" },
    { label: "Interested startups", val: Store.state.interested.length, icon: "heart" },
    { label: "Active opportunities", val: published.length, icon: "briefcase" }
  ];

  const oppRows = myOpps.slice(0, 3).map(o =>
    '<div class="list-row"><div class="lr-main"><div class="semibold" style="font-size:13.5px">' + o.title + '</div>' +
    '<div class="tiny faint">' + Store.oppApplicationCount(o.id) + ' applications · ' + Store.oppQualifiedCount(o.id) + ' qualified</div></div>' +
    (o.status === "published" ? '<span class="badge badge-success">' + Icon("check", 11) + ' Published</span>' : o.status === "draft" ? '<span class="badge badge-neutral">Draft</span>' : '<span class="badge badge-neutral">Closed</span>') +
    '</div>'
  ).join("");

  const appRows = qualifiedApps.slice(0, 3).map(app => {
    const s = Store.getStartup(app.startupId);
    const o = Store.getOpportunity(app.opportunityId);
    const saved = Store.isSaved(s.id);
    const interested = Store.isInterested(s.id);
    return '<div class="list-row">' + startupLogo(s, 34) +
      '<div class="lr-main"><div class="semibold" style="font-size:13.5px">' + s.name + ' <span class="faint" style="font-weight:500">· ' + o.title + '</span></div>' +
      '<div class="tiny faint">' + s.founder.name + ' · Gate passed ' + app.gate.decidedAt + '</div></div>' +
      '<button class="btn btn-ghost btn-sm" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("heart", 13) + (interested ? "Interested" : "Interested") + '</button>' +
      '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + Icon("eye", 13) + 'Review</button>' +
    '</div>';
  }).join("");

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Dashboard</h1>' +
      '<p class="sub">Review qualified startups, manage your opportunities, and keep your pipeline moving.</p></div>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunity/new\')">' + Icon("plus", 15) + 'Create Opportunity</button>' +
    '</div>' +

    (orgProfilePct() < 100 ? profileBanner(orgProfilePct(), "#/" + Store.getRole() + "/profile", "Complete Profile", "Complete your investment preferences to improve startup matching.") : '') +

    '<div class="stats" style="margin-bottom:20px">' + stats.map(st =>
      '<div class="glass glass-hover stat"><span class="s-label"><span class="card-title-ic" style="width:26px;height:26px">' + Icon(st.icon, 13) + '</span>' + st.label + '</span><div class="s-val">' + st.val + '</div></div>'
    ).join("") + '</div>' +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("briefcase", 17) + '</span>My opportunities</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunities\')">Manage</button></div>' +
        (oppRows || '<p class="muted small">You have not posted any opportunities yet.</p>') +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic green">' + Icon("shield", 17) + '</span>Qualified applications</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/applications\')">View all</button></div>' +
        (appRows || '<p class="muted small">Applications that pass the Quality Gate will appear here.</p>') +
      '</div>' +
    '</div>' +

    '<div style="margin-top:20px">' +
      '<div class="glass card" style="padding:16px 20px;margin-bottom:14px"><div class="row" style="gap:11px"><span class="card-title-ic violet" style="width:30px;height:30px">' + Icon("star", 15) + '</span><div><div class="semibold" style="font-size:14px">Recommended startups</div><div class="tiny faint">Top VC Readiness across the gated pipeline</div></div></div></div>' +
      '<div class="grid-2">' + (recs.map(s => startupCard(s, { rec: true })).join("") || '<p class="muted small">No qualified startups yet.</p>') + '</div>' +
    '</div>';

  return html;
}

/* ---------------- DISCOVER ---------------- */
function investorDiscover() {
  const recIds = Store.recommendedIds();
  let list = Store.visibleStartups().filter(s => s.qualityGate === "passed");

  if (invFilter.q) {
    const q = invFilter.q.toLowerCase();
    list = list.filter(s => (s.name + " " + s.tagline + " " + s.sector + " " + s.location).toLowerCase().includes(q));
  }
  if (invFilter.sector !== "All") list = list.filter(s => s.sector === invFilter.sector);
  if (invFilter.sort === "score") list = [...list].sort((a, b) => b.score - a.score);
  else if (invFilter.sort === "new") list = [...list].sort((a, b) => b.submitted.localeCompare(a.submitted));
  else list = [...list].sort((a, b) => a.fundingAsk.localeCompare(b.fundingAsk));

  const newThisWeek = [...list].sort((a, b) => b.submitted.localeCompare(a.submitted)).slice(0, 3);

  const chips = SECTORS.map(s =>
    '<button class="chip' + (invFilter.sector === s ? " active" : "") + '" onclick="App.invFilterSector(\'' + s + '\')">' + s + '</button>'
  ).join("");

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Discover High-Potential Student Ventures</h1>' +
      '<p class="sub">Every startup here has passed the Venture Connect Quality Gate. You are browsing a screened pipeline, not raw ideas.</p></div>' +
      '<div class="row">' +
        '<div class="search-box' + (invFilter.q ? " has-value" : "") + '" style="width:250px">' + Icon("search", 15) +
          '<input class="input" placeholder="Search startups..." value="' + escapeHtml(invFilter.q) + '" oninput="App.invSearch(this.value)" />' +
          '<button class="search-clear" onclick="App.invSearch(\'\')">' + Icon("x", 13) + '</button></div>' +
        '<select class="select" style="width:170px" onchange="App.invSort(this.value)">' +
          '<option value="score"' + (invFilter.sort === "score" ? " selected" : "") + '>Sort: VC Readiness</option>' +
          '<option value="new"' + (invFilter.sort === "new" ? " selected" : "") + '>Sort: Newest</option>' +
          '<option value="ask"' + (invFilter.sort === "ask" ? " selected" : "") + '>Sort: Funding ask</option>' +
        '</select>' +
      '</div>' +
    '</div>' +

    '<div class="row-wrap" style="margin-bottom:20px">' + chips + '</div>' +

    (invFilter.q || invFilter.sector !== "All"
      ? '<div class="stack">' + (list.length ? '<div class="grid-3">' + list.map(s => startupCard(s, { rec: recIds.includes(s.id) })).join("") + '</div>' : emptyState("search", "No startups match", "Try a different sector or search term.")) + '</div>'
      : '<div class="stack">' +
        '<div class="glass card" style="padding:16px 20px"><div class="row" style="gap:11px"><span class="card-title-ic green" style="width:30px;height:30px">' + Icon("spark", 15) + '</span><div><div class="semibold" style="font-size:14px">New this week</div><div class="tiny faint">Recently qualified startups</div></div></div></div>' +
        '<div class="grid-3">' + newThisWeek.map(s => startupCard(s, { rec: recIds.includes(s.id) })).join("") + '</div>' +
        '<div class="glass card" style="padding:16px 20px"><div class="row" style="gap:11px"><span class="card-title-ic violet" style="width:30px;height:30px">' + Icon("star", 15) + '</span><div><div class="semibold" style="font-size:14px">Recommended for you</div><div class="tiny faint">Highest VC Readiness in your focus sectors</div></div></div></div>' +
        '<div class="grid-3">' + list.slice(0, 3).map(s => startupCard(s, { rec: recIds.includes(s.id) })).join("") + '</div>' +
        '<div class="glass card" style="padding:16px 20px"><div class="row" style="gap:11px"><span class="card-title-ic blue" style="width:30px;height:30px">' + Icon("layers", 15) + '</span><div><div class="semibold" style="font-size:14px">All qualified startups</div><div class="tiny faint">' + list.length + ' startups · sorted by VC Readiness</div></div></div></div>' +
        '<div class="grid-3">' + list.map(s => startupCard(s, { rec: recIds.includes(s.id) })).join("") + '</div>' +
      '</div>');

  return html;
}

/* ---------------- STARTUP REVIEW PAGE ---------------- */
function investorReview(id) {
  const s = Store.getStartup(id);
  if (!s) return errorPage();
  const saved = Store.isSaved(id);
  const interested = Store.isInterested(id);

  const sections = [
    ["Problem", s.problem, "target"], ["Solution", s.solution, "spark"], ["Target customer", s.targetCustomer, "user"],
    ["Market", s.market, "trending"], ["Business model", s.businessModel, "wallet"], ["Validation", s.validation, "verify"],
    ["Competition", s.competition, "layers"], ["Competitive advantage", s.advantage, "shield"]
  ];

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">' + s.name + '</h1>' +
      '<p class="sub">' + s.tagline + ' · ' + s.sector + ' · ' + s.stage + ' · ' + s.location + '</p></div>' +
      '<div class="row">' +
        '<button class="btn ' + (interested ? "btn-danger" : "btn-ghost") + '" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("heart", 15) + 'Interested</button>' +
        '<button class="btn ' + (saved ? "btn-success" : "btn-ghost") + '" onclick="App.toggleSaved(\'' + s.id + '\', this)">' + Icon("bookmark", 15) + (saved ? "Saved" : "Save") + '</button>' +
        '<button class="btn btn-primary" onclick="App.openMessage(\'' + s.id + '\')"' + (interested ? "" : " disabled title=\"Mark as Interested to message the founder\"") + '>' + Icon("message", 15) + 'Message Founder</button>' +
      '</div>' +
    '</div>' +

    '<div class="glass-strong card" style="padding:24px;margin-bottom:18px">' +
      '<div class="row-between" style="flex-wrap:wrap;gap:14px">' +
        '<div class="row" style="gap:16px">' + startupLogo(s, 54) +
          '<div>' +
            '<div class="row" style="gap:8px"><span style="font-size:20px;font-weight:800">' + s.name + '</span>' + gateBadge(s.qualityGate) + '</div>' +
            '<div class="small muted" style="margin-top:3px">Founder: <b style="color:var(--ink)">' + s.founder.name + '</b> · ' + s.founder.college + '</div>' +
            '<div class="small muted">Industry: ' + s.sector + ' · Stage: ' + s.stage + ' · Location: ' + s.location + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right"><div class="tiny faint semibold" style="letter-spacing:.08em">VC READINESS</div>' +
        '<div class="semibold" style="font-size:30px;font-weight:800;color:var(--accent-deep)">' + s.score + '<span class="faint" style="font-size:15px">/100</span></div>' +
        '<div class="tiny faint">Submitted ' + fmtDate(s.submitted) + '</div></div>' +
      '</div>' +
    '</div>' +

    '<div class="stack">' +
      '<div class="grid-2" style="align-items:start">' +
        '<div class="glass card">' +
          '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("file", 17) + '</span>Application detail</div></div>' +
          '<div class="col" style="gap:11px">' + sections.map(sec =>
            '<div style="padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.55);border:1px solid var(--hairline)">' +
              '<div class="tiny semibold faint" style="text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">' + sec[0] + '</div>' +
              '<div class="small" style="line-height:1.6">' + sec[1] + '</div></div>'
          ).join("") + '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="glass card">' +
            '<div class="card-header"><div class="h3"><span class="card-title-ic violet">' + Icon("trending", 17) + '</span>VC Readiness</div>' +
            '<button class="btn btn-ghost btn-sm" onclick="App.viewReportModal(\'' + s.id + '\')">' + Icon("file", 13) + 'View Full Report</button></div>' +
            '<div class="row" style="gap:18px;align-items:center">' +
              Ring(s.score, 96, "readiness") +
              '<div style="flex:1;min-width:0">' +
                [["problem", "Problem"], ["solution", "Solution"], ["market", "Market"], ["validation", "Validation"], ["businessModel", "Business model"], ["team", "Team"]].map(d =>
                  '<div style="margin-bottom:8px"><div class="row-between"><span class="tiny semibold">' + d[1] + '</span><span class="tiny mono bold" style="color:var(--accent-deep)">' + s.scoreBreak[d[0]] + '</span></div>' + bar(s.scoreBreak[d[0]], "thin") + '</div>'
                ).join("") +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="glass card">' +
            '<div class="card-header"><div class="h3"><span class="card-title-ic green">' + Icon("verify", 17) + '</span>Verified evidence</div></div>' +
            '<div class="col" style="gap:9px">' + s.evidence.map(e =>
              '<div class="row" style="gap:10px;align-items:flex-start"><span class="badge badge-success" style="padding:2px 8px;margin-top:1px">' + Icon("check", 10) + '</span><span class="small" style="line-height:1.5"><b>' + e.type + '</b> — ' + e.description + '</span></div>'
            ).join("") + '</div>' +
          '</div>' +

          '<div class="glass card">' +
            '<div class="card-header"><div class="h3"><span class="card-title-ic amber">' + Icon("wallet", 17) + '</span>Funding ask &amp; use</div></div>' +
            '<div class="kv"><dt>Funding ask</dt><dd>' + s.fundingAsk + '</dd><dt>Use of funds</dt><dd style="font-weight:500;line-height:1.55">' + s.useOfFunds + '</dd><dt>Team</dt><dd style="font-weight:500;line-height:1.55">' + s.team.map(t => t.name + ' — ' + t.role).join("; ") + '</dd></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic blue">' + Icon("layers", 17) + '</span>Milestones</div></div>' +
        '<div class="row-wrap">' + s.milestones.map(m =>
          '<span class="badge ' + (m.done ? "badge-success" : "badge-neutral") + '">' + Icon(m.done ? "check" : "circle", 11) + ' ' + m.name + '</span>'
        ).join("") + '</div>' +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- QUEUE ---------------- */
function investorQueue() {
  const ids = Store.state.queue;
  const items = ids.map(id => Store.getStartup(id)).filter(Boolean);

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Review Queue</h1><p class="sub">Startups waiting for your review. Move them to Interested or Saved, or remove them from the queue.</p></div>' +
      '<span class="badge badge-indigo">' + items.length + ' awaiting review</span>' +
    '</div>';

  if (!items.length) {
    return html + emptyState("checkCircle", "Queue is clear", "You have reviewed everything in your queue. Discover more qualified startups.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate(\'#/' + Store.getRole() + '/discover\')">' + Icon("eye", 15) + 'Discover Startups</button>');
  }

  const rows = items.map(s => {
    const saved = Store.isSaved(s.id);
    const interested = Store.isInterested(s.id);
    return '<div class="queue-row fade-up">' +
      '<div class="qr-name" style="cursor:pointer" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + startupLogo(s, 36) +
        '<span>' + s.name + '<small>' + s.tagline + '</small></span></div>' +
      '<div class="qr-cell qr-hide-sm">' + s.sector + '</div>' +
      '<div class="qr-cell qr-hide-md">' + s.stage + '</div>' +
      '<div class="qr-cell">' + gateBadge(s.qualityGate) + '</div>' +
      '<div class="qr-cell mono bold" style="color:var(--accent-deep)">' + s.score + '</div>' +
      '<div class="qr-cell qr-hide-sm faint">' + fmtDate(s.submitted) + '</div>' +
      '<div class="row" style="gap:7px;justify-content:flex-end;flex-wrap:wrap">' +
        '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + Icon("eye", 13) + 'Review</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.toggleSaved(\'' + s.id + '\', this)">' + Icon("bookmark", 13) + (saved ? "Saved" : "Save") + '</button>' +
        '<button class="btn ' + (interested ? "btn-danger" : "btn-ghost") + ' btn-sm" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("heart", 13) + (interested ? "Interested" : "Interested") + '</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.removeQueue(\'' + s.id + '\', this)" title="Remove from queue">' + Icon("x", 13) + '</button>' +
      '</div>' +
    '</div>';
  }).join("");

  return html +
    '<div class="glass" style="padding:14px 8px">' +
      '<div class="queue-head">' +
        '<span>Startup</span><span class="qr-hide-sm">Sector</span><span class="qr-hide-md">Stage</span><span>Quality gate</span><span>VC readiness</span><span class="qr-hide-sm">Submitted</span><span style="text-align:right">Review action</span>' +
      '</div>' +
      '<div class="col" style="gap:10px">' + rows + '</div>' +
    '</div>';
}

/* ---------------- INTERESTED ---------------- */
function investorInterested() {
  const ids = Store.state.interested;
  const items = ids.map(id => Store.getStartup(id)).filter(Boolean);

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Interested</h1><p class="sub">Startups you are actively pursuing. Messaging unlocks after you mark a startup as Interested.</p></div>' +
      '<span class="badge badge-danger">' + Icon("heart", 12) + ' ' + items.length + ' interested</span>' +
    '</div>';

  if (!items.length) {
    return html + emptyState("heart", "Nothing here yet", "Mark startups as Interested while reviewing and they will appear here with messaging unlocked.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate(\'#/' + Store.getRole() + '/discover\')">' + Icon("eye", 15) + 'Discover Startups</button>');
  }

  const rows = items.map(s =>
    '<div class="glass card glass-hover fade-up" style="padding:20px">' +
      '<div class="row-between" style="gap:14px;flex-wrap:wrap">' +
        '<div class="row" style="gap:14px">' + startupLogo(s, 44) +
          '<div><div class="semibold" style="font-size:15.5px">' + s.name + ' <span class="badge badge-success" style="margin-left:4px">' + Icon("shield", 10) + ' PASSED</span></div>' +
          '<div class="small muted">' + s.founder.name + ' · ' + s.sector + ' · ' + s.stage + '</div>' +
          '<div class="tiny faint" style="margin-top:2px">Last activity: ' + s.lastActivity + '</div></div>' +
        '</div>' +
        '<div class="row" style="gap:18px">' +
          '<div style="text-align:center"><div class="tiny faint semibold">READINESS</div><div class="semibold mono" style="color:var(--accent-deep)">' + s.score + '</div></div>' +
          '<div style="text-align:center"><div class="tiny faint semibold">ASK</div><div class="semibold mono">' + s.fundingAsk + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="row" style="margin-top:16px">' +
        '<button class="btn btn-primary btn-sm" onclick="App.openMessage(\'' + s.id + '\')">' + Icon("message", 14) + 'Message Founder</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + Icon("eye", 14) + 'View Profile</button>' +
        '<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("x", 13) + 'Remove</button>' +
      '</div>' +
    '</div>'
  ).join("");

  return html + '<div class="stack">' + rows + '</div>';
}

/* ---------------- SAVED ---------------- */
function investorSaved() {
  const ids = Store.state.saved;
  const items = ids.map(id => Store.getStartup(id)).filter(Boolean);

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Saved</h1><p class="sub">Your bookmarks for later review — a shortlist that survives the queue.</p></div>' +
      '<span class="badge badge-indigo">' + Icon("bookmark", 12) + ' ' + items.length + ' saved</span>' +
    '</div>';

  if (!items.length) {
    return html + emptyState("bookmark", "No saved startups", "Save promising startups while reviewing and they will appear here.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate(\'#/' + Store.getRole() + '/discover\')">' + Icon("eye", 15) + 'Discover Startups</button>');
  }

  return html + '<div class="grid-3">' + items.map(s => startupCard(s)).join("") + '</div>';
}

/* ---------------- OPPORTUNITIES (create & manage) ---------------- */
function investorOpportunities() {
  const org = Store.org();
  let opps = Store.myOpportunities(org);

  const chips = [
    ["all", "All (" + opps.length + ")"],
    ["published", "Published (" + opps.filter(o => o.status === "published").length + ")"],
    ["draft", "Draft (" + opps.filter(o => o.status === "draft").length + ")"],
    ["closed", "Closed (" + opps.filter(o => o.status === "closed").length + ")"]
  ];
  if (oppMgmtFilter !== "all") opps = opps.filter(o => o.status === oppMgmtFilter);

  const rows = opps.map(o =>
    '<div class="list-row">' +
      '<div class="lr-main"><div class="semibold" style="font-size:14px">' + o.title + '</div>' +
      '<div class="tiny faint">' + o.org + ' · Deadline ' + o.deadline + ' · ' + o.views + ' views</div></div>' +
      (o.applicationMode === "external" ? '<div class="lr-cell">' + (o.applicationLinkClicks || 0) + ' link clicks</div>' :
        '<div class="lr-cell">' + Store.oppApplicationCount(o.id) + ' apps</div>' +
        '<div class="lr-cell">' + Store.oppQualifiedCount(o.id) + ' qualified</div>' +
        '<div class="lr-cell">' + Store.oppInterestedCount(o.id) + ' interested</div>') +
      (o.status === "published" ? '<span class="badge badge-success">' + Icon("check", 11) + ' Published</span>' : o.status === "draft" ? '<span class="badge badge-neutral">Draft</span>' : '<span class="badge badge-neutral">Closed</span>') +
      '<div class="row" style="gap:6px">' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunity/edit/' + o.id + '\')">' + Icon("edit", 13) + 'Edit</button>' +
        (o.applicationMode === "external" ? '<span class="badge badge-info">' + Icon("external", 11) + 'External application</span>' : '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/applications/' + o.id + '\')">' + Icon("eye", 13) + 'Applications</button>') +
        (o.status === "published"
          ? '<button class="btn btn-ghost btn-sm" onclick="App.closeOpp(\'' + o.id + '\')">' + Icon("x", 13) + 'Close</button>'
          : o.status === "closed"
            ? '<button class="btn btn-ghost btn-sm" onclick="App.reopenOpp(\'' + o.id + '\')">' + Icon("refresh", 13) + 'Reopen</button>'
            : '') +
      '</div>' +
    '</div>'
  ).join("");

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Opportunities</h1><p class="sub">' + (Store.getRole() === "organizer" ? "Publish events, manage official registration links, and track founder interest." : Store.getRole() === "incubator" ? "Run programs and review the founders who apply." : "Manage the opportunities founders see on their side.") + '</p></div>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunity/new\')">' + Icon("plus", 15) + 'Create Opportunity</button>' +
    '</div>' +
    '<div class="row-wrap" style="margin-bottom:18px">' + chips.map(c =>
      '<button class="chip' + (oppMgmtFilter === c[0] ? " active" : "") + '" onclick="App.oppMgmtFilter(\'' + c[0] + '\')">' + c[1] + '</button>'
    ).join("") + '</div>' +
    (rows
      ? '<div class="glass" style="padding:12px 10px"><div class="col" style="gap:10px">' + rows + '</div></div>'
      : emptyState("briefcase", "No opportunities yet", "Create your first opportunity — it appears on the founder side the moment you publish it.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunity/new\')">' + Icon("plus", 15) + 'Create Opportunity</button>'));

  return html;
}

const OPP_TYPES = [
  ["Incubator Program", "Incubators"], ["Accelerator", "Accelerators"], ["Funding Opportunity", "Investors"],
  ["Grant", "Grants"], ["Hackathon", "Hackathons"], ["Startup Competition", "Competitions"], ["Mentorship Program", "Startup Programs"]
];
const OPP_STAGES = ["Idea", "Prototype", "MVP", "Early Revenue"];
const OPP_SECTORS = ["AI", "FinTech", "AgriTech", "ClimateTech", "HealthTech", "EdTech", "DeepTech", "SaaS", "Other"];

function opportunityFormPage(id) {
  const editing = !!id;
  const o = editing ? Store.getOpportunity(id) : null;
  if (editing && !o) return errorPage();

  const v = (k, def) => o ? (o[k] || def || "") : (def || "");
  const typeVal = o ? (OPP_TYPES.find(t => t[1] === o.category) || [o.category, o.category])[0] : "Incubator Program";
  const isHackathon = typeVal === "Hackathon";

  const selectOptions = (arr, cur) => arr.map(x => '<option value="' + x + '"' + (x === cur ? " selected" : "") + '>' + x + '</option>').join("");

  const html =
    '<div class="page-head">' +
      '<div><a href="#/' + Store.getRole() + '/opportunities" class="small semibold" style="color:var(--accent-deep)">' + Icon("chevL", 13) + ' My opportunities</a></div>' +
      (o ? '<span class="badge ' + (o.status === "published" ? "badge-success" : o.status === "draft" ? "badge-neutral" : "badge-neutral") + '">' + o.status + '</span>' : '') +
    '</div>' +
    '<div class="glass-strong card" style="padding:28px;max-width:820px;margin:0 auto">' +
      '<h1 class="h2" style="margin-bottom:4px">' + (editing ? "Edit Opportunity" : "Create Opportunity") + '</h1>' +
      '<p class="muted small" style="margin-bottom:24px">' + (editing ? "Update the details — changes appear on the founder side immediately." : "Publish it and founders will discover it in their Opportunities marketplace.") + '</p>' +

      '<div class="opp-form-section"><div class="h3"><span class="card-title-ic">' + Icon("edit", 15) + '</span>Basic information</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Opportunity title <span class="req">*</span></label><input class="input" id="of-title" value="' + escapeHtml(v("title")) + '" placeholder="e.g. AgriTech Student Accelerator 2026" /></div>' +
          '<div class="field"><label>Organization <span class="req">*</span></label><input class="input" id="of-org" value="' + escapeHtml(v("org", Store.org())) + '" /></div>' +
          '<div class="field"><label>Opportunity type</label><select class="select" id="of-type" onchange="App.opportunityTypeChange()">' + selectOptions(OPP_TYPES.map(t => t[0]), typeVal) + '</select></div>' +
          '<div class="field"><label>Sector</label><select class="select" id="of-sector">' + selectOptions(OPP_SECTORS, v("sector", "Other")) + '</select></div>' +
          '<div class="field"><label>Startup stage</label><select class="select" id="of-stage">' + selectOptions(OPP_STAGES, v("stage", "Idea")) + '</select></div>' +
          '<div class="field"><label>Eligibility</label><input class="input" id="of-elig" value="' + escapeHtml(v("eligibility")) + '" placeholder="e.g. Student founders with early prototypes" /></div>' +
        '</div>' +
      '</div>' +

      '<div class="opp-form-section"><div class="h3"><span class="card-title-ic violet">' + Icon("file", 15) + '</span>Description</div>' +
        '<div class="field"><label>What is this opportunity?</label><textarea class="textarea" id="of-desc" placeholder="Describe the program, what it offers, and why founders should apply…">' + escapeHtml(v("desc")) + '</textarea></div>' +
      '</div>' +

      '<div class="opp-form-section"><div class="h3"><span class="card-title-ic blue">' + Icon("calendar", 15) + '</span>Application details</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Deadline</label><input class="input" id="of-deadline" value="' + escapeHtml(v("deadline")) + '" placeholder="e.g. Oct 10, 2026" /></div>' +
          '<div class="field"><label>Application start date</label><input class="input" id="of-startdate" value="' + escapeHtml(v("startDate")) + '" placeholder="e.g. Nov 1, 2026" /></div>' +
          '<div class="field"><label>Location / Online</label><input class="input" id="of-location" value="' + escapeHtml(v("location", "Remote")) + '" /></div>' +
          '<div class="field"><label>Funding / Support offered</label><input class="input" id="of-funding" value="' + escapeHtml(v("funding")) + '" placeholder="e.g. $25,000 + workspace" /></div>' +
          '<div class="field"><label>Equity requirement</label><input class="input" id="of-equity" value="' + escapeHtml(v("equity", "None")) + '" placeholder="e.g. 6% or None" /></div>' +
          '<div class="field"><label>Program duration</label><input class="input" id="of-duration" value="' + escapeHtml(v("duration")) + '" placeholder="e.g. 12 weeks" /></div>' +
          '<div class="field"><label>Team requirements</label><input class="input" id="of-team" value="' + escapeHtml(v("teamRequirements")) + '" placeholder="e.g. Teams of 2–5" /></div>' +
          '<div class="field"><label>Prizes / Benefits</label><input class="input" id="of-perks" value="' + escapeHtml((o && o.perks || []).join(", ")) + '" placeholder="Separate benefits with commas" /></div>' +
          '<div class="field"><label>Event date</label><input class="input" id="of-event-date" value="' + escapeHtml(v("eventDate")) + '" placeholder="e.g. Oct 2, 2026" /></div>' +
        '</div>' +
      '</div>' +

      '<div class="opp-form-section" id="of-external-wrap" style="display:' + (isHackathon ? "block" : "none") + '"><div class="h3"><span class="card-title-ic amber">' + Icon("external", 15) + '</span>Official registration</div>' +
        '<div class="field"><label>Official Application / Registration URL' + (isHackathon ? ' <span class="req">*</span>' : '') + '</label><input class="input" id="of-application-url" type="url" value="' + escapeHtml(v("applicationUrl")) + '" placeholder="https://examplehackathon.com/register" /><div class="hint">Add the official registration page where participants should apply for this hackathon.</div></div>' +
      '</div>' +

      '<div class="row" style="justify-content:flex-end;gap:10px;margin-top:8px">' +
        '<button class="btn btn-ghost" onclick="App.navigate(\'#/' + Store.getRole() + '/opportunities\')">Cancel</button>' +
        '<button class="btn btn-ghost" onclick="App.previewOpportunity()">' + Icon("eye", 15) + 'Preview</button>' +
        '<button class="btn btn-ghost" onclick="App.saveOpportunity(\'' + (editing ? o.id : "") + '\', \'draft\')">' + Icon("download", 15) + 'Save Draft</button>' +
        '<button class="btn btn-primary" id="of-publish" onclick="App.saveOpportunity(\'' + (editing ? o.id : "") + '\', \'publish\')">' + Icon("checkCircle", 15) + (isHackathon ? 'Publish Hackathon' : (editing ? 'Save &amp; Publish' : 'Publish Opportunity')) + '</button>' +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- APPLICATIONS (to my opportunities) ---------------- */
function investorApplications(oppId) {
  const org = Store.org();
  const organizer = Store.getRole() === "organizer";
  const myOpps = Store.myOpportunities(org);
  let apps = Store.applicationsForOrg(org).filter(a => a.gate && a.gate.decision === "passed" && a.stage >= 7 && a.investorAction !== "rejected");
  if (oppId) apps = apps.filter(a => a.opportunityId === oppId);

  const chips = [["all", "All (" + Store.applicationsForOrg(org).filter(a => a.gate && a.gate.decision === "passed" && a.stage >= 7 && a.investorAction !== "rejected").length + ")"]]
    .concat(myOpps.filter(o => o.status !== "draft").map(o => [o.id, o.title.length > 22 ? o.title.slice(0, 22) + "…" : o.title]));
  if (!oppId && invAppFilter !== "all") apps = apps.filter(a => a.opportunityId === invAppFilter);

  const rows = apps.map(app => {
    const s = Store.getStartup(app.startupId);
    const o = Store.getOpportunity(app.opportunityId);
    const saved = Store.isSaved(s.id);
    const interested = Store.isInterested(s.id);
    return '<div class="list-row">' + startupLogo(s, 36) +
      '<div class="lr-main"><div class="semibold" style="font-size:14px">' + s.name + ' <span class="faint" style="font-weight:500">· ' + s.founder.name + '</span></div>' +
      '<div class="tiny faint">' + (o ? o.title : "") + ' · Applied ' + app.submitted + ' · Gate passed ' + app.gate.decidedAt + '</div></div>' +
      '<div class="lr-cell mono bold" style="color:var(--accent-deep)">' + s.score + '</div>' +
      '<button class="btn btn-ghost btn-sm" onclick="App.toggleSaved(\'' + s.id + '\', this)">' + Icon("bookmark", 13) + (saved ? "Saved" : "Save") + '</button>' +
      '<button class="btn ' + (interested ? "btn-danger" : "btn-ghost") + ' btn-sm" onclick="App.toggleInterested(\'' + s.id + '\', this)">' + Icon("heart", 13) + (interested ? "Interested" : "Interested") + '</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="App.rejectAppInvestor(\'' + app.id + '\')" title="Reject this application">' + Icon("x", 13) + '</button>' +
      '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/' + Store.getRole() + '/startup/' + s.id + '\')">' + Icon("eye", 13) + 'Review</button>' +
    '</div>';
  }).join("");

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Applications</h1><p class="sub">' + (organizer ? 'Venture Connect applications appear here only when they use the internal review process. Hackathon registration stays on the organizer\'s website.' : 'Quality-gated applications submitted to your opportunities. No raw applications — Venture Connect verified every one of these.') + '</p></div>' +
      '<span class="badge badge-success">' + Icon("shield", 12) + ' ' + apps.length + ' qualified</span>' +
    '</div>' +
    '<div class="row-wrap" style="margin-bottom:18px">' + chips.map(c =>
      '<button class="chip' + (invAppFilter === c[0] ? " active" : "") + '" onclick="App.invAppFilter(\'' + c[0] + '\')">' + c[1] + '</button>'
    ).join("") + '</div>' +
    (rows
      ? '<div class="glass" style="padding:12px 10px"><div class="col" style="gap:10px">' + rows + '</div>' +
        '<p class="tiny faint" style="padding:10px 14px 4px">' + Icon("lock", 11) + ' Marking Interested unlocks messaging with the founder. Reject hides the application from this list.</p></div>'
      : emptyState("shield", organizer ? "No Venture Connect applications yet" : "No qualified applications yet", organizer ? "External hackathon registrations are handled on the official event website." : "When an application to your opportunity passes the Venture Connect Quality Gate, it appears here."));

  return html;
}

/* ---------------- INCUBATOR DASHBOARD ---------------- */
function incubatorDashboard() {
  const inc = Store.incubator();
  const org = Store.org();
  const myOpps = Store.myOpportunities(org);
  const qualifiedApps = Store.applicationsForOrg(org).filter(a => a.gate && a.gate.decision === "passed" && a.stage >= 7 && a.investorAction !== "rejected");

  const quick = [
    ["discover", "eye", "Discover Startups", "#/incubator/discover"],
    ["queue", "layers", "Review Queue", "#/incubator/queue"],
    ["interested", "heart", "Interested", "#/incubator/interested"],
    ["saved", "bookmark", "Saved", "#/incubator/saved"],
    ["opportunities", "briefcase", "Opportunities", "#/incubator/opportunities"],
    ["applications", "shield", "Applications", "#/incubator/applications"],
    ["messaging", "message", "Messaging", "#/incubator/messaging"],
    ["profile", "user", "Profile", "#/incubator/profile"]
  ];

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Incubator Dashboard</h1>' +
      '<p class="sub">Run programs, review applications, and support early-stage startups.</p></div>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/incubator/opportunity/new\')">' + Icon("plus", 15) + 'Post a Program</button>' +
    '</div>' +

    (orgProfilePct() < 100 ? profileBanner(orgProfilePct(), "#/incubator/profile", "Complete Profile", "Add your program details so founders understand what you offer.") : '') +

    '<div class="glass-strong card" style="padding:24px;margin-bottom:20px">' +
      '<div class="row-between" style="flex-wrap:wrap;gap:14px">' +
        '<div class="row" style="gap:15px"><span class="card-title-ic violet" style="width:48px;height:48px">' + Icon("layers", 21) + '</span>' +
          '<div><div style="font-size:19px;font-weight:800">' + inc.org + '</div>' +
          '<div class="small muted">' + inc.orgType + ' · ' + inc.location + '</div></div></div>' +
        '<div class="row" style="gap:18px;flex-wrap:wrap">' +
          '<div style="text-align:center"><div class="tiny faint semibold">FOCUS AREAS</div><div class="semibold small" style="margin-top:2px">' + (inc.sectors || []).join(", ") + '</div></div>' +
          '<div style="text-align:center"><div class="tiny faint semibold">STAGES</div><div class="semibold small" style="margin-top:2px">' + (inc.stages || []).join(", ") + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="row-wrap" style="margin-top:14px">' + (inc.support || []).map(s => '<span class="tag">' + Icon("check", 10) + ' ' + s + '</span>').join("") + '</div>' +
    '</div>' +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("briefcase", 17) + '</span>My programs</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/incubator/opportunities\')">Manage</button></div>' +
        (myOpps.slice(0, 3).map(o =>
          '<div class="list-row"><div class="lr-main"><div class="semibold" style="font-size:13.5px">' + o.title + '</div>' +
          '<div class="tiny faint">' + Store.oppApplicationCount(o.id) + ' applications · ' + Store.oppQualifiedCount(o.id) + ' qualified</div></div>' +
          (o.status === "published" ? '<span class="badge badge-success">' + Icon("check", 11) + ' Published</span>' : o.status === "draft" ? '<span class="badge badge-neutral">Draft</span>' : '<span class="badge badge-neutral">Closed</span>') + '</div>'
        ).join("") || '<p class="muted small">No programs yet — post your first one.</p>') +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic green">' + Icon("shield", 17) + '</span>Qualified applications</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/incubator/applications\')">View all</button></div>' +
        (qualifiedApps.slice(0, 3).map(app => {
          const s = Store.getStartup(app.startupId);
          const o = Store.getOpportunity(app.opportunityId);
          return '<div class="list-row">' + startupLogo(s, 34) +
            '<div class="lr-main"><div class="semibold" style="font-size:13.5px">' + s.name + '</div><div class="tiny faint">' + (o ? o.title : "") + ' · Gate passed ' + app.gate.decidedAt + '</div></div>' +
            '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/incubator/startup/' + s.id + '\')">' + Icon("eye", 13) + 'Review</button></div>';
        }).join("") || '<p class="muted small">Applications that pass the Quality Gate will appear here.</p>') +
      '</div>' +
    '</div>' +

    '<div style="margin-top:20px">' +
      '<div class="glass card" style="padding:16px 20px;margin-bottom:14px"><div class="row" style="gap:11px"><span class="card-title-ic violet" style="width:30px;height:30px">' + Icon("grid", 15) + '</span><div><div class="semibold" style="font-size:14px">Your workspace</div><div class="tiny faint">Everything an incubator needs, in one place</div></div></div></div>' +
      '<div class="role-quick">' + quick.map(q =>
        '<div class="glass glass-hover rq-item" onclick="App.navigate(\'' + q[3] + '\')"><span class="rq-ic">' + Icon(q[1], 17) + '</span>' + q[2] + '</div>'
      ).join("") + '</div>' +
    '</div>';

  return html;
}

/* ---------------- ORGANIZER DASHBOARD ---------------- */
function organizerDashboard() {
  const orgP = Store.organizer();
  const org = Store.org();
  const myOpps = Store.myOpportunities(org);

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Organizer Dashboard</h1>' +
      '<p class="sub">Publish hackathons, share official registration links, and track interest from student founders.</p></div>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/organizer/opportunity/new\')">' + Icon("plus", 15) + 'Create Opportunity</button>' +
    '</div>' +

    (orgProfilePct() < 100 ? profileBanner(orgProfilePct(), "#/organizer/profile", "Complete Profile", "Add your event details so founders and organizers can find you.") : '') +

    '<div class="glass-strong card" style="padding:24px;margin-bottom:20px">' +
      '<div class="row-between" style="flex-wrap:wrap;gap:14px">' +
        '<div class="row" style="gap:15px"><span class="card-title-ic violet" style="width:48px;height:48px">' + Icon("calendar", 21) + '</span>' +
          '<div><div style="font-size:19px;font-weight:800">' + orgP.org + '</div>' +
          '<div class="small muted">' + orgP.orgType + ' · ' + orgP.location + '</div></div></div>' +
        '<div class="row-wrap" style="max-width:320px">' + (orgP.domains || []).map(d => '<span class="tag">' + d + '</span>').join("") + '</div>' +
      '</div>' +
      '<p class="muted small" style="margin-top:12px;line-height:1.6">' + (orgP.about || "") + '</p>' +
    '</div>' +

    '<div class="glass card" style="margin-bottom:18px">' +
      '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("briefcase", 17) + '</span>My opportunities</div>' +
      '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/organizer/opportunities\')">Manage</button></div>' +
      (myOpps.slice(0, 3).map(o =>
        '<div class="list-row"><div class="lr-main"><div class="semibold" style="font-size:13.5px">' + o.title + '</div>' +
        '<div class="tiny faint">Deadline ' + o.deadline + (o.applicationMode === "external" ? ' · ' + (o.applicationLinkClicks || 0) + ' application-link clicks' : ' · ' + Store.oppApplicationCount(o.id) + ' applications') + '</div></div>' +
        (o.status === "published" ? '<span class="badge badge-success">' + Icon("check", 11) + ' Published</span>' : o.status === "draft" ? '<span class="badge badge-neutral">Draft</span>' : '<span class="badge badge-neutral">Closed</span>') + '</div>'
      ).join("") || '<p class="muted small">No opportunities yet — create your first one.</p>') +
    '</div>' +

    '<div class="role-quick">' + [
      ["briefcase", "Create Opportunity", "#/organizer/opportunity/new"],
      ["layers", "My Opportunities", "#/organizer/opportunities"],
      ["shield", "Applications", "#/organizer/applications"],
      ["message", "Messaging", "#/organizer/messaging"],
      ["user", "Profile", "#/organizer/profile"]
    ].map(q =>
      '<div class="glass glass-hover rq-item" onclick="App.navigate(\'' + q[2] + '\')"><span class="rq-ic">' + Icon(q[0], 17) + '</span>' + q[1] + '</div>'
    ).join("") + '</div>';

  return html;
}

/* ---------------- INCUBATOR PROFILE ---------------- */
function incubatorProfile() {
  const p = Store.incubator();
  return profileShell(
    p.name, p.org,
    [["Org type", p.orgType], ["Location", p.location]],
    (p.sectors || []),
    '<div class="field"><label>Incubator Name</label><input class="input" id="in-org" value="' + escapeHtml(p.org) + '" /></div>' +
    '<div class="field"><label>Organization Type</label><input class="input" id="in-orgtype" value="' + escapeHtml(p.orgType) + '" /></div>' +
    '<div class="field"><label>Website</label><input class="input" id="in-website" value="' + escapeHtml(p.website || "") + '" /></div>' +
    '<div class="field"><label>Location</label><input class="input" id="in-location" value="' + escapeHtml(p.location) + '" /></div>' +
    '<div class="field"><label>Focus areas (comma separated)</label><input class="input" id="in-sectors" value="' + escapeHtml((p.sectors || []).join(", ")) + '" /></div>' +
    '<div class="field"><label>Stages supported</label><input class="input" id="in-stages" value="' + escapeHtml((p.stages || []).join(", ")) + '" /></div>' +
    '<div class="field"><label>Support offered (comma separated)</label><input class="input" id="in-support" value="' + escapeHtml((p.support || []).join(", ")) + '" /></div>' +
    '<div class="field"><label>Program duration</label><input class="input" id="in-duration" value="' + escapeHtml(p.duration || "") + '" /></div>' +
    '<div class="field"><label>Funding / Support available</label><input class="input" id="in-funding" value="' + escapeHtml(p.funding || "") + '" /></div>' +
    '<div class="field"><label>Equity requirement</label><input class="input" id="in-equity" value="' + escapeHtml(p.equity || "") + '" /></div>' +
    '<div class="field"><label>Description</label><textarea class="textarea" id="in-desc">' + escapeHtml(p.description || "") + '</textarea></div>',
    "App.saveIncubatorProfile()"
  );
}

/* ---------------- ORGANIZER PROFILE ---------------- */
function organizerProfile() {
  const p = Store.organizer();
  return profileShell(
    p.name, p.org,
    [["Org type", p.orgType], ["Location", p.location]],
    (p.domains || []),
    '<div class="field"><label>Organization / Organizer Name</label><input class="input" id="or-org" value="' + escapeHtml(p.org) + '" /></div>' +
    '<div class="field"><label>Organizer Type</label><input class="input" id="or-orgtype" value="' + escapeHtml(p.orgType) + '" /></div>' +
    '<div class="field"><label>Website</label><input class="input" id="or-website" value="' + escapeHtml(p.website || "") + '" /></div>' +
    '<div class="field"><label>Location</label><input class="input" id="or-location" value="' + escapeHtml(p.location) + '" /></div>' +
    '<div class="field"><label>About Organization</label><textarea class="textarea" id="or-about">' + escapeHtml(p.about || "") + '</textarea></div>' +
    '<div class="field"><label>Typical domains (comma separated)</label><input class="input" id="or-domains" value="' + escapeHtml((p.domains || []).join(", ")) + '" /></div>',
    "App.saveOrganizerProfile()"
  );
}

/* Shared two-column profile shell (avatar + summary + editable form) */
function profileShell(name, orgName, kvRows, chips, formHtml, saveAction) {
  return '<div class="page-head">' +
      '<div><h1 class="h1">Profile</h1><p class="sub">How founders and Venture Connect see your organization.</p></div>' +
    '</div>' +
    '<div class="grid-2" style="grid-template-columns:300px 1fr;align-items:start">' +
      '<div class="glass card" style="text-align:center">' +
        '<div style="display:grid;place-items:center;margin-bottom:12px">' + personAvatar(name, 84) + '</div>' +
        '<div class="semibold" style="font-size:17px">' + name + '</div>' +
        '<div class="small muted">' + orgName + '</div>' +
        '<div class="row-wrap" style="justify-content:center;margin-top:14px">' + chips.map(c => '<span class="tag">' + c + '</span>').join("") + '</div>' +
        '<div class="divider"></div>' +
        '<div class="kv" style="grid-template-columns:1fr;text-align:left">' + kvRows.map(k => '<dt>' + k[0] + '</dt><dd>' + (k[1] || "—") + '</dd>').join("") + '</div>' +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("user", 17) + '</span>Organization details</div></div>' +
        '<div class="form-grid">' + formHtml + '</div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:6px">' +
          '<button class="btn btn-primary" onclick="' + saveAction + '">' + Icon("check", 15) + 'Save Profile</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ---------------- INVESTOR PROFILE ---------------- */
function investorProfile() {
  const p = Store.investor();

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Profile</h1><p class="sub">How founders and Venture Connect see you.</p></div>' +
    '</div>' +

    '<div class="grid-2" style="grid-template-columns:300px 1fr;align-items:start">' +
      '<div class="glass card" style="text-align:center">' +
        '<div style="display:grid;place-items:center;margin-bottom:12px">' + personAvatar(p.name, 84) + '</div>' +
        '<div class="semibold" style="font-size:17px">' + p.name + '</div>' +
        '<div class="small muted">' + p.org + '</div>' +
        '<div class="row-wrap" style="justify-content:center;margin-top:14px">' + p.sectors.map(sk => '<span class="tag">' + sk + '</span>').join("") + '</div>' +
        '<div class="divider"></div>' +
        '<div class="small semibold" style="text-align:left;margin-bottom:6px">Portfolio (fictional)</div>' +
        '<div class="row-wrap">' + p.portfolio.map(x => '<span class="badge badge-neutral">' + x + '</span>').join("") + '</div>' +
      '</div>' +

      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("user", 17) + '</span>Investor details</div></div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Name</label><input class="input" id="ip-name" value="' + escapeHtml(p.name) + '" /></div>' +
          '<div class="field"><label>Organization</label><input class="input" id="ip-org" value="' + escapeHtml(p.org) + '" /></div>' +
          '<div class="field full"><label>Investment focus</label><input class="input" id="ip-focus" value="' + escapeHtml(p.focus) + '" /></div>' +
          '<div class="field"><label>Sectors (comma separated)</label><input class="input" id="ip-sectors" value="' + escapeHtml(p.sectors.join(", ")) + '" /></div>' +
          '<div class="field"><label>Stage preference</label><input class="input" id="ip-stage" value="' + escapeHtml(p.stage) + '" /></div>' +
          '<div class="field"><label>Geography</label><input class="input" id="ip-geo" value="' + escapeHtml(p.geography) + '" /></div>' +
          '<div class="field"><label>Ticket size</label><input class="input" id="ip-ticket" value="' + escapeHtml(p.ticket) + '" /></div>' +
          '<div class="field"><label>Portfolio (comma separated)</label><input class="input" id="ip-portfolio" value="' + escapeHtml(p.portfolio.join(", ")) + '" /></div>' +
        '</div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:6px">' +
          '<button class="btn btn-primary" onclick="App.saveInvestorProfile()">' + Icon("check", 15) + 'Save Profile</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  return html;
}
