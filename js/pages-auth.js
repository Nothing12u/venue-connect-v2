/* ============================================================
   VENTURE CONNECT — Authentication & Onboarding
   Production-ready authentication flows for all user types
   ============================================================ */

let authStep = 0;
let authRole = null;
let authDraft = {};
let authPartner = null;

/* ---------------- ENTRY SCREEN (#/auth) ---------------- */
function renderAuth() {
  const html =
    '<nav class="land-nav">' +
      '<a href="#/" class="vc-logo lg-nav" title="Venture Connect"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></a>' +
      '<a href="#/auth/login" class="btn btn-ghost btn-sm" style="margin-left:auto">' + Icon("user", 14) + 'Log In</a>' +
    '</nav>' +

    '<div class="auth-wrap">' +
      '<div style="text-align:center;max-width:620px;margin:0 auto 44px">' +
        '<span class="vc-logo lg-hero" style="justify-content:center;margin-bottom:20px"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></span>' +
        '<h1 class="auth-h1">Welcome to Venture Connect</h1>' +
        '<p class="muted" style="font-size:16.5px;margin-top:12px;line-height:1.6">Build ventures. Discover opportunities. Connect with the right ecosystem.</p>' +
      '</div>' +

      '<div class="grid-2 auth-cards">' +
        '<div class="glass glass-hover auth-card">' +
          '<div class="ac-ic violet">' + Icon("spark", 26) + '</div>' +
          '<h2 class="h2">Founder</h2>' +
          '<p class="muted small" style="line-height:1.65;margin:8px 0 18px">Build your startup, discover opportunities, and apply to programs and funding opportunities.</p>' +
          '<div class="row-wrap" style="margin-bottom:18px">' +
            '<span class="tag">Idea Workspace</span><span class="tag">Opportunities</span><span class="tag">Applications</span><span class="tag">VC Readiness</span>' +
          '</div>' +
          '<button class="btn btn-primary btn-lg btn-block" onclick="App.authSignup(\'founder\')">' + Icon("arrowR", 16) + 'Get Started as Founder</button>' +
        '</div>' +
        '<div class="glass glass-hover auth-card">' +
          '<div class="ac-ic indigo">' + Icon("eye", 26) + '</div>' +
          '<h2 class="h2">Investor / Ecosystem</h2>' +
          '<p class="muted small" style="line-height:1.65;margin:8px 0 18px">Discover qualified startups, create opportunities, and connect with founders.</p>' +
          '<div class="row-wrap" style="margin-bottom:18px">' +
            '<span class="tag">Discover</span><span class="tag">Opportunities</span><span class="tag">Applications</span><span class="tag">Messaging</span>' +
          '</div>' +
          '<button class="btn btn-soft btn-lg btn-block" onclick="App.authPartnerModal()">' + Icon("arrowR", 16) + 'Get Started as Investor / Ecosystem</button>' +
        '</div>' +
      '</div>' +

      '<div style="text-align:center;margin-top:38px">' +
        '<div class="small muted" style="margin-bottom:12px">Have an account? <a href="#/auth/login" class="semibold" style="color:var(--accent-deep)">Log in</a></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/auth/admin\')" style="margin-top:14px">' + Icon("shield", 14) + 'Admin Sign In</button>' +
      '</div>' +
    '</div>';

  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}

/* ---------------- ECOSYSTEM PARTNER MODAL ---------------- */
function authPartnerModal() {
  authPartner = null;
  openModal(
    '<div class="modal-head"><h3 class="h3">What type of ecosystem partner are you?</h3><button class="modal-close" onclick="closeModal()">' + Icon("x", 15) + '</button></div>' +
    '<p class="muted small" style="margin-bottom:16px">Your role shapes your onboarding and dashboard experience.</p>' +
    '<div class="col" style="gap:10px">' +
      partnerOption("investor", "trending", "Investor", "Discover and invest in promising startups.") +
      partnerOption("incubator", "layers", "Incubator", "Support, mentor, and build early-stage startups.") +
      partnerOption("organizer", "calendar", "Hackathon Organizer", "Create and publish hackathons and startup opportunities.") +
    '</div>' +
    '<button class="btn btn-primary btn-lg btn-block" id="partner-continue" style="margin-top:18px" disabled onclick="App.authPartnerContinue()">' + Icon("arrowR", 16) + 'Continue</button>'
  );
}

