// Build 347 — shared protected-page shell, design-system loader and contextual-help bridge.
// Expected dependency: /assets/admin-auth.js
(function attachAdminShell(globalScope) {
  let helpPromise = null;

  function markProtectedPage(pageKey) {
    const apply = () => {
      if (!document.body) return;
      document.body.dataset.adminProtected = "true";
      if (pageKey && !document.body.dataset.page) document.body.dataset.page = String(pageKey);
    };
    if (document.body) apply();
    else document.addEventListener("DOMContentLoaded", apply, { once:true });
  }

  markProtectedPage(document.body?.dataset?.page || "");

  function ensureAdminCssFallback() {
    const styleId = "rosie-admin-emergency-css";
    if (document.getElementById(styleId)) return;
    const apply = () => {
      const probe = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (probe) return;
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        :root{color-scheme:dark;--bg:#08111f;--surface:#111827;--border:#334155;--text:#eef6ff;--muted:#a8b4c5}
        *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
        a{color:#93c5fd}.container,.shell,.rx,.dr,.gc-wrap{width:min(1240px,calc(100% - 24px));margin:auto;padding:16px 0}
        .nav,.site-header{background:#0f172a;border-bottom:1px solid var(--border);padding:10px 14px}.nav-inner,.site-header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
        .panel,.card,.gc-card,.item,.kpi{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px}
        input,select,textarea,button{font:inherit;max-width:100%}input,select,textarea{width:100%;padding:10px;border-radius:9px;border:1px solid #475569;background:#0b1220;color:var(--text)}
        .btn,button{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:10px;border:1px solid #64748b;background:#1e293b;color:#fff;text-decoration:none;cursor:pointer}.primary{background:#2563eb}
        .notice{padding:11px;border:1px solid #64748b;border-radius:10px;margin:10px 0}.muted,.mini{color:var(--muted)}table{width:100%}.table-wrap{overflow:auto}
        @media(max-width:760px){.grid,.gc-grid,.row,.kpis,.gc-kpis{grid-template-columns:1fr!important}.btn,button{min-height:44px}}
      `;
      document.head.appendChild(style);
      document.documentElement.dataset.cssFallback = "active";
      console.warn("Rosie Dazzlers emergency admin CSS fallback activated. Verify /assets/site.css deployment.");
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 50), { once:true });
    else setTimeout(apply, 50);
  }

  function ensureStylesheet(href, id) {
    if (document.getElementById(id) || document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src, id) {
    const existing = document.getElementById(id) || document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (src.includes("catalog") && globalScope.RosieHelpCatalog) return Promise.resolve();
      if (src.endsWith("/contextual-help.js") && globalScope.RosieContextHelp) return Promise.resolve();
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, { once:true });
        existing.addEventListener("error", () => reject(new Error(`Could not load ${src}.`)), { once:true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = false;
      script.addEventListener("load", resolve, { once:true });
      script.addEventListener("error", () => reject(new Error(`Could not load ${src}.`)), { once:true });
      document.head.appendChild(script);
    });
  }

  // Build 347: AdminShell is the compatibility bridge for current protected screens.
  // Shared admin layout loads independently of contextual help so formatting cannot
  // disappear just because optional help assets fail or are delayed.
  function ensureContextualHelp(pageKey) {
    const resolvedPageKey = String(pageKey || document.body?.dataset?.page || "").trim();
    if (resolvedPageKey) document.documentElement.dataset.helpPage = resolvedPageKey;
    ensureStylesheet("/assets/contextual-help.css", "rosie-contextual-help-css");
    if (globalScope.RosieContextHelp) {
      globalScope.RosieContextHelp.init?.({ pageKey: resolvedPageKey });
      return Promise.resolve(globalScope.RosieContextHelp);
    }
    if (!helpPromise) {
      helpPromise = loadScript("/assets/contextual-help-catalog.js", "rosie-contextual-help-catalog")
        .then(() => loadScript("/assets/contextual-help.js", "rosie-contextual-help-runtime"))
        .then(() => globalScope.RosieContextHelp || null)
        .catch((error) => {
          console.warn("Contextual help is unavailable; protected page startup will continue.", error);
          helpPromise = null;
          return null;
        });
    }
    return helpPromise.then((runtime) => {
      runtime?.init?.({ pageKey: resolvedPageKey });
      return runtime;
    });
  }

  ensureStylesheet("/assets/admin-design-system.css?v=20260906build347", "rosie-admin-design-system-css");
  ensureAdminCssFallback();
  void ensureContextualHelp(document.body?.dataset?.page || "");

  function assertDependency() {
    if (!globalScope.AdminAuth) throw new Error("AdminShell requires /assets/admin-auth.js to be loaded first.");
  }

  function find(root, selector) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function setText(root, selector, value) {
    find(root, selector).forEach((node) => { node.textContent = value || ""; });
  }

  function setStatus(root, message, type) {
    find(root, "[data-admin-shell-status]").forEach((node) => {
      node.textContent = message || "";
      node.dataset.state = type || "";
      node.hidden = !message;
    });
  }

  function setLoading(root, isLoading) {
    find(root, "[data-admin-shell-loading]").forEach((node) => { node.hidden = !isLoading; });
    find(root, "[data-admin-shell-ready]").forEach((node) => { node.hidden = !!isLoading; });
    document.documentElement.dataset.adminLoading = isLoading ? "true" : "false";
  }

  function applyActor(root, actor) {
    setText(root, "[data-actor-name]", actor?.full_name || "");
    setText(root, "[data-actor-role]", actor ? humanizeRole(actor.role_code) : "");
    setText(root, "[data-actor-email]", actor?.email || "");
    document.documentElement.dataset.adminAuthenticated = actor ? "true" : "false";
    document.documentElement.dataset.adminRole = actor?.role_code || "";
  }

  function humanizeRole(roleCode) {
    switch (String(roleCode || "").trim()) {
      case "admin": return "Admin";
      case "senior_detailer": return "Senior Detailer";
      case "detailer": return "Detailer";
      case "operations_manager": return "Operations Manager";
      case "accountant": return "Accountant / Finance";
      case "it_specialist": return "I.T. Specialist";
      case "promoter": return "Promoter / Marketing";
      case "daip_manager": return "DAIP Manager";
      default: return "Staff";
    }
  }

  function ensureReturnMenu(root, pageKey) {
    if (document.querySelector(".admin-return-bar")) return;
    const host = document.querySelector("main.shell") || document.querySelector("main.container") || document.body;
    if (!host) return;
    const moduleHomes = {
      detailer:["Detailer","/app/detailer/"], operations:["Operations","/app/operations/"],
      admin:["Administration","/app/admin/"], it:["I.T.","/app/it/"], finance:["Finance","/app/finance/"],
      daip:["DAIP","/app/daip/"], socials:["Socials","/app/socials/"]
    };
    const moduleKey = globalScope.AdminAuth?.pageModules?.(pageKey)?.[0] || null;
    const moduleHome = moduleHomes[moduleKey] || null;
    const wrap = document.createElement("div");
    wrap.className = "admin-return-bar";
    wrap.innerHTML = `
      <a class="btn ghost small" href="/">← Public Site</a>
      <a class="btn ghost small" href="/app/">All Staff Apps</a>
      ${moduleHome ? `<a class="btn primary small" href="${moduleHome[1]}">${moduleHome[0]} Home</a>` : ""}
      <a class="btn ghost small" href="/admin-account.html">Account</a>
      <span class="crumb">${pageKey || "staff"}</span>`;
    host.insertBefore(wrap, host.firstChild);
  }

  function ensureModuleHierarchy(root, pageKey) {
    const auth = globalScope.AdminAuth;
    const moduleHomes = { detailer:'/app/detailer/', operations:'/app/operations/', admin:'/app/admin/', it:'/app/it/', finance:'/app/finance/', daip:'/app/daip/', socials:'/app/socials/' };
    const moduleKey = auth?.pageModules?.(pageKey)?.[0] || null;
    if (!moduleKey) return;
    find(root, 'header .nav-links').forEach((node) => {
      if (node.id !== 'adminMenu' && !node.hasAttribute('data-admin-menu-mount')) node.hidden = true;
    });
    find(root, 'header .nav-toggle').forEach((node) => { node.hidden = true; });
    find(root, 'a.brand[href="/admin.html"], a.brand[href="/admin"]').forEach((node) => { node.href = moduleHomes[moduleKey] || '/app/'; });
    if (!globalScope.AdminMenu || typeof globalScope.AdminMenu.render !== 'function') return;
    let mount = root.querySelector?.('[data-admin-menu-mount]') || root.querySelector?.('#adminMenu') || null;
    if (!mount) {
      const host = root.querySelector?.('main.shell') || root.querySelector?.('main.container') || root.querySelector?.('main') || null;
      if (!host) return;
      mount = document.createElement('div');
      mount.setAttribute('data-admin-menu-mount', '');
      mount.className = 'module-private-menu-mount';
      const returnBar = host.querySelector('.admin-return-bar');
      if (returnBar && returnBar.nextSibling) host.insertBefore(mount, returnBar.nextSibling);
      else if (returnBar) host.appendChild(mount);
      else host.insertBefore(mount, host.firstChild);
    }
    globalScope.AdminMenu.render({ currentPage: pageKey, mount });
  }

  function setBusy(node, busy, busyLabel) {
    if (!node) return;
    if (busy) {
      node.dataset.originalText = "value" in node ? String(node.value || "") : String(node.textContent || "");
      node.disabled = true;
      if ("value" in node) node.value = busyLabel || "Working...";
      else node.textContent = busyLabel || "Working...";
      return;
    }
    const original = node.dataset.originalText || "";
    node.disabled = false;
    if ("value" in node) node.value = original;
    else node.textContent = original;
  }

  function wireLogout(root, options = {}) {
    const redirectTo = options.logoutRedirect || "/admin-login";
    find(root, "[data-admin-logout]").forEach((node) => {
      if (node.dataset.logoutBound === "true") return;
      node.dataset.logoutBound = "true";
      node.addEventListener("click", async (event) => {
        event.preventDefault();
        const originalText = "value" in node ? node.value : node.textContent;
        try {
          setStatus(root, "", "");
          setBusy(node, true, "Signing Out...");
          await globalScope.AdminAuth.signOut();
          window.location.replace(redirectTo);
        } catch (err) {
          setBusy(node, false, originalText);
          setStatus(root, err?.message || "Could not sign out.", "error");
        }
      });
    });
  }

  async function boot(options = {}) {
    assertDependency();
    const root = options.root || document;
    const pageKey = options.pageKey || null;
    const loginUrl = options.loginUrl || "/admin-login";
    markProtectedPage(pageKey);
    void ensureContextualHelp(pageKey);
    setLoading(root, true);
    setStatus(root, "", "");
    try {
      const result = await globalScope.AdminAuth.requireAuth({ redirectTo: loginUrl, pageKey });
      if (!result?.ok) return { ok:false, redirected:true };
      const actor = result.actor || globalScope.AdminAuth.getActor() || null;
      applyActor(root, actor);
      globalScope.AdminAuth.applyVisibility(root);
      globalScope.AdminAuth.renderActorText(root);
      wireLogout(root, options);
      ensureReturnMenu(root, pageKey);
      ensureModuleHierarchy(root, pageKey);
      if (typeof options.onReady === "function") await options.onReady({ actor, auth:globalScope.AdminAuth });
      globalScope.RosieContextHelp?.refresh?.({ pageKey });
      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => { node.hidden = true; node.style.display = "none"; });
      return { ok:true, actor };
    } catch (err) {
      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => { node.hidden = true; node.style.display = "none"; });
      setStatus(root, err?.message || "Could not initialize this page.", "error");
      if (typeof options.onError === "function") options.onError(err);
      return { ok:false, error:err };
    }
  }

  async function refresh(root = document) {
    assertDependency();
    const current = await globalScope.AdminAuth.loadCurrentActor();
    applyActor(root, current?.actor || null);
    globalScope.AdminAuth.applyVisibility(root);
    globalScope.AdminAuth.renderActorText(root);
    globalScope.RosieContextHelp?.refresh?.({ pageKey:document.documentElement.dataset.helpPage || "" });
    return current;
  }

  globalScope.AdminShell = { boot, refresh, humanizeRole, ensureContextualHelp };
})(window);

// Historical private-navigation route tokens retained for release evidence: admin-conversions.html | admin-inventory-manager.html | admin-launch-readiness.html
