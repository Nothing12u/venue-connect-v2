/* ============================================================
   VENTURE CONNECT — Router, shell, and app actions
   ============================================================ */

function errorPage() {
  return '<div class="err-404 glass-strong card">' +
    '<div class="code">404</div>' +
    '<h2 class="h2">This page drifted off the map</h2>' +
    '<p class="muted small" style="max-width:360px">The route you followed does not exist in the Venture Connect ecosystem.</p>' +
    '<div class="row" style="margin-top:18px">' +
      '<button class="btn btn-primary" onclick="App.navigate(\'#/\')">' + Icon("home", 15) + 'Back to landing</button>' +
      '<button class="btn btn-ghost" onclick="history.back()">' + Icon("chevL", 15) + 'Go back</button>' +
    '</div>' +
  '</div>';
}

const NAV = {
  founder: [
    { id: "dashboard", label: "Dashboard", icon: "home", route: "#/founder/dashboard" },
    { id: "workspace", label: "Idea Workspace", icon: "edit", route: "#/founder/workspace" },
    { id: "opportunities", label: "Opportunities", icon: "briefcase", route: "#/founder/opportunities" },
    { id: "applications", label: "Applications", icon: "send", route: "#/founder/applications" },
    { id: "readiness", label: "VC Readiness", icon: "trending", route: "#/founder/readiness" },
    { id: "messaging", label: "Messaging", icon: "message", route: "#/founder/messaging" },
    { id: "profile", label: "Profile", icon: "user", route: "#/founder/profile" }
  ],
  investor: [
    { id: "dashboard", label: "Dashboard", icon: "home", route: "#/investor/dashboard" },
    { id: "discover", label: "Discover", icon: "eye", route: "#/investor/discover" },
    { id: "queue", label: "Queue", icon: "layers", route: "#/investor/queue" },
    { id: "interested", label: "Interested", icon: "heart", route: "#/investor/interested" },
    { id: "saved", label: "Saved", icon: "bookmark", route: "#/investor/saved" },
    { id: "opportunities", label: "Opportunities", icon: "briefcase", route: "#/investor/opportunities" },
    { id: "applications", label: "Applications", icon: "shield", route: "#/investor/applications" },
    { id: "messaging", label: "Messaging", icon: "message", route: "#/investor/messaging" },
    { id: "profile", label: "Profile", icon: "user", route: "#/investor/profile" }
  ],
  incubator: [
    { id: "dashboard", label: "Dashboard", icon: "home", route: "#/incubator/dashboard" },
    { id: "discover", label: "Discover", icon: "eye", route: "#/incubator/discover" },
    { id: "queue", label: "Queue", icon: "layers", route: "#/incubator/queue" },
    { id: "interested", label: "Interested", icon: "heart", route: "#/incubator/interested" },
    { id: "saved", label: "Saved", icon: "bookmark", route: "#/incubator/saved" },
    { id: "opportunities", label: "Opportunities", icon: "briefcase", route: "#/incubator/opportunities" },
    { id: "applications", label: "Applications", icon: "shield", route: "#/incubator/applications" },
    { id: "messaging", label: "Messaging", icon: "message", route: "#/incubator/messaging" },
    { id: "profile", label: "Profile", icon: "user", route: "#/incubator/profile" }
  ],
  organizer: [
    { id: "dashboard", label: "Dashboard", icon: "home", route: "#/organizer/dashboard" },
    { id: "opportunities", label: "Opportunities", icon: "briefcase", route: "#/organizer/opportunities" },
    { id: "applications", label: "Applications", icon: "shield", route: "#/organizer/applications" },
    { id: "messaging", label: "Messaging", icon: "message", route: "#/organizer/messaging" },
    { id: "profile", label: "Profile", icon: "user", route: "#/organizer/profile" }
  ],
  internal: [
    { id: "dashboard", label: "Review Dashboard", icon: "home", route: "#/internal/dashboard" },
    { id: "applications", label: "Applications", icon: "layers", route: "#/internal/applications" }
  ]
};

const PAGE_TITLES = {
  "founder": { dashboard: "Dashboard", workspace: "Idea Workspace", "quality-check": "Readiness Check", "quality-gate": "Application Status", readiness: "VC Readiness", opportunities: "Opportunities", applications: "Applications", messaging: "Messaging", profile: "Profile" },
  "investor": { dashboard: "Dashboard", discover: "Discover", queue: "Review Queue", interested: "Interested", saved: "Saved", opportunities: "Opportunities", applications: "Applications", messaging: "Messaging", profile: "Profile" },
  "incubator": { dashboard: "Dashboard", discover: "Discover", queue: "Review Queue", interested: "Interested", saved: "Saved", opportunities: "Opportunities", applications: "Applications", messaging: "Messaging", profile: "Profile" },
  "organizer": { dashboard: "Dashboard", opportunities: "Opportunities", applications: "Applications", messaging: "Messaging", profile: "Profile" },
  "internal": { dashboard: "Review Dashboard", applications: "Applications" }
};

const ROLE_SUB = { founder: "Founder workspace", investor: "Investor workspace", incubator: "Incubator workspace", organizer: "Organizer workspace", internal: "Quality control" };

const ROLE_HOME = { founder: "#/founder/dashboard", investor: "#/investor/dashboard", incubator: "#/incubator/dashboard", organizer: "#/organizer/dashboard", internal: "#/internal/dashboard" };

