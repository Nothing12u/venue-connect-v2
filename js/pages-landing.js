/* ============================================================
   VENTURE CONNECT  Landing page
   Production-ready landing page for the Venture Connect platform
   ============================================================ */

function renderLanding() {
  const html =
    /* --- Nav --- */
    '<nav class="land-nav">' +
      '<a href="#/" class="vc-logo lg-nav" title="Venture Connect">' +
        '<img src="assets/logo/logo-primary.png" alt="Venture Connect" />' +
      '</a>' +
      '<div class="nav-links">' +
        '<a href="#about">About</a>' +
        '<a href="#how-it-works">How It Works</a>' +
        '<a href="#for-founders">For Founders</a>' +
        '<a href="#for-investors">For Investors</a>' +
        '<a href="#quality">Quality Process</a>' +
      '</div>' +
      '<a href="#/auth/login" class="btn btn-ghost btn-sm">Sign In</a>' +
      '<a href="#/auth" class="btn btn-primary btn-sm">' + Icon("spark", 14) + 'Get Started</a>' +
    '</nav>' +

    '<div class="land-main">' +

      /* --- 1. Hero --- */
      '<section class="hero" id="about" style="padding-top:120px;padding-bottom:70px">' +
        '<div>' +
          '<span class="hero-eyebrow">BUILD. CONNECT. GROW.</span>' +
          '<h1>Turn Student Ideas Into <span class="grad">Real Ventures</span></h1>' +
          '<p class="sub">Venture Connect helps student founders build their ideas, discover opportunities, and connect with investors and incubators through a trusted evaluation process.</p>' +
          '<div class="hero-ctas">' +
            '<button class="btn btn-primary btn-lg" onclick="App.navigate(\'#/auth/signup/founder\')">' + Icon("spark", 18) + 'Get Started as Founder</button>' +
            '<button class="btn btn-ghost btn-lg" onclick="App.authPartnerModal()">' + Icon("eye", 18) + 'Get Started as Investor / Ecosystem</button>' +
          '</div>' +
        '</div>' +

        /* Central product visualization  one clean focal point */
        '<div class="eco-visual" style="height:540px;display:grid;place-items:center">' +
          '<div class="pipeline-central">' +
            '<div class="pc-title">The Journey</div>' +
            '<div class="pc-node"><span class="node-ic" style="background:#6366f1">' + Icon("user", 17) + '</span><span>Founder Idea<span class="node-sub">Built in the Idea Workspace</span></span></div>' +
            '<div class="pc-arrow">' + Icon("chevD", 15) + '</div>' +
            '<div class="pc-node"><span class="node-ic" style="background:#6366f1">' + Icon("briefcase", 17) + '</span><span>Opportunity<span class="node-sub">Incubator or investor program</span></span></div>' +
            '<div class="pc-arrow">' + Icon("chevD", 15) + '</div>' +
            '<div class="pc-node"><span class="node-ic" style="background:#6366f1">' + Icon("send", 17) + '</span><span>Application<span class="node-sub">Linked to founder, startup &amp; opportunity</span></span></div>' +
            '<div class="pc-arrow">' + Icon("chevD", 15) + '</div>' +
            '<div class="pc-node gate"><span class="node-ic" style="background:rgba(255,255,255,.2)">' + Icon("shield", 17) + '</span><span>Venture Connect Review<span class="node-sub">Trusted evaluation process</span></span></div>' +
            '<div class="pc-arrow">' + Icon("chevD", 15) + '</div>' +
            '<div class="pc-node" style="margin-bottom:0"><span class="node-ic" style="background:#0ea472">' + Icon("eye", 17) + '</span><span>Investor / Incubator<span class="node-sub">Quality-gated applications only</span></span></div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* --- 2. How Venture Connect Works --- */
      '<section class="land-section" id="how-it-works" style="padding-top:40px">' +
        '<div class="section-head"><div class="section-tag">01  How it works</div><h2>How Venture Connect Works</h2><p>Three simple steps, one trusted middle layer.</p></div>' +
        '<div class="grid-3">' +
          '<div class="glass card glass-hover"><div class="row" style="margin-bottom:12px"><span class="card-title-ic">' + Icon("spark", 19) + '</span><h3 class="h3">1  Build &amp; Apply</h3></div>' +
            '<p class="muted small" style="line-height:1.65">Founders complete a structured Idea Workspace, then apply to incubator and investor opportunities that fit their stage and sector.</p></div>' +
          '<div class="glass card glass-hover"><div class="row" style="margin-bottom:12px"><span class="card-title-ic violet">' + Icon("shield", 19) + '</span><h3 class="h3">2  Venture Connect Verifies</h3></div>' +
            '<p class="muted small" style="line-height:1.65">Every application passes automated quality checks, human review, pitch review, an interview, and evidence verification before it goes anywhere.</p></div>' +
          '<div class="glass card glass-hover"><div class="row" style="margin-bottom:12px"><span class="card-title-ic green">' + Icon("eye", 19) + '</span><h3 class="h3">3  Investors Connect</h3></div>' +
            '<p class="muted small" style="line-height:1.65">Only quality-gated applications reach the relevant investor or incubator  who then review, shortlist, and message the founder directly.</p></div>' +
        '</div>' +
      '</section>' +

      /* --- 3. For Founders --- */
      '<section class="land-section" id="for-founders" style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:36px;align-items:center;padding-top:20px">' +
        '<div>' +
          '<div class="section-tag">02  For founders</div>' +
          '<h2 class="h2" style="font-size:28px;margin-bottom:14px">For student founders</h2>' +
          '<p class="muted" style="margin-bottom:20px;max-width:480px">Stop pitching into the void. Build once, apply to the right opportunities, and let Venture Connect verify the quality for you.</p>' +
          '<div class="col" style="gap:10px">' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("check", 14) + '</span><div><div class="c-title">A guided Idea Workspace</div><div class="c-msg">Problem, market, model, validation  structured so your application is actually complete.</div></div></div>' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("check", 14) + '</span><div><div class="c-title">Opportunities matched to your stage</div><div class="c-msg">Incubators, accelerators, grants, and investors  all in one marketplace.</div></div></div>' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("check", 14) + '</span><div><div class="c-title">Clear application status</div><div class="c-msg">You always know where your application stands  without operating the machinery.</div></div></div>' +
          '</div>' +
          '<button class="btn btn-primary" style="margin-top:22px" onclick="App.navigate(\'#/auth/signup/founder\')">' + Icon("spark", 16) + 'Start Building</button>' +
        '</div>' +
        '<div class="glass card" style="padding:24px;background:var(--glass-strong)">' +
          '<div class="small faint semibold" style="letter-spacing:.1em;margin-bottom:12px">A FOUNDER SEES</div>' +
          '<div class="col" style="gap:10px">' +
            '<div class="app-status-row"><div class="asr-main"><div class="semibold" style="font-size:13.5px">AgriTech Student Accelerator 2026</div><div class="tiny faint">Example Incubator  Applied Aug 24</div></div><span class="badge badge-indigo">Pitch Review</span></div>' +
            '<div class="app-status-row"><div class="asr-main"><div class="semibold" style="font-size:13.5px">Campus Climate Fund 2026</div><div class="tiny faint">Meridian Capital  Applied Aug 10</div></div><span class="badge badge-success">Approved</span></div>' +
          '</div>' +
          '<p class="tiny faint" style="margin-top:14px">' + Icon("info", 11) + ' Simple statuses. The internal quality process runs quietly behind them.</p>' +
        '</div>' +
      '</section>' +

      /* --- 4. For Investors & Incubators --- */
      '<section class="land-section" id="for-investors" style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:36px;align-items:center;padding-top:20px">' +
        '<div class="glass card" style="padding:24px;background:var(--glass-strong);order:2">' +
          '<div class="small faint semibold" style="letter-spacing:.1em;margin-bottom:12px">AN INVESTOR RECEIVES</div>' +
          '<div class="col" style="gap:10px">' +
            '<div class="list-row"><span class="badge badge-success" style="padding:2px 8px">' + Icon("shield", 11) + '</span><div class="lr-main"><div class="semibold" style="font-size:13.5px">FieldPilot</div><div class="tiny faint">Applied to Campus Climate Fund 2026  Gate passed</div></div><span class="badge badge-success">Qualified</span></div>' +
            '<div class="list-row"><span class="badge badge-success" style="padding:2px 8px">' + Icon("shield", 11) + '</span><div class="lr-main"><div class="semibold" style="font-size:13.5px">PayPulse</div><div class="tiny faint">Applied to Campus Climate Fund 2026  Gate passed</div></div><span class="badge badge-success">Qualified</span></div>' +
          '</div>' +
          '<p class="tiny faint" style="margin-top:14px">' + Icon("shield", 11) + ' Every application arrives quality-gated. No raw idea dumps.</p>' +
        '</div>' +
        '<div style="order:1">' +
          '<div class="section-tag">03  For investors &amp; incubators</div>' +
          '<h2 class="h2" style="font-size:28px;margin-bottom:14px">For investors &amp; incubators</h2>' +
          '<p class="muted" style="margin-bottom:20px;max-width:480px">Post opportunities, receive applications that have already passed Venture Connect\'s quality process, and discover vetted startups across sectors.</p>' +
          '<div class="col" style="gap:10px">' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("briefcase", 14) + '</span><div><div class="c-title">Post opportunities in minutes</div><div class="c-msg">Publish programs, funds, and challenges  reach student founders directly.</div></div></div>' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("shield", 14) + '</span><div><div class="c-title">Quality-gated applications only</div><div class="c-msg">Automated checks, review, pitch, interview, and verification happen before you ever see an application.</div></div></div>' +
            '<div class="check-item pass"><span class="c-ic">' + Icon("message", 14) + '</span><div><div class="c-title">Shortlist &amp; connect</div><div class="c-msg">Mark interested, save, or reject  then message founders directly.</div></div></div>' +
          '</div>' +
          '<button class="btn btn-soft" style="margin-top:22px" onclick="App.authPartnerModal()">' + Icon("eye", 16) + 'Explore as Investor</button>' +
        '</div>' +
      '</section>' +

      /* --- 5. Quality / Trust Layer --- */
      '<section class="land-section land-section-alt" id="quality" style="padding:52px 48px">' +
        '<div class="row" style="justify-content:center;gap:12px;margin-bottom:10px"><span class="card-title-ic violet" style="width:44px;height:44px;border-radius:14px">' + Icon("shield", 22) + '</span></div>' +
        '<div class="section-head" style="margin-bottom:26px"><div class="section-tag">04  Quality / trust</div><h2>The Quality Gate is the trust layer</h2>' +
        '<p>Venture Connect screens, reviews, verifies, and gates every application internally. Investors are never browsing raw student ideas  they are reviewing pre-qualified deal flow.</p></div>' +
        '<div class="trust-line">' +
          '<div class="tl-item">' + Icon("scan", 16) + 'Automated quality checks</div>' +
          '<div class="tl-item">' + Icon("shield", 16) + 'Human application review</div>' +
          '<div class="tl-item">' + Icon("users", 16) + 'Pitch &amp; founder interview</div>' +
          '<div class="tl-item">' + Icon("verify", 16) + 'Evidence verification</div>' +
        '</div>' +
        '<p class="muted small" style="text-align:center;max-width:520px;margin:24px auto 0">Only applications that pass the Quality Gate become eligible for the relevant investor or incubator to review.</p>' +
      '</section>' +

      /* --- 6. Final CTA --- */
      '<section style="text-align:center;padding:60px 0 20px">' +
        '<div class="section-tag" style="justify-content:center">05  Get started</div>' +
        '<h2 class="h2" style="font-size:30px;margin-bottom:12px">Build. Apply. Get connected.</h2>' +
        '<p class="muted" style="max-width:420px;margin:0 auto 26px">Join a pipeline where quality is the entry ticket  for founders and investors alike.</p>' +
        '<div class="row" style="justify-content:center">' +
          '<button class="btn btn-primary btn-lg" onclick="App.navigate(\'#/auth/signup/founder\')">' + Icon("spark", 17) + 'Start Building</button>' +
          '<button class="btn btn-ghost btn-lg" onclick="App.authPartnerModal()">' + Icon("briefcase", 17) + 'Post an Opportunity</button>' +
        '</div>' +
      '</section>' +

      '<footer class="footer">' +
        '<a href="#/" class="vc-logo lg-foot" title="Venture Connect"><img src="assets/logo/logo-primary.png" alt="Venture Connect" /></a>' +
        '<p>Venture Connect is a startup ecosystem platform for student founders, investors, and ecosystem partners.</p>' +
        '<div class="row">' +
          '<a href="#/auth" class="btn btn-primary btn-sm">Get Started</a>' +
        '</div>' +
      '</footer>' +
    '</div>';

  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}