function partnerOption(key, icon, title, desc) {
  return '<div class="partner-opt" id="po-' + key + '" onclick="App.authSelectPartner(\'' + key + '\')">' +
    '<span class="po-ic">' + Icon(icon, 18) + '</span>' +
    '<div style="flex:1"><div class="semibold" style="font-size:14.5px">' + title + '</div><div class="small muted" style="margin-top:2px">' + desc + '</div></div>' +
    '<span class="po-check">' + Icon("check", 13) + '</span>' +
  '</div>';
}

/* ---------------- LOGIN (#/auth/login) ---------------- */
function renderLogin() {
  const html =
    '<nav class="land-nav">' +
      '<a href="#/" class="vc-logo lg-nav" title="Venture Connect"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></a>' +
      '<a href="#/auth" class="btn btn-ghost btn-sm" style="margin-left:auto">' + Icon("chevL", 13) + 'Back</a>' +
    '</nav>' +

    '<div class="auth-wrap" style="padding-top:60px">' +
      '<div class="glass-strong card auth-form">' +
        '<div style="text-align:center;margin-bottom:24px">' +
          '<span class="vc-logo lg-auth" style="justify-content:center;margin-bottom:16px"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></span>' +
          '<h1 class="h2">Welcome Back</h1>' +
          '<p class="small muted" style="margin-top:4px">Sign in to continue your Venture Connect journey.</p>' +
        '</div>' +
        '<div class="field"><label>Email</label><input class="input" id="li-email" type="email" placeholder="you@example.com" /></div>' +
        '<div class="field"><label>Password <span class="toggle-pw" onclick="togglePwVis(this)">' + Icon("eye", 14) + '</span></label><input class="input" id="li-pass" type="password" placeholder="Enter your password" onkeydown="if(event.key===\'Enter\')App.loginSubmit()" /></div>' +
        '<div class="row-between" style="margin-bottom:16px">' +
          '<button class="btn btn-ghost btn-sm" onclick="App.authForgot()">Forgot password?</button>' +
        '</div>' +
        '<button class="btn btn-primary btn-lg btn-block" onclick="App.loginSubmit()">' + Icon("arrowR", 16) + 'Log In</button>' +
        '<div class="divider"></div>' +
        '<div class="small muted semibold" style="text-align:center;margin-bottom:10px">Continue as</div>' +
        '<div class="grid-2" style="gap:10px">' +
          '<button class="btn btn-ghost" onclick="App.authSignup(\'founder\')">' + Icon("spark", 14) + 'Founder</button>' +
          '<button class="btn btn-ghost" onclick="App.authPartnerModal()">' + Icon("eye", 14) + 'Investor / Ecosystem</button>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'#/auth/admin\')" style="margin-top:14px">' + Icon("shield", 14) + 'Admin Sign In</button>' +
      '</div>' +
    '</div>';

  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}

/* ---------------- SIGNUP FLOWS ----------------
   Reduced-friction onboarding: 2 short stages per role.
   Everything else is collected progressively inside the product. */
