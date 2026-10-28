/* ============================================================
   VENTURE CONNECT — boot
   Lives in its own file (not an inline <script>) so the Content-Security-Policy
   can stay at script-src 'self'.
   ============================================================ */
(function () {
  "use strict";

  // Event handlers written as onclick="..." attributes are run by VCEvents (see events.js).
  VCEvents.install(document, {
    objects: { App: App },
    globals: { closeModal: closeModal, togglePwVis: togglePwVis },
    history: window.history,
    window: window,
    onError: function (err) {
      console.error(err);
      try { toast((err && err.message) ? err.message : "Something went wrong. Please try again.", "error", "alert"); } catch (e) { /* ignore */ }
    }
  });

  function showBootError() {
    const root = document.getElementById("app");
    root.textContent = "";
    const box = document.createElement("div");
    box.style.cssText = "max-width:520px;margin:80px auto;font-family:Inter,sans-serif;text-align:center;color:#b00";
    const h = document.createElement("h2");
    h.textContent = "Could not connect to Venture Connect";
    const p = document.createElement("p");
    p.textContent = "Check that js/supabase-config.js has your real Supabase project URL and anon key, and that supabase/schema.sql and supabase/hardening.sql have been run in your project.";
    box.appendChild(h);
    box.appendChild(p);
    root.appendChild(box);
  }

  // A password-reset email link brings the user back signed in with a recovery session.
  DB.onPasswordRecovery(function () { App.showPasswordReset(); });

  Store.init().then(function () { App.init(); }).catch(function (e) {
    console.error("Boot failed:", e);
    showBootError();
  });
})();
