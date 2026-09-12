/* ============================================================
   VENTURE CONNECT — Founder status pages: Application Status,
   Pitch / Interview / Validation progress, VC Readiness, Profile
   ============================================================ */

/* ---------------- APPLICATION STATUS (founder-facing) ---------------- */
function founderQualityGate() {
  const s = Store.myStartup();
  const app = myTopApp();
  const st = founderAppStatus(app);
  const opp = app ? Store.getOpportunity(app.opportunityId) : null;
  const stage = app ? INTERNAL_STAGES[app.stage] : null;

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Application Status</h1><p class="sub">A simple, clear view of where your application stands. Venture Connect conducts the full quality process internally.</p></div>' +
      (app ? '<span class="badge ' + (st.tone === "success" ? "badge-success" : st.tone === "warning" ? "badge-warning" : st.tone === "danger" ? "badge-danger" : "badge-indigo") + '" style="font-size:12.5px;padding:7px 14px">' + st.label + '</span>' : '') +
    '</div>' +

    (app
      ? '<div class="glass-strong card" style="padding:22px 24px;margin-bottom:18px">' +
          '<div class="row-between" style="flex-wrap:wrap;gap:12px;margin-bottom:14px">' +
            '<div class="row" style="gap:12px"><span class="card-title-ic green" style="width:38px;height:38px">' + Icon("send", 17) + '</span>' +
            '<div><div class="semibold" style="font-size:15px">' + (opp ? opp.title : "Application") + '</div>' +
            '<div class="tiny faint">' + (opp ? opp.org : "") + ' · Applied ' + app.submitted + ' · Last update ' + app.lastUpdate + '</div></div></div>' +
            '<div style="text-align:right"><div class="tiny faint semibold">CURRENT STAGE</div><div class="semibold" style="color:var(--accent-deep)">' + stage.name + '</div></div>' +
          '</div>' +
          statusStrip(app) +
        '</div>'
      : emptyState("send", "No applications yet", "Apply to an opportunity and your status will appear here.", '<button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate(\'#/founder/opportunities\')">' + Icon("briefcase", 15) + 'Browse Opportunities</button>')) +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic violet">' + Icon("shield", 17) + '</span>How Venture Connect reviews your application</div></div>' +
        '<p class="muted small" style="line-height:1.7">Behind your status, Venture Connect runs an internal quality process: automated checks on completeness and clarity, a human review, a pitch review, a founder interview, and evidence verification.</p>' +
        '<p class="muted small" style="line-height:1.7;margin-top:10px">You do not operate this process — you simply see its result at each step. If the reviewers need anything from you, you will be asked directly. Only after the Quality Gate passes does the relevant investor or incubator get to see your application.</p>' +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("layers", 17) + '</span>Your applications</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/founder/applications\')">View all</button></div>' +
        (app
          ? '<div class="app-status-row"><div class="asr-main"><div class="semibold" style="font-size:13.5px">' + (opp ? opp.title : "Application") + '</div><div class="tiny faint">' + (opp ? opp.org : "") + '</div></div>' +
            '<span class="badge badge-indigo">' + st.label + '</span></div>' +
            '<div class="row" style="margin-top:12px">' +
              '<button class="btn btn-soft btn-sm" onclick="App.navigate(\'#/founder/application/' + app.id + '\')">' + Icon("eye", 13) + 'View Details</button>' +
              (opp ? '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/founder/opportunity/' + opp.id + '\')">' + Icon("briefcase", 13) + 'View Opportunity</button>' : '') +
            '</div>'
          : '<p class="muted small">No applications yet.</p>') +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- PITCH REVIEW (founder-facing, read-only) ---------------- */
function founderPitchReview() {
  const s = Store.myStartup();
  const app = myTopApp();
  const st = founderAppStatus(app);

  const dims = ["Pitch quality", "Problem clarity", "Solution clarity", "Market understanding", "Founder communication", "Business model", "Evidence"];

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Pitch Review</h1><p class="sub">Venture Connect evaluates your pitch like an early-stage investment — here is what that involves.</p></div>' +
      '<span class="badge badge-indigo">' + Icon("present", 12) + ' In review</span>' +
    '</div>' +

    '<div class="status-banner violet" style="margin-bottom:18px">' +
      '<span class="sb-ic">' + Icon("present", 20) + '</span>' +
      '<div><b>Your pitch is under review</b><p>Status: ' + st.label + '. Reviewers assess the dimensions below — no action needed from you right now.</p></div>' +
    '</div>' +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("target", 17) + '</span>What reviewers assess</div></div>' +
        '<div class="col" style="gap:9px">' + dims.map(d =>
          '<div class="row" style="gap:11px"><span class="badge badge-indigo" style="padding:2px 8px">' + Icon("check", 10) + '</span><span class="small">' + d + '</span></div>'
        ).join("") + '</div>' +
        '<p class="tiny faint" style="margin-top:14px">' + Icon("info", 11) + ' Your pitch deck and workspace answers are the basis for this review.</p>' +
      '</div>' +
      '<div class="stack">' +
        '<div class="glass card">' +
          '<div class="card-header"><div class="h3"><span class="card-title-ic amber">' + Icon("message", 17) + '</span>Reviewer feedback</div></div>' +
          (app && app.pitch && app.pitch.notes
            ? '<div class="small muted" style="padding:12px 14px;border-radius:12px;background:var(--accent-softer);border:1px solid rgba(99,102,241,.15)">' + app.pitch.notes + '</div>'
            : '<p class="muted small">Feedback will appear here after the review completes.</p>') +
        '</div>' +
        '<div class="glass card">' +
          '<div class="card-header"><div class="h3"><span class="card-title-ic green">' + Icon("arrowR", 17) + '</span>Next stage</div></div>' +
          '<p class="muted small">If the pitch passes, Venture Connect schedules a founder interview. You will see the interview details in your application status.</p>' +
          '<button class="btn btn-soft btn-sm" style="margin-top:12px" onclick="App.navigate(\'#/founder/applications\')">' + Icon("layers", 13) + 'View Applications</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- FOUNDER INTERVIEW (founder-facing, read-only) ---------------- */
function founderInterview() {
  const app = myTopApp();
  const intv = app ? app.interview : { scheduled: "", completed: false, notes: "" };

  const agenda = [
    "Problem depth — walk through your interviews and pilot evidence",
    "Market & channel — how you reach customers and scale",
    "Team & execution — who does what, and what has shipped",
    "Use of funds — allocation and the 12-month plan"
  ];

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Founder Interview</h1><p class="sub">A structured conversation with the Venture Connect review team before evidence verification.</p></div>' +
      '<span class="badge badge-indigo">' + Icon("users", 12) + ' Stage 5 of 8</span>' +
    '</div>' +

    '<div class="status-banner ' + (intv.completed ? "success" : "info") + '" style="margin-bottom:18px">' +
      '<span class="sb-ic">' + Icon(intv.completed ? "checkCircle" : "calendar", 20) + '</span>' +
      '<div><b>' + (intv.completed ? "Interview completed" : intv.scheduled ? "Interview scheduled" : "Interview not yet scheduled") + '</b>' +
      '<p>' + (intv.completed ? "The interview is complete. Notes from the review team are below." : intv.scheduled ? "Venture Connect will contact you with the confirmed link." : "This stage comes after the pitch review passes.") + '</p></div>' +
    '</div>' +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="stack">' +
        '<div class="glass card">' +
          '<div class="card-header"><div class="h3"><span class="card-title-ic blue">' + Icon("calendar", 17) + '</span>Interview</div></div>' +
          (intv.scheduled
            ? '<div class="row" style="gap:16px"><div style="text-align:center;padding:13px 16px;border-radius:15px;background:linear-gradient(135deg,var(--accent-2),var(--accent-deep));color:#fff"><div class="tiny semibold" style="opacity:.85">' + intv.scheduled.split("·")[0].trim() + '</div><div class="tiny semibold" style="opacity:.85">' + (intv.scheduled.split("·")[1] || "").trim() + '</div></div>' +
              '<div class="col"><div class="semibold small">45-minute video call</div><div class="tiny faint">Venture Connect review team</div></div></div>'
            : '<p class="muted small">Scheduling details will appear here.</p>') +
        '</div>' +
        '<div class="glass card">' +
          '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("file", 17) + '</span>Agenda</div></div>' +
          '<div class="col" style="gap:8px">' + agenda.map(a =>
            '<div class="row" style="gap:10px;align-items:flex-start"><span class="badge badge-indigo" style="padding:2px 8px;margin-top:1px">' + Icon("check", 10) + '</span><span class="small">' + a + '</span></div>'
          ).join("") + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic amber">' + Icon("edit", 17) + '</span>Interview notes</div></div>' +
        (intv.notes
          ? '<div class="small muted" style="padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.6);border:1px solid var(--hairline)">' + intv.notes + '</div>'
          : '<p class="muted small">Notes will appear here after the interview.</p>') +
        '<div class="divider"></div>' +
        '<div class="h3" style="font-size:14px;margin-bottom:8px">Next stage</div>' +
        '<p class="muted small">After the interview, Venture Connect verifies your evidence — interviews, pilots, surveys, and traction — one item at a time.</p>' +
        '<button class="btn btn-soft btn-sm" style="margin-top:12px" onclick="App.navigate(\'#/founder/applications\')">' + Icon("layers", 13) + 'View Applications</button>' +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- EVIDENCE / VALIDATION (founder-facing, read-only) ---------------- */
function founderValidation() {
  const s = Store.myStartup();
  const app = myTopApp();
  const items = s.evidence || [];
  const verified = items.filter(e => e.status === "Verified").length;

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Evidence &amp; Validation</h1><p class="sub">Venture Connect verifies the evidence behind your claims — here is where that stands.</p></div>' +
      '<span class="badge badge-indigo">' + Icon("verify", 12) + ' Verification in progress</span>' +
    '</div>' +

    '<div class="status-banner info" style="margin-bottom:18px">' +
      '<span class="sb-ic">' + Icon("verify", 20) + '</span>' +
      '<div><b>' + verified + ' of ' + items.length + ' evidence items verified</b><p>Each item is checked by a reviewer. You will be asked for clarification if anything is missing.</p></div>' +
      '<div style="width:150px;flex:none">' + bar(Math.round((verified / Math.max(1, items.length)) * 100)) + '<div class="tiny faint" style="margin-top:4px;text-align:right">' + Math.round((verified / Math.max(1, items.length)) * 100) + '% verified</div></div>' +
    '</div>' +

    '<div class="stack">' +
      items.map(e => {
        const st = (app && app.evidenceStatus && app.evidenceStatus[e.type]) || e.status;
        return '<div class="glass card" style="padding:20px">' +
          '<div class="row-between" style="flex-wrap:wrap;gap:10px">' +
            '<div class="row" style="gap:13px"><span class="card-title-ic ' + (st === "Verified" ? "green" : st === "Needs clarification" ? "amber" : "blue") + '">' + Icon(st === "Verified" ? "verify" : st === "Needs clarification" ? "alert" : "clock", 16) + '</span>' +
            '<div><div class="semibold" style="font-size:14.5px">' + e.type + '</div><div class="tiny faint">' + e.description + '</div></div></div>' +
            evidenceBadge(st) +
          '</div>' +
          '<div style="padding:11px 13px;border-radius:12px;background:rgba(255,255,255,.55);border:1px solid var(--hairline);margin-top:12px">' +
            '<div class="tiny semibold faint" style="letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px">Reviewer notes</div>' +
            '<div class="small">' + ((app && app.evidenceNotes && app.evidenceNotes[e.type]) || e.notes) + '</div>' +
          '</div>' +
        '</div>';
      }).join("") +
    '</div>';

  return html;
}

/* ---------------- VC READINESS REPORT ---------------- */
function founderReadiness() {
  const s = Store.myStartup();
  const f = Store.founder();

  const dims = [
    { k: "problem", label: "Problem clarity", note: "Specific, quantified, and painful. Interviews anchor the claim." },
    { k: "market", label: "Market", note: "Addressable segment defined; TAM logic clear. Deepen bottom-up sizing." },
    { k: "solution", label: "Solution", note: "Mechanism is clear and tied to the problem. Prototype stage." },
    { k: "validation", label: "Validation", note: "Real evidence (43 interviews, 12-farm pilot) but waitlist channel needs documentation." },
    { k: "businessModel", label: "Business model", note: "Two-sided revenue logic works. Margin math needs one more pass." },
    { k: "team", label: "Team", note: "Complementary co-founders, relevant advisor. Strong for pre-seed." }
  ];
  const fr = (f.workspace.funding && f.workspace.useOfFunds) ? 78 : 42;

  const recs = [
    "Document the waitlist collection channel (dates, source, contact list) before validation verification.",
    "Re-run the co-op channel math with a sensitivity case at 25% lower margins.",
    "Add a bottom-up market build to complement the top-down TAM.",
    "Prepare the first 10 pages of the investor memo — the committee reads those first."
  ];

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">VC Readiness Report</h1><p class="sub">A transparent 0–100 assessment across the dimensions investors actually weigh.</p></div>' +
      '<div class="row">' +
        '<button class="btn btn-ghost" onclick="App.exportReport()">' + Icon("download", 15) + 'Export Report</button>' +
        '<button class="btn btn-primary no-print" onclick="window.print()">' + Icon("file", 15) + 'Print / PDF</button>' +
      '</div>' +
    '</div>' +

    '<div class="glass-strong card" style="padding:30px;margin-bottom:18px">' +
      '<div class="row" style="gap:30px;flex-wrap:wrap">' +
        Ring(s.score, 132, "readiness") +
        '<div style="flex:1;min-width:260px">' +
          '<div class="h3" style="margin-bottom:4px">' + s.name + ' — overall readiness</div>' +
          '<p class="muted small" style="margin-bottom:16px">Pre-seed benchmark: 70+ is ready to approach investors; 80+ is competitive against screened peer pipelines.</p>' +
          '<div class="col" style="gap:9px">' + dims.map(d =>
            '<div><div class="row-between"><span class="small semibold">' + d.label + '</span><span class="small mono bold" style="color:var(--accent-deep)">' + s.scoreBreak[d.k] + '</span></div>' + bar(s.scoreBreak[d.k], "thin") + '</div>'
          ).join("") +
          '<div><div class="row-between"><span class="small semibold">Funding readiness</span><span class="small mono bold" style="color:var(--accent-deep)">' + fr + '</span></div>' + bar(fr, "thin") + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid-2" style="align-items:start">' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("target", 17) + '</span>Dimension breakdown</div></div>' +
        '<div class="col" style="gap:14px">' + dims.map(d =>
          '<div style="padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.55);border:1px solid var(--hairline)">' +
            '<div class="row-between"><span class="semibold small">' + d.label + '</span><span class="score-chip" style="font-size:12px;padding:2px 9px">' + s.scoreBreak[d.k] + '</span></div>' +
            '<div class="small muted" style="margin-top:5px">' + d.note + '</div>' +
          '</div>'
        ).join("") + '</div>' +
      '</div>' +
      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic amber">' + Icon("trending", 17) + '</span>Recommendations</div></div>' +
        '<div class="col" style="gap:10px">' + recs.map((r, i) =>
          '<div class="row" style="gap:11px;align-items:flex-start"><span class="tag" style="width:22px;height:22px;border-radius:8px;display:grid;place-items:center;flex:none;margin-top:1px">' + (i + 1) + '</span><span class="small" style="line-height:1.55">' + r + '</span></div>'
        ).join("") + '</div>' +
        '<div style="padding:13px 15px;border-radius:14px;background:var(--accent-softer);border:1px solid rgba(99,102,241,.15);margin-top:14px">' +
          '<div class="small semibold" style="color:var(--accent-deep)">' + Icon("spark", 12) + ' Analyst note</div>' +
          '<p class="small muted" style="margin-top:4px">"Readiness moved +6 points after the validation section was added. The fastest lever now is documentation of the waitlist channel — it costs nothing and moves Validation toward 75+."</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  return html;
}

/* ---------------- FOUNDER PROFILE ---------------- */
function founderProfile() {
  const f = Store.founder();
  const s = Store.myStartup();

  const html =
    '<div class="page-head">' +
      '<div><h1 class="h1">Profile</h1><p class="sub">This profile is visible to investors and incubators after an application passes the Quality Gate.</p></div>' +
    '</div>' +

    '<div class="grid-2" style="grid-template-columns:300px 1fr;align-items:start">' +
      '<div class="glass card" style="text-align:center">' +
        '<div style="display:grid;place-items:center;margin-bottom:12px">' + personAvatar(f.name, 84) + '</div>' +
        '<div class="semibold" style="font-size:17px">' + f.name + '</div>' +
        '<div class="small muted">' + f.college + '</div>' +
        '<div class="small muted">' + f.location + '</div>' +
        '<div class="row-wrap" style="justify-content:center;margin-top:14px">' + f.skills.map(sk => '<span class="tag">' + sk + '</span>').join("") + '</div>' +
        '<div class="divider"></div>' +
        '<div class="small semibold" style="text-align:left;margin-bottom:8px">Startup</div>' +
        '<div class="row" style="gap:11px">' + startupLogo(s, 40) + '<div style="text-align:left"><div class="semibold small">' + s.name + '</div><div class="tiny faint">' + s.sector + ' · ' + s.stage + '</div></div></div>' +
      '</div>' +

      '<div class="glass card">' +
        '<div class="card-header"><div class="h3"><span class="card-title-ic">' + Icon("user", 17) + '</span>Founder details</div></div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Name</label><input class="input" id="pf-name" value="' + escapeHtml(f.name) + '" /></div>' +
          '<div class="field"><label>College / University</label><input class="input" id="pf-college" value="' + escapeHtml(f.college) + '" /></div>' +
          '<div class="field"><label>Location</label><input class="input" id="pf-location" value="' + escapeHtml(f.location) + '" /></div>' +
          '<div class="field"><label>Founder bio</label><input class="input" id="pf-bio" value="' + escapeHtml(f.bio) + '" /></div>' +
          '<div class="field"><label>LinkedIn</label><input class="input" id="pf-li" value="' + escapeHtml(f.socials.linkedin) + '" /></div>' +
          '<div class="field"><label>Twitter / X</label><input class="input" id="pf-tw" value="' + escapeHtml(f.socials.twitter) + '" /></div>' +
          '<div class="field"><label>GitHub</label><input class="input" id="pf-gh" value="' + escapeHtml(f.socials.github) + '" /></div>' +
          '<div class="field"><label>Skills (comma separated)</label><input class="input" id="pf-skills" value="' + escapeHtml(f.skills.join(", ")) + '" /></div>' +
        '</div>' +
        '<div class="row" style="justify-content:flex-end;margin-top:6px">' +
          '<button class="btn btn-primary" onclick="App.saveFounderProfile()">' + Icon("check", 15) + 'Save Profile</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  return html;
}
