// Build 236 restored complete shared admin shell shortcuts.
// assets/admin-shell.js
//
// Shared admin/detailer page bootstrap.
//
// What this file does:
// - requires a valid signed-in staff session for protected pages
// - loads current actor through AdminAuth
// - updates page text placeholders like actor name / role / email
// - applies role/capability/page-based visibility rules
// - wires logout buttons automatically
// - provides a small page bootstrap helper for admin/detailer screens
//
// Expected dependency:
// - /assets/admin-auth.js
//
// Typical page usage:
// <script src="/assets/admin-auth.js"></script>
// <script src="/assets/admin-shell.js"></script>
// <script>
//   window.AdminShell.boot({ pageKey: "admin-jobsite" });
// </script>
//
// Optional markup hooks:
// - [data-actor-name]
// - [data-actor-role]
// - [data-actor-email]
// - [data-auth-only]
// - [data-guest-only]
// - [data-role="admin"]
// - [data-capability="can_manage_staff"]
// - [data-page-access="admin-promos"]
// - [data-admin-logout]
// - [data-admin-shell-status]
// - [data-admin-shell-loading]
// - [data-admin-shell-ready]

(function attachAdminShell(globalScope) {
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
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 50), {once:true});
    else setTimeout(apply, 50);
  }
  ensureAdminCssFallback();
  function assertDependency() {
    if (!globalScope.AdminAuth) {
      throw new Error("AdminShell requires /assets/admin-auth.js to be loaded first.");
    }
  }

  function find(root, selector) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function setText(root, selector, value) {
    find(root, selector).forEach((node) => {
      node.textContent = value || "";
    });
  }

  function setStatus(root, message, type) {
    const nodes = find(root, "[data-admin-shell-status]");
    nodes.forEach((node) => {
      node.textContent = message || "";
      node.dataset.state = type || "";
      node.hidden = !message;
    });
  }

  function setLoading(root, isLoading) {
    find(root, "[data-admin-shell-loading]").forEach((node) => {
      node.hidden = !isLoading;
    });

    find(root, "[data-admin-shell-ready]").forEach((node) => {
      node.hidden = !!isLoading;
    });

    document.documentElement.dataset.adminLoading = isLoading ? "true" : "false";
  }

  function applyActor(root, actor) {
    setText(root, "[data-actor-name]", actor && actor.full_name ? actor.full_name : "");
    setText(root, "[data-actor-role]", actor ? humanizeRole(actor.role_code) : "");
    setText(root, "[data-actor-email]", actor && actor.email ? actor.email : "");

    document.documentElement.dataset.adminAuthenticated = actor ? "true" : "false";
    document.documentElement.dataset.adminRole = actor && actor.role_code ? actor.role_code : "";
  }

  function humanizeRole(roleCode) {
    switch (String(roleCode || "").trim()) {
      case "admin":
        return "Admin";
      case "senior_detailer":
        return "Senior Detailer";
      case "detailer":
        return "Detailer";
      case "operations_manager":
        return "Operations Manager";
      case "accountant":
        return "Accountant / Finance";
      case "it_specialist":
        return "I.T. Specialist";
      case "promoter":
        return "Promoter / Marketing";
      case "daip_manager":
        return "DAIP Manager";
      default:
        return "Staff";
    }
  }

  function ensureReturnMenu(root, pageKey) {
    if (document.querySelector(".admin-return-bar")) return;
    const host = document.querySelector("main.shell") || document.querySelector("main.container") || document.body;
    if (!host) return;

    const wrap = document.createElement("div");
    wrap.className = "admin-return-bar";
    const moduleHomes = {detailer:["Detailer","/app/detailer/"],operations:["Operations","/app/operations/"],admin:["Administration","/app/admin/"],it:["I.T.","/app/it/"],finance:["Finance","/app/finance/"],daip:["DAIP","/app/daip/"],socials:["Socials","/app/socials/"]};
    const moduleKey = globalScope.AdminAuth?.pageModules?.(pageKey)?.[0] || null;
    const moduleHome = moduleHomes[moduleKey] || null;
    wrap.innerHTML = `
      <a class="btn ghost small" href="/">← Public Site</a>
      <a class="btn ghost small" href="/app/">All Staff Apps</a>
      ${moduleHome ? `<a class="btn primary small" href="${moduleHome[1]}">${moduleHome[0]} Home</a>` : ""}
      <a class="btn ghost small" href="/admin-account.html">Account</a>
      <span class="crumb">${pageKey || "staff"}</span>
    `;

    host.insertBefore(wrap, host.firstChild);
  }


  function ensureModuleHierarchy(root, pageKey) {
    const auth = globalScope.AdminAuth;
    const moduleHomes = {detailer:'/app/detailer/',operations:'/app/operations/',admin:'/app/admin/',it:'/app/it/',finance:'/app/finance/',daip:'/app/daip/',socials:'/app/socials/'};
    const moduleKey = auth?.pageModules?.(pageKey)?.[0] || null;
    if (!moduleKey) return;

    // Retire legacy cross-module header links on protected pages. The brand returns to the owning module.
    find(root, 'header .nav-links').forEach((node) => {
      if (node.id !== 'adminMenu' && !node.hasAttribute('data-admin-menu-mount')) node.hidden = true;
    });
    find(root, 'header .nav-toggle').forEach((node) => { node.hidden = true; });
    find(root, 'a.brand[href="/admin.html"], a.brand[href="/admin"]')
      .forEach((node) => { node.href = moduleHomes[moduleKey] || '/app/'; });

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

  function wireLogout(root, options = {}) {
    const redirectTo = options.logoutRedirect || "/admin-login";

    find(root, "[data-admin-logout]").forEach((node) => {
      if (node.dataset.logoutBound === "true") return;

      node.dataset.logoutBound = "true";
      node.addEventListener("click", async function (event) {
        event.preventDefault();

        const originalText = "value" in node ? node.value : node.textContent;
        try {
          setStatus(root, "", "");
          setBusy(node, true, "Signing Out...");
          await globalScope.AdminAuth.signOut();
          window.location.replace(redirectTo);
        } catch (err) {
          setBusy(node, false, originalText);
          setStatus(
            root,
            err && err.message ? err.message : "Could not sign out.",
            "error"
          );
        }
      });
    });
  }

  function setBusy(node, busy, busyLabel) {
    if (!node) return;

    if (busy) {
      node.dataset.originalText =
        "value" in node ? String(node.value || "") : String(node.textContent || "");
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

  async function boot(options = {}) {
    assertDependency();

    const root = options.root || document;
    const pageKey = options.pageKey || null;
    const loginUrl = options.loginUrl || "/admin-login";

    setLoading(root, true);
    setStatus(root, "", "");

    try {
      const result = await globalScope.AdminAuth.requireAuth({
        redirectTo: loginUrl,
        pageKey
      });

      if (!result || !result.ok) {
        return {
          ok: false,
          redirected: true
        };
      }

      const actor = result.actor || globalScope.AdminAuth.getActor() || null;

      applyActor(root, actor);
      globalScope.AdminAuth.applyVisibility(root);
      globalScope.AdminAuth.renderActorText(root);
      wireLogout(root, options);
      ensureReturnMenu(root, pageKey);
      ensureModuleHierarchy(root, pageKey);

      if (typeof options.onReady === "function") {
        await options.onReady({
          actor,
          auth: globalScope.AdminAuth
        });
      }

      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => { node.hidden = true; node.style.display = "none"; });

      return {
        ok: true,
        actor
      };
    } catch (err) {
      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => { node.hidden = true; node.style.display = "none"; });
      setStatus(
        root,
        err && err.message ? err.message : "Could not initialize this page.",
        "error"
      );

      if (typeof options.onError === "function") {
        options.onError(err);
      }

      return {
        ok: false,
        error: err
      };
    }
  }

  async function refresh(root = document) {
    assertDependency();

    const current = await globalScope.AdminAuth.loadCurrentActor();
    applyActor(root, current && current.actor ? current.actor : null);
    globalScope.AdminAuth.applyVisibility(root);
    globalScope.AdminAuth.renderActorText(root);

    return current;
  }

  globalScope.AdminShell = {
    boot,
    refresh,
    humanizeRole
  };
})(window);

// Historical private-navigation route tokens retained for release evidence: admin-conversions.html | admin-inventory-manager.html | admin-launch-readiness.html
