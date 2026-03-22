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

      if (typeof options.onReady === "function") {
        await options.onReady({
          actor,
          auth: globalScope.AdminAuth
        });
      }

      setLoading(root, false);

      return {
        ok: true,
        actor
      };
    } catch (err) {
      setLoading(root, false);
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