const AUTH_FLOWS = {
  founder: {
    title: "Create your Founder Account",
    icon: "spark",
    submitLabel: "Continue to Venture Connect",
    steps: [
      { name: "Account", note: "Your login details — nothing else, yet.", fields: [
        { key: "fullName", label: "Full Name", type: "text", req: true, ph: "e.g. Aarav Mehta" },
        { key: "email", label: "Email", type: "email", req: true, ph: "you@example.com" },
        { key: "password", label: "Password", type: "password", req: true, ph: "Min. 6 characters" },
        { key: "confirm", label: "Confirm Password", type: "password", req: true, ph: "Repeat your password" }
      ]},
      { name: "Basic Profile", note: "Used to match you with the right opportunities.", fields: [
        { key: "college", label: "College / University", type: "text", req: true, ph: "e.g. IIT Bombay" },
        { key: "gradYear", label: "Graduation Year", type: "text", req: true, ph: "e.g. 2027" },
        { key: "startupName", label: "Startup / Idea Name", type: "text", req: true, ph: "e.g. EcoHarvest" },
        { key: "industry", label: "Domain", type: "chips-single", req: true, options: INDUSTRIES },
        { key: "stage", label: "Current Stage", type: "chips-single", req: true, options: STARTUP_STAGES }
      ]}
    ]
  },
  investor: {
    title: "Create your Investor Account",
    icon: "trending",
    submitLabel: "Enter Investor Dashboard",
    steps: [
      { name: "Account", note: "Your login details — nothing else, yet.", fields: [
        { key: "fullName", label: "Full Name", type: "text", req: true, ph: "e.g. Nikhil Rao" },
        { key: "email", label: "Work Email", type: "email", req: true, ph: "you@firm.com" },
        { key: "password", label: "Password", type: "password", req: true, ph: "Min. 6 characters" },
        { key: "confirm", label: "Confirm Password", type: "password", req: true, ph: "Repeat your password" }
      ]},
      { name: "Investment Profile", note: "Preferences like ticket size and geography can be completed later from your profile.", fields: [
        { key: "org", label: "Investment Firm", type: "text", req: true, ph: "e.g. Meridian Capital" },
        { key: "sectors", label: "Investment Domain", type: "chips-multi", req: true, options: INVESTOR_SECTORS },
        { key: "stages", label: "Investment Stage", type: "chips-single", req: true, options: ["Idea Stage", "Pre-Seed", "Seed", "Series A+", "MVP / Early Revenue"] }
      ]}
    ]
  },
  incubator: {
    title: "Create your Incubator Account",
    icon: "layers",
    submitLabel: "Enter Incubator Dashboard",
    steps: [
      { name: "Account", note: "Your login details — nothing else, yet.", fields: [
        { key: "fullName", label: "Full Name", type: "text", req: true, ph: "e.g. Priya Nair" },
        { key: "email", label: "Official Email", type: "email", req: true, ph: "hello@incubator.org" },
        { key: "password", label: "Password", type: "password", req: true, ph: "Min. 6 characters" },
        { key: "confirm", label: "Confirm Password", type: "password", req: true, ph: "Repeat your password" }
      ]},
      { name: "Organization", note: "Program details like support and duration can be completed later from your profile.", fields: [
        { key: "org", label: "Incubator Name", type: "text", req: true, ph: "e.g. Example Incubator" },
        { key: "sectors", label: "Primary Domain", type: "chips-multi", req: true, options: INCUBATOR_SECTORS },
        { key: "stages", label: "Startup Stage Supported", type: "chips-multi", req: true, options: INCUBATOR_STAGES }
      ]}
    ]
  },
  organizer: {
    title: "Create your Organizer Account",
    icon: "calendar",
    submitLabel: "Enter Organizer Dashboard",
    steps: [
      { name: "Account", note: "Your login details — nothing else, yet.", fields: [
        { key: "org", label: "Organization / Organizer Name", type: "text", req: true, ph: "e.g. Hack the Valley Collective" },
        { key: "email", label: "Official Email", type: "email", req: true, ph: "events@org.com" },
        { key: "password", label: "Password", type: "password", req: true, ph: "Min. 6 characters" },
        { key: "confirm", label: "Confirm Password", type: "password", req: true, ph: "Repeat your password" }
      ]},
      { name: "Organization", note: "Event details can be completed later from your profile.", fields: [
        { key: "orgType", label: "Organizer Type", type: "select", req: true, options: ORGANIZER_TYPES },
        { key: "domains", label: "Typical Domains", type: "chips-multi", req: true, options: HACKATHON_DOMAINS }
      ]}
    ]
  }
};

