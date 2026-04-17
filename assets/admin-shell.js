// assets/admin-shell.js
//
// Shared admin/detailer page bootstrap.

(function attachAdminShell(globalScope) {
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
      default:
        return "Staff";
    }
  }

  function ensureReturnMenu(root, pageKey) {
    if (document.querySelector(".admin-return-bar")) return;
    if (document.querySelector("header.nav")) return;

    const host = document.querySelector("main.shell") || document.querySelector("main.container") || document.body;
    if (!host) return;

    const wrap = document.createElement("div");
    wrap.className = "admin-return-bar";
    wrap.innerHTML = `
      <a class="btn ghost small" href="/admin.html">← Admin Dashboard</a>
      <a class="btn ghost small" href="/admin-account.html">Account</a>
      <a class="btn ghost small" href="/admin-analytics.html">Analytics</a>
      <a class="btn ghost small" href="/admin-catalog.html">Inventory</a>
      <a class="btn ghost small" href="/admin-assign.html">Assign Crew</a>
      <a class="btn ghost small" href="/admin-recovery.html">Recovery</a>
      <a class="btn ghost small" href="/admin-app.html">App</a>
      <a class="btn ghost small" href="/admin-accounting.html">Accounting</a>
      <a class="btn ghost small" href="/admin-payroll.html">Payroll</a>
      <span class="crumb">${pageKey || "admin"}</span>
    `;

    host.insertBefore(wrap, host.firstChild);
  }

  function wireLogout(root, options = {}) {
    const redirectTo = options.logoutRedirect || "/admin-login.html";

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
    const loginUrl = options.loginUrl || "/admin-login.html";

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

      if (typeof options.onReady === "function") {
        await options.onReady({
          actor,
          auth: globalScope.AdminAuth
        });
      }

      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => {
        node.hidden = true;
        node.style.display = "none";
      });

      return {
        ok: true,
        actor
      };
    } catch (err) {
      setLoading(root, false);
      find(root, "[data-admin-shell-loading]").forEach((node) => {
        node.hidden = true;
        node.style.display = "none";
      });
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