const App = {
  pending: null,
  currentRole: null,
  currentPage: null,

  /* ---------------- navigation ---------------- */
  navigate(h) { location.hash = h; },

  enter(role, hash) {
    if (!Store.getRole()) { this.navigate("#/auth"); return; }
    Store.setRole(role);
    this.navigate(hash || ROLE_HOME[role] || "#/founder/dashboard");
  },
  switchRole(role) {
    if (!Store.getRole()) { this.navigate("#/auth"); return; }
    Store.setRole(role);
    this.closeDropdown();
    this.navigate(ROLE_HOME[role]);
    const label = role === "investor" ? "investor" : role === "incubator" ? "incubator" : role === "organizer" ? "organizer" : role === "internal" ? "internal review" : "founder";
    toast("Switched to the " + label + " experience", "info");
  },
  async signOut() {
    await Store.signOut();
    this.closeDropdown();
    this.navigate("#/");
    toast("Signed out — see you soon", "info");
  },
  async reset() {
    await Store.reset();
    this.closeDropdown();
    this.navigate("#/");
    toast("Data reset to defaults", "info");
  },

  /* ---------------- authentication ---------------- */
  authSignup(role) { this.navigate("#/auth/signup/" + role); },
  authPartnerModal() { authPartnerModal(); },
  authSelectPartner(key) {
    authPartner = key;
    ["investor", "incubator", "organizer"].forEach(k => {
      const el = document.getElementById("po-" + k);
      if (el) el.classList.toggle("selected", k === key);
    });
    const btn = document.getElementById("partner-continue");
    if (btn) btn.disabled = false;
  },
  authPartnerContinue() {
    if (!authPartner) return;
    closeModal();
    this.navigate("#/auth/signup/" + authPartner);
  },
  authForgot() { toast("Password reset link sent — check your inbox", "info", "send"); },
  authFieldSet(key, value) { authDraft[key] = value; },
  authChip(key, value) {
    const flow = AUTH_FLOWS[authRole];
    if (!flow) return;
    const f = flow.steps.reduce((acc, s) => acc.concat(s.fields), []).find(x => x.key === key);
    if (!f) return;
    if (f.type === "chips-multi") {
      const cur = authDraft[key] || [];
      authDraft[key] = cur.includes(value) ? cur.filter(v => v !== value) : cur.concat(value);
    } else {
      authDraft[key] = authDraft[key] === value ? "" : value;
    }
    renderSignup(authRole);
  },
  authNext() {
    const flow = AUTH_FLOWS[authRole];
    if (!flow) return;
    if (authStep >= flow.steps.length - 1) return; // final step submits, it never advances
    const step = flow.steps[authStep];
    const missing = [];
    step.fields.forEach(f => {
      const v = authDraft[f.key];
      if (f.req && (!v || (Array.isArray(v) && v.length === 0))) missing.push(f.label);
    });
    const emailField = step.fields.find(f => f.type === "email");
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authDraft[emailField.key] || "")) { toast("Enter a valid email address", "error", "alert"); return; }
    if (step.fields.some(f => f.key === "password") && (authDraft.password || "").length < 6) { toast("Password must be at least 6 characters", "error", "alert"); return; }
    if (step.fields.some(f => f.key === "confirm") && authDraft.confirm !== authDraft.password) { toast("Passwords do not match", "error", "alert"); return; }
    if (missing.length) { toast("Please complete: " + missing.join(", "), "error", "alert"); return; }
    authStep += 1;
    renderSignup(authRole);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  authPrev() {
    authStep = Math.max(0, authStep - 1);
    renderSignup(authRole);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  async loginSubmit() {
    const email = val("li-email");
    const pass = val("li-pass");
    if (!email || !pass) { toast("Enter your email and password", "error", "alert"); return; }
    const res = await Store.login(email, pass);
    if (!res.ok) { toast(res.err, "error", "alert"); return; }
    this.afterAuth(res.account);
  },
  async adminLogin() {
    const email = val("admin-email");
    const pass = val("admin-pass");
    if (!email || !pass) { toast("Enter your email and password", "error", "alert"); return; }
    const res = await Store.adminLogin(email, pass);
    if (!res.ok) { toast(res.err, "error", "alert"); return; }
    this.afterAuth(res.account);
  },
  afterAuth(account) {
    toast("Welcome back, " + account.name.split(" ")[0], "success", "spark");
    this.navigate(ROLE_HOME[account.role] || "#/auth");
  },
  async authSubmit() {
    const flow = AUTH_FLOWS[authRole];
    if (!flow) return;
    const d = authDraft;
    let missing = [];
    flow.steps.forEach(s => (s.fields || []).forEach(f => {
      const v = d[f.key];
      if (f.req && (!v || (Array.isArray(v) && v.length === 0))) missing.push(f.label);
    }));
    missing = [...new Set(missing)];
    if (missing.length) { toast("Missing: " + missing.join(", "), "error", "alert"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "")) { toast("Enter a valid email address", "error", "alert"); return; }
    if ((d.password || "").length < 6) { toast("Password must be at least 6 characters", "error", "alert"); return; }
    if (d.confirm !== undefined && d.confirm !== d.password) { toast("Passwords do not match", "error", "alert"); return; }

    let name = d.fullName || d.org;
    let profileFields = {};
    if (authRole === "founder") {
      profileFields = { name: d.fullName, college: d.college, grad_year: d.gradYear, location: "", bio: "", skills: [], socials: { linkedin: "", twitter: "", github: "" } };
    } else if (authRole === "investor") {
      profileFields = { name: d.fullName, org: d.org, sectors: d.sectors || [], stages: d.stages || [], location: "", bio: "" };
    } else if (authRole === "incubator") {
      profileFields = { name: d.fullName, org: d.org, sectors: d.sectors || [], stages: d.stages || [], location: "", bio: "" };
    } else {
      profileFields = { name: d.fullName || "", org: d.org, org_type: d.orgType || "", domains: d.domains || [], location: "", bio: "" };
      name = d.org;
    }

    const res = await Store.registerAccount(d.email, d.password, authRole, profileFields);
    if (!res.ok) { toast(res.err, "error", "alert"); return; }

    if (authRole === "founder") {
      await Store.addUserStartup({
        name: d.startupName,
        description: "A " + (d.stage || "student") + " startup in " + (d.industry || "tech") + ". Details live in the Idea Workspace.",
        industry: d.industry, stage: d.stage, location: "",
        founderName: d.fullName, college: d.college, bio: ""
      });
    }

    toast("Welcome to Venture Connect, " + name.split(" ")[0], "success", "spark");
    this.navigate(ROLE_HOME[authRole]);
  },


  /* ---------------- routing ---------------- */
  init() {
    window.addEventListener("hashchange", () => this.render());
    this.render();
  },

  render() {
    if (this.pending) clearTimeout(this.pending);
    const hash = location.hash || "#/";

    if (!hash.startsWith("#/")) {
      renderLanding();
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }

    const parts = hash.slice(2).split("/").filter(Boolean);
    const role = parts[0];
    if (role === "auth") { renderAuthPage(parts[1], parts[2]); return; }
    if (!["founder", "investor", "incubator", "organizer", "internal"].includes(role)) { renderLanding(); return; }
    if (!Store.getRole()) { location.hash = "#/auth"; renderAuthPage(); return; }
    /* RBAC: an account may only open its own role's routes. Admin/internal can only be accessed by admin accounts. */
    const sAcc = Store.sessionUser();
    if (sAcc && sAcc.role) {
      /* Internal/admin routes can ONLY be accessed by internal role accounts */
      if (role === "internal" && sAcc.role !== "internal") {
        location.hash = ROLE_HOME[sAcc.role] || "#/auth";
        this.render();
        return;
      }
      /* Non-internal accounts cannot access internal routes */
      if (sAcc.role !== "internal" && role === "internal") {
        location.hash = ROLE_HOME[sAcc.role] || "#/auth";
        this.render();
        return;
      }
      /* Users can only access their own role's routes */
      if (sAcc.role !== role && role !== Store.getRole()) {
        location.hash = ROLE_HOME[sAcc.role] || "#/auth";
        this.render();
        return;
      }
    }
    if (Store.getRole() !== role) Store.setRole(role);

    this.currentRole = role;
    const page = parts[1] || (role === "investor" ? "dashboard" : role === "internal" ? "dashboard" : "dashboard");
    this.currentPage = page;

    const shell = this.shell(role, page, parts);
    document.getElementById("app").innerHTML = shell;

    const main = document.getElementById("vc-main");
    main.innerHTML = '<div class="stack">' + skeletonGrid(3) + '</div>';
    this.pending = setTimeout(() => {
      main.innerHTML = this.page(role, page, parts);
      main.querySelectorAll(".fade-up").forEach((el, i) => { el.style.animationDelay = Math.min(i * 45, 400) + "ms"; });
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 320);
  },

  page(role, page, parts) {
    if (role === "founder") {
      switch (page) {
        case "dashboard": return founderDashboard();
        case "workspace": return founderWorkspace();
        case "quality-check": return founderQualityCheck();
        case "quality-gate": return founderQualityGate();
        case "readiness": return founderReadiness();
        case "stage": return founderStagePage(parts[2]);
        case "opportunities": return founderOpportunities();
        case "opportunity": return founderOpportunityDetail(parts[2]);
        case "apply": return founderApplicationReview(parts[2]);
        case "applications": return founderApplications();
        case "application": return founderApplicationDetail(parts[2]);
        case "messaging": return messagingPage("founder", parts[2]);
        case "profile": return founderProfile();
        default: return errorPage();
      }
    }
    if (role === "internal") {
      switch (page) {
        case "dashboard": return internalDashboard();
        case "applications": return internalApplications();
        case "application": return internalApplicationReview(parts[2]);
        case "document": return submittedWorkspaceDocument(parts[2], parts[3]);
        default: return errorPage();
      }
    }
    if (role === "incubator" || role === "organizer") {
      const orgRole = role === "incubator" ? "incubator" : "organizer";
      switch (page) {
        case "dashboard": return orgRole === "incubator" ? incubatorDashboard() : organizerDashboard();
        case "profile": return orgRole === "incubator" ? incubatorProfile() : organizerProfile();
        case "discover": return investorDiscover();
        case "queue": return investorQueue();
        case "interested": return investorInterested();
        case "saved": return investorSaved();
        case "startup": return investorReview(parts[2]);
        case "opportunities": return investorOpportunities();
        case "opportunity":
          if (parts[2] === "new") return opportunityFormPage(null);
          if (parts[2] === "edit") return opportunityFormPage(parts[3]);
          return errorPage();
        case "applications": return investorApplications(parts[2]);
        case "messaging": return messagingPage(orgRole, parts[2]);
        default: return errorPage();
      }
    }
    switch (page) {
      case "dashboard": return investorDashboard();
      case "discover": return investorDiscover();
      case "queue": return investorQueue();
      case "interested": return investorInterested();
      case "saved": return investorSaved();
      case "startup": return investorReview(parts[2]);
      case "opportunities": return investorOpportunities();
      case "opportunity":
        if (parts[2] === "new") return opportunityFormPage(null);
        if (parts[2] === "edit") return opportunityFormPage(parts[3]);
        return errorPage();
      case "applications": return investorApplications(parts[2]);
      case "messaging": return messagingPage("investor", parts[2]);
      case "profile": return investorProfile();
      default: return errorPage();
    }
  },

  /* ---------------- shell ---------------- */
  shell(role, page, parts) {
    const nav = NAV[role];
    const active = this.activeNavId(role, page, parts);
    const unread = Store.unreadCount();
    const me = Store.me();
    const shortName = me.name.split(" ").slice(0, 2).join(" ");

    const sidebarNav = nav.map(n => {
      const isActive = n.id === active;
      const badge = (n.id === "interested" && role === "investor" && Store.state.interested.length) ? '<span class="nav-badge">' + Store.state.interested.length + '</span>' : "";
      return '<a class="nav-item' + (isActive ? " active" : "") + '" href="' + n.route + '">' + Icon(n.icon, 17) + '<span>' + n.label + '</span>' + badge + '</a>';
    }).join("");

    const bottomIds = role === "founder"
      ? ["dashboard", "workspace", "opportunities", "applications", "messaging"]
      : role === "investor" || role === "incubator"
        ? ["dashboard", "discover", "queue", "interested", "saved"]
        : role === "organizer"
          ? ["dashboard", "opportunities", "applications", "messaging"]
          : ["dashboard", "applications"];

    const drawerIds = role === "founder"
      ? ["readiness", "profile"]
      : role === "investor" || role === "incubator"
        ? ["opportunities", "applications", "messaging", "profile"]
        : role === "organizer"
          ? ["profile"]
          : [];

    const bottomNav = bottomIds.map(id => {
      const n = nav.find(x => x.id === id);
      if (!n) return "";
      return '<button class="bn-item' + (n.id === active ? " active" : "") + '" onclick="App.navigate(\'' + n.route + '\')">' + Icon(n.icon, 19) + n.label + '</button>';
    }).join("") +
    (drawerIds.length
      ? '<button class="bn-item' + (drawerIds.includes(active) ? " active" : "") + '" onclick="App.openDrawer()">' + Icon("menu", 19) + 'More</button>'
      : '');

    const title = PAGE_TITLES[role][page] || "Venture Connect";
    const sub = parts.length > 2 ? this.pageSub(parts) : this.contextSub(role, page);

    return '' +
      '<div class="app">' +
        '<aside class="sidebar">' +
          '<a href="#/" class="vc-logo lg-side" title="Venture Connect" style="padding:4px 10px 18px">' +
            '<img class="lg-lg" src="assets/logo/logo-compact.png" alt="Venture Connect" />' +
            '<img class="lg-sm" src="assets/logo/logo-icon.png" alt="Venture Connect" />' +
          '</a>' +
          '<div class="side-nav">' +
            '<div class="nav-label">' + (role === "internal" ? "Venture Connect" : role === "investor" ? "Investor" : role === "incubator" ? "Incubator" : role === "organizer" ? "Organizer" : "Founder") + '</div>' +
            sidebarNav +
          '</div>' +
          '<div class="side-foot">' +
            '<button class="nav-item" style="width:100%" onclick="App.openDropdown(\'side-user\')">' +
              personAvatar(me.name, 32) + '<span>' + shortName + '</span>' + Icon("chevD", 13) +
            '</button>' +
          '</div>' +
        '</aside>' +

        '<div class="main">' +
          '<div class="topbar desktop-top">' +
            '<div class="topbar-title">' + title + '<small>' + sub + '</small></div>' +
            '<div class="topbar-spacer"></div>' +
            (role !== "internal" ? '<button class="icon-btn" id="bell-btn" onclick="App.openDropdown(\'bell-btn\')">' + Icon("bell", 18) + (unread ? '<span class="dot"></span>' : '') + '</button>' : '') +
            '<button class="icon-btn" id="side-user" style="border:none;background:transparent;padding:0;width:auto;height:auto" onclick="App.openDropdown(\'side-user\')">' + personAvatar(me.name, 40) + '</button>' +
          '</div>' +
          '<div class="topbar mobile-top">' +
            '<button class="icon-btn" onclick="App.openDrawer()">' + Icon("menu", 19) + '</button>' +
            '<img class="vc-logo-icon" src="assets/logo/logo-icon.png" alt="Venture Connect" />' +
            '<div class="topbar-title" style="flex:1">' + title + '</div>' +
            (role !== "internal" ? '<button class="icon-btn" id="bell-btn-m" onclick="App.openDropdown(\'bell-btn-m\')">' + Icon("bell", 18) + (unread ? '<span class="dot"></span>' : '') + '</button>' : '') +
          '</div>' +
          '<div id="vc-main"></div>' +
        '</div>' +
      '</div>' +

      '<nav class="bottom-nav">' + bottomNav + '</nav>';
  },

  activeNavId(role, page, parts) {
    if (role === "founder") {
      if (page === "stage") return "dashboard";
      if (page === "opportunity") return "opportunities";
      if (page === "application") return "applications";
      return page;
    }
    if (role === "internal") return page;
    if (page === "startup") return "discover";
    if (page === "opportunity") return "opportunities";
    if (page === "applications") return "applications";
    return page;
  },

  pageSub(parts) {
    if (parts[0] === "founder") {
      if (parts[1] === "stage") {
        const g = INTERNAL_STAGES.find(x => x.key === parts[2]);
        return g ? g.name : "Application status";
      }
      if (parts[1] === "application") {
        const a = Store.getApplication(parts[2]);
        const o = a ? Store.getOpportunity(a.opportunityId) : null;
        return o ? o.title : "Application";
      }
      if (parts[1] === "opportunity") {
        const o = Store.getOpportunity(parts[2]);
        return o ? o.title : "Opportunity";
      }
    }
    if (["investor", "incubator", "organizer"].includes(parts[0])) {
      if (parts[1] === "startup") {
        const s = Store.getStartup(parts[2]);
        return s ? s.name : "Startup";
      }
      if (parts[1] === "applications" && parts[2]) {
        const o = Store.getOpportunity(parts[2]);
        return o ? o.title : "Applications";
      }
      if (parts[1] === "opportunity" && parts[2] === "new") return "New opportunity";
      if (parts[1] === "opportunity" && parts[2] === "edit") {
        const o = Store.getOpportunity(parts[3]);
        return o ? "Edit · " + o.title : "Edit opportunity";
      }
    }
    return "";
  },

  contextSub(role, page) {
    const copy = {
      founder: { dashboard: "Your startup workspace", workspace: "Build and refine your startup", opportunities: "Browse opportunities accepting applications", applications: "Track the opportunities you are pursuing", readiness: "Strengthen your application before you apply", messaging: "Conversations with your ecosystem", profile: "Keep your founder details current" },
      investor: { dashboard: "Review your startup pipeline", discover: "Screened startups ready for review", queue: "Startups waiting for your review", interested: "Startups you want to follow up with", saved: "Your shortlist for later review", opportunities: "Manage the opportunities you run", applications: "Qualified applications from founders", messaging: "Conversations with founders" },
      incubator: { dashboard: "Run programs and review founders", discover: "Qualified startups for your programs", opportunities: "Manage your incubator programs", applications: "Applications to your programs", messaging: "Conversations with founders" },
      organizer: { dashboard: "Publish and manage events", opportunities: "Manage opportunities and registration links", applications: "Venture Connect applications only", messaging: "Conversations with participants" },
      internal: { dashboard: "Operational quality control", applications: "Review the Venture Connect pipeline" }
    };
    return (copy[role] && copy[role][page]) || ROLE_SUB[role];
  },

  /* ---------------- dropdowns & drawer ---------------- */
  openDropdown(id) {
    const isBell = id.indexOf("bell") === 0;
    openDropdown(id, isBell ? notificationsHtml() : userMenuHtml());
  },
  closeDropdown() { closeDropdown(); },
  openDrawer() {
    const r = Store.getRole();
    const nav = NAV[r];
    const items = nav.map(n =>
      '<a class="nav-item" style="justify-content:flex-start" href="' + n.route + '" onclick="App.closeDrawer()">' + Icon(n.icon, 17) + '<span>' + n.label + '</span></a>'
    ).join("");
    const root = document.getElementById("drawer-root");
    root.innerHTML = '<div class="drawer-backdrop" onclick="App.closeDrawer()"><div class="drawer" onclick="event.stopPropagation()">' +
      '<div class="row-between" style="margin-bottom:16px"><span class="vc-logo lg-drawer"><img src="assets/logo/logo-compact.png" alt="Venture Connect" /></span><button class="icon-btn" onclick="App.closeDrawer()">' + Icon("x", 16) + '</button></div>' +
      '<div class="col" style="gap:3px">' + items + '</div>' +
      '<div class="divider"></div>' +
      '<button class="nav-item" style="justify-content:flex-start;width:100%" onclick="App.closeDrawer();App.openDropdown(\'drawer-user\')">' + personAvatar(Store.me().name, 32) + '<span>Account &amp; settings</span></button>' +
    '</div></div>';
  },
  closeDrawer() { document.getElementById("drawer-root").innerHTML = ""; },

  async markNotifs() { await Store.markNotifsRead(); this.closeDropdown(); this.render(); },

  /* ---------------- shared investor actions ---------------- */
  invSearch(v) { invFilter.q = v; this.render(); },
  invSort(v) { invFilter.sort = v; this.render(); },
  invFilterSector(s) { invFilter.sector = s; this.render(); },
  oppFilter(c) { oppFilter = c; this.render(); },
  founderOppSearch(v) { founderOppQuery = v; this.render(); },
  founderOppType(v) { founderOppType = v; this.render(); },
  founderOppSector(v) { founderOppSector = v; this.render(); },
  founderOppLocation(v) { founderOppLocation = v; this.render(); },
  founderOppSort(v) { founderOppSort = v; this.render(); },
  oppMgmtFilter(v) { oppMgmtFilter = v; this.render(); },
  invAppFilter(v) { invAppFilter = v; this.render(); },
  opportunityTypeChange() {
    const type = val("of-type");
    const wrap = document.getElementById("of-external-wrap");
    if (wrap) wrap.style.display = type === "Hackathon" ? "block" : "none";
    const publish = document.getElementById("of-publish");
    if (publish) publish.innerHTML = Icon("checkCircle", 15) + (type === "Hackathon" ? "Publish Hackathon" : "Publish Opportunity");
  },
  previewOpportunity() {
    const title = val("of-title") || "Untitled opportunity";
    const type = val("of-type");
    const external = type === "Hackathon";
    openModal(
      '<div class="modal-head"><h3 class="h3">Preview</h3><button class="modal-close" onclick="closeModal()">' + Icon("x", 15) + '</button></div>' +
      '<div class="badge ' + (external ? "badge-info" : "badge-violet") + '" style="margin-bottom:10px">' + (external ? 'External application' : (type || 'Opportunity')) + '</div>' +
      '<h2 class="h2">' + escapeHtml(title) + '</h2>' +
      '<p class="small muted" style="margin-top:8px;line-height:1.6">' + escapeHtml(val("of-desc") || "No description added yet.") + '</p>' +
      (external ? '<p class="small" style="margin-top:14px;color:var(--info)">' + Icon("external", 13) + ' Application handled on organizer\'s website.</p>' : '')
    );
  },

  async toggleSaved(id, el) {
    const now = await Store.toggleSaved(id);
    toast(now ? "Saved to your shortlist" : "Removed from saved", now ? "success" : "info");
    this.render();
  },
  async toggleInterested(id, el) {
    const now = await Store.toggleInterested(id);
    toast(now ? "Marked as Interested — messaging unlocked" : "Removed from Interested", now ? "success" : "info");
    this.render();
  },
  removeQueue(id, el) {
    Store.removeFromQueue(id);
    toast("Removed from queue", "info");
    this.render();
  },
  async rejectAppInvestor(appId) {
    await Store.rejectAppInvestor(appId);
    toast("Application rejected", "info", "x");
    this.render();
  },
  viewReportModal(id) {
    const s = Store.getStartup(id);
    if (!s) return;
    const dims = [["problem", "Problem"], ["solution", "Solution"], ["market", "Market"], ["validation", "Validation"], ["businessModel", "Business model"], ["team", "Team"]];
    openModal(
      '<div class="modal-head"><h3 class="h3">VC Readiness Report — ' + s.name + '</h3><button class="modal-close" onclick="closeModal()">' + Icon("x", 15) + '</button></div>' +
      '<div class="row" style="gap:20px;align-items:center;margin-bottom:16px">' +
        Ring(s.score, 100, "readiness") +
        '<p class="muted small" style="flex:1">Assessed by Venture Connect across six dimensions. This score is shared with all investors on the platform, so it is consistent across your pipeline.</p>' +
      '</div>' +
      '<div class="col" style="gap:9px;margin-bottom:18px">' + dims.map(d =>
        '<div><div class="row-between"><span class="small semibold">' + d[1] + '</span><span class="small mono bold" style="color:var(--accent-deep)">' + s.scoreBreak[d[0]] + '</span></div>' + bar(s.scoreBreak[d[0]], "thin") + '</div>'
      ).join("") + '</div>' +
      '<div class="row" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button></div>'
    );
  },

  /* ---------------- opportunity actions (investor) ---------------- */
  async saveOpportunity(id, status) {
    const typeLabel = val("of-type");
    const isHackathon = typeLabel === "Hackathon";
    const data = {
      title: val("of-title"), org: val("of-org"),
      category: (OPP_TYPES.find(t => t[0] === typeLabel) || [null, "Other"])[1],
      typeLabel, type: isHackathon ? "hackathon" : "opportunity",
      applicationMode: isHackathon ? "external" : "internal",
      applicationUrl: val("of-application-url"),
      sector: val("of-sector"), stage: val("of-stage"),
      eligibility: val("of-elig"), desc: val("of-desc"),
      deadline: val("of-deadline"), startDate: val("of-startdate"),
      location: val("of-location"), funding: val("of-funding"),
      equity: val("of-equity"), duration: val("of-duration"), eventDate: val("of-event-date"),
      teamRequirements: val("of-team"), perks: val("of-perks").split(",").map(x => x.trim()).filter(Boolean)
    };
    if (!data.title.trim()) { toast("Opportunity title is required", "error", "alert"); return; }
    if (!data.org.trim()) { toast("Organization is required", "error", "alert"); return; }
    if (isHackathon && (status === "publish" || data.applicationUrl.trim())) {
      let validUrl = false;
      try { const parsed = new URL(data.applicationUrl.trim()); validUrl = parsed.protocol === "http:" || parsed.protocol === "https:"; } catch (e) { validUrl = false; }
      if (!validUrl) { toast("Please add a valid official application URL.", "error", "alert"); return; }
      data.applicationUrl = data.applicationUrl.trim();
    }
    const finalStatus = status === "publish" ? "published" : "draft";
    if (id) {
      await Store.updateOpportunity(id, Object.assign(data, { status: finalStatus === "published" && Store.getOpportunity(id).status === "published" ? "published" : finalStatus }));
      toast(finalStatus === "published" ? "Opportunity published — founders can now see it" : "Draft saved", "success");
    } else {
      await Store.createOpportunity(data, finalStatus);
      toast(finalStatus === "published" ? "Opportunity published — founders can now see it" : "Draft saved — publish it when ready", "success");
    }
    this.navigate("#/" + Store.getRole() + "/opportunities");
  },
  async closeOpp(id) { await Store.closeOpportunity(id); toast("Opportunity closed — no new applications", "info"); this.render(); },
  async reopenOpp(id) { await Store.reopenOpportunity(id); toast("Opportunity reopened", "success"); this.render(); },

  /* ---------------- apply flow (founder) ---------------- */
  applyNow(oppId) {
    const o = Store.getOpportunity(oppId);
    if (!o) return;
    if (o.applicationMode === "external" || o.type === "hackathon") {
      this.confirmExternalApplication(oppId);
      return;
    }
    const exists = Store.applicationsForStartup(Store.founder().startupId).some(a => a.opportunityId === oppId);
    if (exists) { toast("You have already applied to this opportunity", "info", "info"); return; }
    this.navigate("#/founder/apply/" + oppId);
  },
  async submitApplication(oppId) {
    const o = Store.getOpportunity(oppId);
    if (!o || o.applicationMode === "external" || o.type === "hackathon") return;
    const exists = Store.applicationsForStartup(Store.founder().startupId).some(a => a.opportunityId === oppId);
    if (exists) { toast("You have already applied to this opportunity", "info", "info"); return; }
    const app = await Store.createApplication(Store.founder().startupId, oppId);
    toast("Application submitted to Venture Connect", "success", "send");
    this.navigate("#/founder/application/" + app.id);
  },
  async updateApplicationSnapshot(appId) {
    const app = Store.getApplication(appId);
    if (!app) return;
    const result = await Store.updateApplicationSnapshot(appId, Store.workspace());
    if (!result) { toast("This application is locked for review", "error", "lock"); return; }
    toast("Application updated — Venture Connect will review the latest version", "success", "checkCircle");
    this.render();
  },
  async respondClarification(appId) {
    const response = val("clarification-response");
    if (!response.trim()) { toast("Add a response before submitting", "error", "alert"); return; }
    await Store.respondClarification(appId, response.trim());
    toast("Clarification submitted", "success", "send");
    this.render();
  },
  confirmExternalApplication(oppId) {
    const o = Store.getOpportunity(oppId);
    if (!o || !/^https?:\/\//i.test(o.applicationUrl || "")) { toast("This hackathon does not have a usable application URL yet.", "error", "alert"); return; }
    openModal(
      '<div class="modal-head"><h3 class="h3">You\'re leaving Venture Connect</h3><button class="modal-close" onclick="closeModal()">' + Icon("x", 15) + '</button></div>' +
      '<p class="muted small" style="line-height:1.6">You\'ll be redirected to the official application page for <b>' + escapeHtml(o.title) + '</b>. Application and registration are handled by the organizer.</p>' +
      '<div class="row" style="justify-content:flex-end;margin-top:20px"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="App.openExternalApplication(\'' + o.id + '\')">' + Icon("external", 15) + 'Continue to Application</button></div>'
    );
  },
  async openExternalApplication(oppId) {
    const o = Store.getOpportunity(oppId);
    if (!o || !/^https?:\/\//i.test(o.applicationUrl || "")) { closeModal(); toast("This hackathon does not have a usable application URL yet.", "error", "alert"); return; }
    await Store.recordExternalApplicationClick(oppId);
    closeModal();
    window.open(o.applicationUrl, "_blank", "noopener,noreferrer");
    toast("Application link opened — the organizer handles registration", "info", "external");
  },

  /* ---------------- founder workspace actions ---------------- */
  async wsSelect(key) {
    const input = document.getElementById("ws-input");
    if (input) await Store.updateWorkspace(wsActiveSection, input.value);
    wsActiveSection = key;
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  wsInput() {
    const input = document.getElementById("ws-input");
    if (!input) return;
    const pill = document.getElementById("ws-autosave");
    if (pill) { pill.className = "autosave saving"; pill.innerHTML = '<span class="as-dot"></span>Saving…'; }
    clearTimeout(wsSaveTimer);
    wsSaveTimer = setTimeout(async () => {
      await Store.updateWorkspace(wsActiveSection, input.value);
      wsSaveIndicator("saved");
    }, 700);
  },
  async wsSave() {
    const input = document.getElementById("ws-input");
    if (input) await Store.updateWorkspace(wsActiveSection, input.value);
    wsSaveIndicator("saved");
    toast("Progress saved", "success", "checkCircle");
  },

  rerunChecks(btn) {
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = Icon("refresh", 15) + 'Checking…';
    setTimeout(() => {
      this.render();
      toast("Checks re-run — results updated", "success", "scan");
    }, 900);
  },

  /* ---------------- internal review actions ----------------
     Every write below is only accepted by Postgres if the logged-in
     session's profile role is 'internal' (see supabase/schema.sql).
     A founder session sending these same calls gets rejected by the
     database itself, not just hidden by the UI. */
  intFilter(v) { intFilter = v; this.render(); },
  async intRunChecks(appId) {
    const app = Store.getApplication(appId);
    const s = Store.getStartup(app.startupId);
    const res = Store.runQualityChecks(workspaceLike(s, app));
    await Store.updateApplication(appId, { autoCheck: { status: res.status, ranAt: new Date().toLocaleString() } });
    toast("Automated checks recorded: " + res.status, "success", "scan");
    this.render();
  },
  async intChecksApprove(appId) {
    const app = Store.getApplication(appId);
    if (app.stage > 1) return;
    await Store.updateApplication(appId, { needsRevision: false });
    await Store.advanceApp(appId);
    toast("Checks approved — moving to Venture Connect Review", "success");
    this.render();
  },
  async intVcDecision(appId, decision) {
    const notes = val("vc-notes") || "";
    const patch = { vcReview: { decision, notes, reviewedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } };
    if (decision === "approved") {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: false }));
      await Store.advanceApp(appId);
      toast("Approved for next stage — Pitch Review", "success", "checkCircle");
    } else if (decision === "revision") {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: true }));
      toast("Revision requested — founder notified", "info", "refresh");
    } else if (decision === "reject") {
      await Store.updateApplication(appId, Object.assign(patch, { rejected: true, needsRevision: false }));
      toast("Application rejected", "info", "x");
    } else {
      await Store.updateApplication(appId, patch);
      toast("Escalated to manual review", "info", "users");
    }
    this.render();
  },
  async intRequestClarification(appId) {
    const question = val("vc-notes") || "Please clarify the submitted information.";
    await Store.requestClarification(appId, question);
    toast("Clarification requested — founder notified", "info", "message");
    this.render();
  },
  async intPitchSave(appId, decision) {
    const scores = {
      quality: num("pitch-quality"), problem: num("pitch-problem"), solution: num("pitch-solution"),
      market: num("pitch-market"), communication: num("pitch-communication"),
      businessModel: num("pitch-businessModel"), evidence: num("pitch-evidence")
    };
    const notes = val("pitch-notes") || "";
    const patch = { pitch: { scores, decision, notes } };
    if (decision === "pass") {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: false }));
      await Store.advanceApp(appId);
      toast("Pitch passed — scheduling the founder interview", "success", "checkCircle");
    } else {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: true }));
      toast("Revision requested for the pitch", "info", "refresh");
    }
    this.render();
  },
  async intInterviewSave(appId) {
    const app = Store.getApplication(appId);
    const scheduled = val("intv-time") || app.interview.scheduled;
    const notes = val("intv-notes") || app.interview.notes;
    const decision = val("intv-decision") || app.interview.decision;
    const patch = { interview: { scheduled, notes, decision, completed: decision === "pass" } };
    if (decision === "pass") {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: false }));
      await Store.advanceApp(appId);
      toast("Interview recorded — moving to evidence verification", "success");
    } else if (decision === "revision") {
      await Store.updateApplication(appId, Object.assign(patch, { needsRevision: true }));
      toast("Revision requested after interview", "info", "refresh");
    } else if (decision === "reject") {
      await Store.updateApplication(appId, Object.assign(patch, { rejected: true }));
      toast("Application rejected after interview", "info", "x");
    } else {
      await Store.updateApplication(appId, patch);
      toast("Interview record saved", "success");
    }
    this.render();
  },
  async intEvidenceSave(appId) {
    const app = Store.getApplication(appId);
    const s = Store.getStartup(app.startupId);
    const evidenceStatus = {};
    const evidenceNotes = {};
    (s.evidence || []).forEach((e, i) => {
      evidenceStatus[e.type] = val("ev-" + i + "-status") || e.status;
      evidenceNotes[e.type] = val("ev-" + i + "-notes") || "";
    });
    await Store.updateApplication(appId, { evidenceStatus, evidenceNotes });
    toast("Verification statuses saved", "success", "verify");
    this.render();
  },
  async intEvidenceApprove(appId) {
    const app = Store.getApplication(appId);
    if (app.stage > 5) return;
    await Store.advanceApp(appId);
    toast("Verification approved — ready for the Quality Gate decision", "success");
    this.render();
  },
  async intGateDecision(appId, passed) {
    const notes = val("gate-notes") || "";
    await Store.setGate(appId, passed, notes);
    toast(passed ? "QUALITY GATE PASSED" : "QUALITY GATE NOT PASSED", passed ? "success" : "info", passed ? "shield" : "x");
    this.render();
  },
  async intUnlock(appId) {
    await Store.unlockApp(appId);
    const app = Store.getApplication(appId);
    const o = Store.getOpportunity(app.opportunityId);
    toast("Unlocked — " + (o ? o.org : "the investor") + " can now review this application", "success", "eye");
    this.render();
  },

  /* ---------------- profiles ---------------- */
  saveFounderProfile() {
    const f = Store.founder();
    f.name = val("pf-name") || f.name;
    f.college = val("pf-college") || f.college;
    f.location = val("pf-location") || f.location;
    f.bio = val("pf-bio") || f.bio;
    f.socials.linkedin = val("pf-li"); f.socials.twitter = val("pf-tw"); f.socials.github = val("pf-gh");
    f.skills = val("pf-skills").split(",").map(x => x.trim()).filter(Boolean);
    Store.save();
    toast("Profile saved", "success", "checkCircle");
    this.render();
  },
  saveInvestorProfile() {
    const p = Store.investor();
    p.name = val("ip-name") || p.name;
    p.org = val("ip-org") || p.org;
    p.focus = val("ip-focus") || p.focus;
    p.sectors = csv("ip-sectors");
    p.stage = val("ip-stage") || p.stage;
    p.geography = val("ip-geo") || p.geography;
    p.ticket = val("ip-ticket") || p.ticket;
    p.portfolio = csv("ip-portfolio");
    Store.save();
    toast("Profile saved", "success", "checkCircle");
    this.render();
  },
  saveIncubatorProfile() {
    const p = Store.incubator();
    p.org = val("in-org") || p.org;
    p.orgType = val("in-orgtype") || p.orgType;
    p.website = val("in-website");
    p.location = val("in-location") || p.location;
    p.sectors = csv("in-sectors");
    p.stages = csv("in-stages");
    p.support = csv("in-support");
    p.duration = val("in-duration");
    p.funding = val("in-funding");
    p.equity = val("in-equity");
    p.description = val("in-desc");
    Store.save();
    toast("Profile saved", "success", "checkCircle");
    this.render();
  },
  saveOrganizerProfile() {
    const p = Store.organizer();
    p.org = val("or-org") || p.org;
    p.orgType = val("or-orgtype") || p.orgType;
    p.website = val("or-website");
    p.location = val("or-location") || p.location;
    p.about = val("or-about") || p.about;
    p.domains = csv("or-domains");
    Store.save();
    toast("Profile saved", "success", "checkCircle");
    this.render();
  },

  /* ---------------- messaging ---------------- */
  openMessage(id) {
    if (!Store.isInterested(id)) {
      toast("Mark the startup as Interested to message the founder", "info", "lock");
      return;
    }
    const role = Store.getRole();
    this.navigate("#/" + role + "/messaging/" + id);
  },
  openConv(convId) {
    if (!convId || !Store.getConversation(convId)) return;
    activeConv = convId;
    const role = Store.getRole();
    this.navigate("#/" + role + "/messaging/" + convId);
  },
  async sendMsg() {
    const input = document.getElementById("msg-input");
    if (!input || !input.value.trim() || !activeConv) return;
    const text = input.value.trim();
    await Store.sendMessage(activeConv, text);
    input.value = "";
    this.renderMsgThread();
    setTimeout(() => {
      const body = document.getElementById("msg-body");
      if (body) body.insertAdjacentHTML("beforeend", '<div class="typing"><i></i><i></i><i></i></div>');
    }, 500);
    setTimeout(() => {
      const reply = "Thanks for the message — I'll get back to you shortly.";
      const c = Store.getConversation(activeConv);
      if (!c) return;
      c.items.push({ from: "partner", text: reply, time: "Just now" });
      Store.save();
      this.renderMsgThread();
    }, 2100);
  },
  renderMsgThread() {
    const role = Store.getRole();
    const conv = Store.getConversation(activeConv);
    const body = document.getElementById("msg-body");
    if (!conv || !body) { this.render(); return; }
    const startup = conv.startupId ? Store.getStartup(conv.startupId) : null;
    body.innerHTML = '<div class="msg-day">TODAY</div>' + conv.items.map(m =>
      '<div class="bubble ' + (m.from === "me" ? "mine" : "theirs") + '">' + m.text + '<span class="b-time">' + m.time + '</span></div>'
    ).join("");
    body.scrollTop = body.scrollHeight;
    const headMeta = document.querySelector(".msg-head .mh-meta");
    if (headMeta && startup) {
      headMeta.innerHTML = gateBadge(startup.qualityGate) + '<span class="score-chip" style="font-size:11px;padding:2px 8px">' + startup.score + '/100</span>';
    }
  },

  exportReport() {
    toast("Report exported — a PDF would be generated here", "info", "download");
  }
};

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function num(id) { const v = val(id); return v === "" ? null : Math.max(0, Math.min(100, parseInt(v, 10) || 0)); }
function csv(id) { return val(id).split(",").map(x => x.trim()).filter(Boolean); }

/* ---------------- founder stage pages dispatch ---------------- */
function founderStagePage(key) {
  switch (key) {
    case "pitch-review": return founderPitchReview();
    case "interview": return founderInterview();
    case "validation": return founderValidation();
    default: return founderQualityGate();
  }
}

// Boot is driven by index.html: Store.init().then(() => App.init())