function renderSignup(role) {
  if (authRole !== role) { authRole = role; authStep = 0; authDraft = {}; }
  const flow = AUTH_FLOWS[role];
  if (!flow) { renderAuth(); return; }
  const step = flow.steps[authStep];
  const last = authStep === flow.steps.length - 1;

  const stepBar = flow.steps.map((s, i) => {
    const cls = i < authStep ? " done" : i === authStep ? " current" : "";
    return '<div class="step-item' + cls + '">' +
      '<span class="step-dot">' + (i < authStep ? Icon("check", 11) : i + 1) + '</span>' +
      '<span class="step-name">' + esc(s.name) + '</span>' +
      (i < flow.steps.length - 1 ? '<span class="step-line"></span>' : '') +
    '</div>';
  }).join("");

  const fields = (step.fields || []).map(f => authField(f)).join("");

  const heroTitle = flow.title;
  const heroSub = role === "investor" ? "Investor Profile" : role === "incubator" ? "Incubator Profile" : "Organizer Profile";

  const html =
    '<nav class="land-nav">' +
      '<a href="#/auth" class="vc-logo lg-nav" title="Venture Connect"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></a>' +
      '<a href="#/auth" class="btn btn-ghost btn-sm" style="margin-left:auto">' + Icon("x", 14) + 'Exit</a>' +
    '</nav>' +

    '<div class="auth-wrap" style="padding-top:56px">' +
      '<div class="auth-form glass-strong card" style="max-width:680px">' +
        '<div style="margin-bottom:22px">' +
          '<span class="vc-logo lg-auth" style="justify-content:center;margin-bottom:14px"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></span>' +
          '<h1 class="h2" style="text-align:center">' + heroTitle + '</h1>' +
          '<p class="small muted" style="text-align:center;margin-top:2px">' + (role === "founder" ? "Two quick steps and you are in — everything else happens inside the product." : "Two quick steps and you are in — preferences can be completed later from your profile.") + '</p>' +
          '<p class="small faint" style="text-align:center;margin-top:10px">Step ' + (authStep + 1) + ' of ' + flow.steps.length + ' — ' + esc(step.name) + '</p>' +
          (step.note ? '<p class="tiny faint" style="text-align:center;margin-top:4px">' + step.note + '</p>' : '') +
        '</div>' +

        '<div class="step-bar">' + stepBar + '</div>' +

        (fields ? '<div class="stack" style="margin-top:22px">' + fields + '</div>' : '') +
        (last ? '<div style="margin-top:22px">' + authSummary(role, flow) + '</div>' : '') +

        '<div class="row-between" style="margin-top:26px">' +
          '<button class="btn btn-ghost" onclick="App.authPrev()"' + (authStep === 0 ? " disabled" : "") + '>' + Icon("chevL", 14) + 'Back</button>' +
          (last
            ? '<button class="btn btn-primary btn-lg" onclick="App.authSubmit()">' + Icon("checkCircle", 16) + (flow.submitLabel || "Create Account") + '</button>'
            : '<button class="btn btn-primary" onclick="App.authNext()">Continue' + Icon("chevR", 14) + '</button>') +
        '</div>' +
        '<p class="tiny faint" style="text-align:center;margin-top:16px">By continuing you agree to the Venture Connect Terms of Service. All data is stored securely.</p>' +
      '</div>' +
    '</div>';

  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}

function authSummary(role, flow) {
  const d = authDraft;
  const rows = [];
  if (role === "founder") {
    rows.push(["Name", d.fullName], ["Email", d.email], ["College", d.college], ["Graduation year", d.gradYear], ["Startup", d.startupName], ["Domain", d.industry], ["Stage", d.stage]);
  } else if (role === "investor") {
    rows.push(["Name", d.fullName], ["Email", d.email], ["Firm", d.org], ["Domains", (d.sectors || []).join(", ")], ["Stages", (typeof d.stages === "string" ? d.stages : (d.stages || []).join(", "))]);
  } else if (role === "incubator") {
    rows.push(["Name", d.fullName], ["Email", d.email], ["Incubator", d.org], ["Focus", (d.sectors || []).join(", ")], ["Stages", (typeof d.stages === "string" ? d.stages : (d.stages || []).join(", "))]);
  } else {
    rows.push(["Organization", d.org], ["Type", d.orgType], ["Email", d.email], ["Domains", (d.domains || []).join(", ")]);
  }
  return '<div style="padding:16px 18px;border-radius:16px;background:var(--accent-softer);border:1px solid rgba(99,102,241,.15)">' +
    '<div class="semibold small" style="color:var(--accent-deep);margin-bottom:10px">' + Icon("checkCircle", 13) + ' Almost there — review your profile</div>' +
    '<div class="kv" style="grid-template-columns:130px 1fr">' + rows.map(r => '<dt>' + r[0] + '</dt><dd>' + (r[1] || "—") + '</dd>').join("") + '</div>' +
  '</div>';
}

