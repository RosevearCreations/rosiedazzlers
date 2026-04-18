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


  function topNavItems() {
    return [
      { key: "admin", label: "Dashboard", href: "/admin.html", visible: () => true },
      { key: "admin-booking", label: "Bookings", href: "/admin-booking.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-booking") },
      { key: "admin-blocks", label: "Blocks", href: "/admin-blocks.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-blocks") },
      { key: "admin-assign", label: "Assign Crew", href: "/admin-assign.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-assign") },
      { key: "admin-progress", label: "Progress", href: "/admin-progress.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-progress") },
      { key: "admin-jobsite", label: "Jobsite", href: "/admin-jobsite.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-jobsite") },
      { key: "admin-live", label: "Live", href: "/admin-live.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-live") },
      { key: "admin-staff", label: "Staff", href: "/admin-staff.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-staff") },
      { key: "admin-payroll", label: "Crew Time & Payroll", href: "/admin-payroll.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-payroll") },
      { key: "admin-catalog", label: "Inventory", href: "/admin-catalog.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-catalog") },
      { key: "admin-customers", label: "Customers", href: "/admin-customers.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-customers") },
      { key: "admin-notifications", label: "Notifications", href: "/admin-notifications.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-notifications") },
      { key: "admin-analytics", label: "Analytics", href: "/admin-analytics.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-analytics") },
      { key: "admin-promos", label: "Promos", href: "/admin-promos.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-promos") },
      { key: "admin-accounting", label: "Accounting", href: "/admin-accounting.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-accounting") || globalScope.AdminAuth.canAccessPage("admin") },
      { key: "admin-app", label: "App Management", href: "/admin-app.html", visible: () => globalScope.AdminAuth.canAccessPage("admin-app") },
      { key: "account", label: "My Account", href: "/admin-account.html", visible: () => globalScope.AdminAuth.isAuthenticated() },
      { key: "public-site", label: "Public Site", href: "/", visible: () => true }
    ];
  }

  function renderTopNavigation(root, pageKey, actor) {
    const nav = document.querySelector("header.nav, .nav");
    const navLinks = document.querySelector("#navLinks");
    const navInner = document.querySelector(".nav-inner");
    if (!nav || !navLinks || !navInner) return;

    const brand = navInner.querySelector(".brand");
    if (brand) {
      brand.setAttribute("href", "/admin.html");
      const brandLabel = brand.querySelector("strong");
      if (brandLabel) brandLabel.textContent = "Rosie Dazzlers Admin";
    }

    Array.from(navInner.children).forEach((child) => {
      const keep = child.classList?.contains("brand") || child.id === "navToggle" || child.id === "navLinks" || child.classList?.contains("account-widget");
      if (!keep && child !== navLinks) child.remove();
    });

    const currentPage = String(pageKey || "").trim();
    const links = topNavItems().filter((item) => {
      try {
        return item.visible();
      } catch {
        return false;
      }
    });

    navLinks.innerHTML = links
      .map((item) => {
        const isActive = item.key === currentPage;
        return `<a href="${item.href}"${isActive ? ' class="active" aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
      })
      .join("");

    let widget = navInner.querySelector(".account-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.className = "account-widget";
      navInner.appendChild(widget);
    }

    const actorLabel = actor && actor.full_name ? actor.full_name : "Signed in";
    const roleLabel = actor ? humanizeRole(actor.role_code) : "Staff";
    widget.innerHTML = `
      <div class="account-widget-inner">
        <span class="account-chip" title="${escapeHtml(actorLabel)}">${escapeHtml(actorLabel)} · ${escapeHtml(roleLabel)}</span>
        <a class="btn small ghost" href="/admin-account.html">Account</a>
        <button class="btn small ghost" type="button" data-admin-logout>Sign Out</button>
      </div>
    `;

    const toggle = navInner.querySelector("#navToggle");
    if (toggle && toggle.dataset.bound !== "true") {
      toggle.dataset.bound = "true";
      toggle.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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
      renderTopNavigation(root, pageKey, actor);
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