/* ---------------- ADMIN SIGNIN ---------------- */
function renderAdminAuth() {
  const html =
    '<nav class="land-nav">' +
      '<a href="#/" class="vc-logo lg-nav" title="Venture Connect"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></a>' +
      '<a href="#/auth/login" class="btn btn-ghost btn-sm" style="margin-left:auto">' + Icon("chevL", 13) + 'Back</a>' +
    '</nav>' +

    '<div class="auth-wrap" style="padding-top:60px">' +
      '<div class="glass-strong card auth-form" style="max-width:520px">' +
        '<div style="text-align:center;margin-bottom:24px">' +
          '<span class="vc-logo lg-auth" style="justify-content:center;margin-bottom:16px"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></span>' +
          '<h1 class="h2">Venture Connect Admin</h1>' +
          '<p class="small muted" style="margin-top:4px">Internal quality control access only.</p>' +
        '</div>' +
        '<div class="field"><label>Email</label><input class="input" id="admin-email" type="email" placeholder="you@ventureconnect.internal" /></div>' +
        '<div class="field"><label>Password <span class="toggle-pw" onclick="togglePwVis(this)">' + Icon("eye", 14) + '</span></label><input class="input" id="admin-pass" type="password" placeholder="Enter password" onkeydown="if(event.key===\'Enter\')App.adminLogin()" /></div>' +
        '<button class="btn btn-primary btn-lg btn-block" onclick="App.adminLogin()">' + Icon("shield", 16) + 'Sign In as Admin</button>' +
        '<div class="divider"></div>' +
        '<p class="tiny faint" style="text-align:center">Admin access is restricted to Venture Connect internal team members only.</p>' +
      '</div>' +
    '</div>';

  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}

/* ---------------- route dispatch ---------------- */
function renderAuthPage(sub, role) {
  if (sub === "login") return renderLogin();
  if (sub === "admin") return renderAdminAuth();
  if (sub === "signup") return renderSignup(role);
  return renderAuth();
}

function authField(f) {
  const d = authDraft;
  if (f.type === "chips-multi" || f.type === "chips-single") {
    const selected = d[f.key] || (f.type === "chips-multi" ? [] : "");
    const chips = f.options.map(o => {
      const on = f.type === "chips-multi" ? selected.includes(o) : selected === o;
      return '<button class="chip' + (on ? " active" : "") + '" onclick="App.authChip(\'' + f.key + '\',\'' + o.replace(/'/g, "\\'") + '\')">' + (on ? Icon("check", 11) + ' ' : '') + o + '</button>';
    }).join("");
    return '<div class="field"><label>' + f.label + (f.req ? ' <span class="req">*</span>' : '') + '</label><div class="row-wrap">' + chips + '</div></div>';
  }
  if (f.type === "select") {
    const opts = ['<option value="">Select—</option>'].concat(f.options.map(o => '<option value="' + o + '"' + (d[f.key] === o ? " selected" : "") + '>' + o + '</option>')).join("");
    return '<div class="field"><label>' + f.label + (f.req ? ' <span class="req">*</span>' : '') + '</label><select class="select" id="af-' + f.key + '" onchange="App.authFieldSet(\'' + f.key + '\',this.value)">' + opts + '</select></div>';
  }
  if (f.type === "textarea") {
    return '<div class="field"><label>' + f.label + (f.req ? ' <span class="req">*</span>' : '') + '</label><textarea class="textarea" id="af-' + f.key + '" placeholder="' + (f.ph || "") + '" oninput="App.authFieldSet(\'' + f.key + '\',this.value)">' + escapeHtml(d[f.key] || "") + '</textarea></div>';
  }
  return '<div class="field"><label>' + f.label + (f.req ? ' <span class="req">*</span>' : '') + '</label><input class="input" id="af-' + f.key + '" type="' + (esc(f.type) || "text") + '" placeholder="' + (f.ph || "") + '" value="' + escapeHtml(d[f.key] || "") + '" oninput="App.authFieldSet(\'' + f.key + '\',this.value)" /></div>';
}
