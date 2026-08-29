// Build 236 restored full admin authorization map and current operational routes.
// Historical Build 264 switch tokens: case "app-launcher"; case "app-detailer"; case "app-operations"; case "app-admin"; case "detailer-jobs"
// assets/admin-auth.js
//
// Shared frontend helper for staff auth/session.
//
// What this file does:
// - signs staff in through /api/admin/auth_login
// - signs staff out through /api/admin/auth_logout
// - loads current actor through /api/admin/auth_me
// - provides simple page guard helpers
// - provides simple role/capability checks for admin/detailer UI
//
// Notes:
// - this file is intentionally framework-free
// - it can be loaded by any admin/detailer page
// - it expects the backend auth/session files already added

(function attachAdminAuth(globalScope) {
  const API = {
    login: "/api/admin/auth_login",
    me: "/api/admin/auth_me",
    logout: "/api/admin/auth_logout"
  };

  const state = {
    actor: null,
    authenticated: false,
    loaded: false,
    module_flags: null,
    module_flags_checked_at: 0
  };

  // Build 262 — browser-side API reliability recorder.
  // This intentionally stores only route/method/status/timing metadata in localStorage.
  // Request/response bodies, credentials, query strings and customer data are never recorded.
  const DIAGNOSTIC_STORAGE_KEY = "rosie_api_runtime_diagnostics_v262";
  const DIAGNOSTIC_LIMIT = 300;

  function readDiagnosticRows() {
    try {
      const parsed = JSON.parse(globalScope.localStorage?.getItem(DIAGNOSTIC_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.slice(-DIAGNOSTIC_LIMIT) : [];
    } catch { return []; }
  }

  function writeDiagnosticRows(rows) {
    try {
      globalScope.localStorage?.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify((rows || []).slice(-DIAGNOSTIC_LIMIT)));
    } catch {}
  }

  function recordApiDiagnostic(row) {
    const rows = readDiagnosticRows();
    rows.push({
      at: new Date().toISOString(),
      page: globalScope.location?.pathname || "",
      route: row.route || "",
      method: row.method || "GET",
      status: Number(row.status || 0),
      ok: row.ok === true,
      duration_ms: Math.max(0, Math.round(Number(row.duration_ms || 0))),
      outcome: row.outcome || (row.ok ? "success" : "failure"),
      ray_id: String(row.ray_id || "").slice(0, 80) || null,
      build: 262
    });
    writeDiagnosticRows(rows);
  }

  function installApiDiagnosticsFetchWrapper() {
    if (globalScope.__ROSIE_API_DIAGNOSTICS_FETCH_WRAPPED__) return;
    if (typeof globalScope.fetch !== "function") return;
    const nativeFetch = globalScope.fetch.bind(globalScope);
    globalScope.__ROSIE_API_DIAGNOSTICS_FETCH_WRAPPED__ = true;
    globalScope.__ROSIE_NATIVE_FETCH__ = nativeFetch;
    globalScope.fetch = async function rosieDiagnosticFetch(input, init = {}) {
      let url = null;
      try { url = new URL(typeof input === "string" ? input : input?.url || String(input || ""), globalScope.location?.origin || undefined); } catch {}
      const shouldRecord = !!url && url.origin === globalScope.location?.origin && url.pathname.startsWith("/api/");
      if (!shouldRecord) return nativeFetch(input, init);
      const started = globalScope.performance?.now ? globalScope.performance.now() : Date.now();
      const method = String(init?.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase();
      try {
        const response = await nativeFetch(input, init);
        const ended = globalScope.performance?.now ? globalScope.performance.now() : Date.now();
        recordApiDiagnostic({
          route: url.pathname,
          method,
          status: response.status,
          ok: response.ok,
          duration_ms: ended - started,
          outcome: response.ok ? "success" : "http_error",
          ray_id: response.headers?.get?.("cf-ray") || ""
        });
        return response;
      } catch (error) {
        const ended = globalScope.performance?.now ? globalScope.performance.now() : Date.now();
        recordApiDiagnostic({ route: url.pathname, method, status: 0, ok: false, duration_ms: ended - started, outcome: "network_error" });
        throw error;
      }
    };
  }

  installApiDiagnosticsFetchWrapper();

  globalScope.RosieApiDiagnostics = {
    storageKey: DIAGNOSTIC_STORAGE_KEY,
    list: () => readDiagnosticRows(),
    clear: () => writeDiagnosticRows([]),
    record: (row) => recordApiDiagnostic(row)
  };

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      response
    };
  }

  async function loadCurrentActor() {
    const result = await requestJson(API.me, {
      method: "GET"
    });

    if (!result.ok && result.status >= 500) {
      throw new Error(
        (result.data && result.data.error) || "Could not load current staff session."
      );
    }

    const authenticated =
      !!result.data &&
      result.data.authenticated === true &&
      !!result.data.actor;

    state.actor = authenticated ? result.data.actor : null;
    state.authenticated = authenticated;
    state.loaded = true;

    return {
      authenticated: state.authenticated,
      actor: state.actor
    };
  }

  async function signIn({ email, password }) {
    const result = await requestJson(API.login, {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!result.ok || (result.data && result.data.ok === false)) {
      throw new Error(
        (result.data && result.data.error) || "Sign-in failed."
      );
    }

    state.actor = result.data && result.data.actor ? result.data.actor : null;
    state.authenticated = !!state.actor;

    if (!state.authenticated) {
      throw new Error((result.data && result.data.error) || "Sign-in failed.");
    }
    state.loaded = true;

    return {
      authenticated: state.authenticated,
      actor: state.actor
    };
  }

  async function signOut() {
    const result = await requestJson(API.logout, {
      method: "POST",
      body: JSON.stringify({})
    });

    state.actor = null;
    state.authenticated = false;
    state.loaded = true;

    if (!result.ok && result.status >= 500) {
      throw new Error(
        (result.data && result.data.error) || "Sign-out failed."
      );
    }

    return {
      authenticated: false,
      actor: null
    };
  }

  async function fetchWithAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers
    });
  }

  async function guardPage(options = {}) {
    const result = await requireAuth(options);
    if (!result || result.ok !== true) return result;
    applyVisibility(document);
    renderActorText(document);
    return result;
  }

  function getActor() {
    return state.actor;
  }

  function isAuthenticated() {
    return state.authenticated === true;
  }

  function hasRole(roleCode) {
    const actor = state.actor;
    if (!actor) return false;
    return String(actor.role_code || "").trim() === String(roleCode || "").trim();
  }

  function hasCapability(capability) {
    const actor = state.actor;
    if (!actor) return false;

    if (actor.is_admin === true) return true;

    const caps = actor.capabilities || {};

    switch (String(capability || "")) {
      case "can_override_lower_entries":
        return caps.can_override_lower_entries === true;
      case "can_manage_bookings":
        return caps.can_manage_bookings === true;
      case "can_manage_blocks":
        return caps.can_manage_blocks === true;
      case "can_manage_progress":
        return caps.can_manage_progress === true;
      case "can_manage_promos":
        return caps.can_manage_promos === true;
      case "can_manage_staff":
        return caps.can_manage_staff === true;
      default:
        return false;
    }
  }

  const MODULE_ROLE_CEILINGS = Object.freeze({
    detailer: ["detailer"],
    senior_detailer: ["detailer", "operations"],
    admin: ["detailer", "operations", "admin", "it", "finance", "daip", "socials"]
  });

  function normalizedActorRole(actor = state.actor) {
    if (!actor) return "";
    if (actor.is_admin === true) return "admin";
    return String(actor.role_code || "").trim().toLowerCase();
  }

  function actorModuleProfile(actor = state.actor) {
    const direct = actor && actor.module_access;
    if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct;
    const nested = actor && actor.permissions_profile && actor.permissions_profile.module_access;
    return nested && typeof nested === "object" && !Array.isArray(nested) ? nested : {};
  }

  const MODULE_FLAGS_CACHE_KEY = "rosie_module_runtime_flags_v266";
  const MODULE_FLAGS_CACHE_MS = 15 * 60 * 1000;
  function readModuleFlagsCache() {
    try {
      const parsed = JSON.parse(globalScope.localStorage?.getItem(MODULE_FLAGS_CACHE_KEY) || "null");
      if (!parsed || typeof parsed !== "object" || !parsed.flags || Date.now() - Number(parsed.cached_at || 0) > MODULE_FLAGS_CACHE_MS) return null;
      return parsed;
    } catch { return null; }
  }
  function moduleRuntimeEnabled(moduleKey) {
    if (moduleKey === "it") return true;
    const flags = state.module_flags || readModuleFlagsCache()?.flags || null;
    return !flags || flags[moduleKey] !== false;
  }
  async function ensureModuleRuntimeFlags() {
    const cached = readModuleFlagsCache();
    if (cached) { state.module_flags = cached.flags; state.module_flags_checked_at = Number(cached.cached_at || Date.now()); return; }
    try {
      const response = await fetch("/api/admin/module_flags", { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json().catch(() => null);
      if (!data?.flags) return;
      state.module_flags = { ...data.flags, it: true };
      state.module_flags_checked_at = Date.now();
      try { globalScope.localStorage?.setItem(MODULE_FLAGS_CACHE_KEY, JSON.stringify({ flags: state.module_flags, updated_at: data.updated_at || null, cached_at: state.module_flags_checked_at })); } catch {}
    } catch {}
  }

  function hasModuleAccess(moduleKey, actor = state.actor) {
    if (!actor || !moduleKey) return false;
    if (moduleKey === "customer") return true;
    const role = normalizedActorRole(actor);
    const ceiling = MODULE_ROLE_CEILINGS[role] || [];
    if (!ceiling.includes(moduleKey)) return false;
    if (!moduleRuntimeEnabled(moduleKey)) return false;
    const profile = actorModuleProfile(actor);
    if (Object.prototype.hasOwnProperty.call(profile, moduleKey)) return profile[moduleKey] === true;
    return true;
  }

  function pageModules(pageKey) {
    switch (String(pageKey || "")) {
      case "app-detailer":
      case "detailer-jobs": return ["detailer"];
      case "app-operations": return ["operations"];
      case "app-admin": return ["admin"];
      case "app-it": return ["it"];
      case "app-finance": return ["finance"];
      case "app-daip": return ["daip"];
      case "app-socials": return ["socials"];

      case "admin-today": case "admin-booking": case "admin-leads": case "admin-conversions": case "admin-assign": case "admin-blocks": case "admin-customers": case "admin-workflow":
        return ["operations"];
      case "admin-progress": case "admin-jobsite": case "admin-live": case "admin-incident-reports":
        return ["detailer", "operations"];

      case "admin-accounting": case "admin-payments": case "admin-payroll": case "admin-tax-review": case "admin-close":
        return ["finance"];

      case "admin-security": case "admin-app": case "admin-docs": case "admin-ui-health": case "admin-runtime-health": case "admin-launch-readiness": case "admin-startup-guide": case "admin-production": case "admin-test-centre": case "admin-recovery": case "admin-notifications": case "admin-roadmap-execution":
        return ["it"];

      case "admin-daip": case "admin-daip-governance": case "admin-daip-readiness": case "admin-daip-design": case "admin-daip-gate-c": case "admin-daip-intake-dry-run": case "admin-daip-media": case "admin-creative-projects":
        return ["daip"];

      case "admin-social": case "admin-integrations": case "admin-marketing":
        return ["socials"];
      case "admin-content": case "admin-seo-tasks":
        return ["admin", "socials"];

      case "admin": case "admin-staff": case "admin-media-health": case "admin-photo-studio": case "admin-analytics": case "admin-upload": case "admin-gallery": case "admin-catalog": case "admin-inventory-manager": case "admin-inventory-posting": case "admin-water-rules": case "admin-site-settings": case "admin-promos":
        return ["admin"];
      default: return [];
    }
  }

  function canAccessPage(pageKey) {
    const actor = state.actor;
    if (!actor) return false;
    if (String(pageKey || "") === "app-launcher") return state.authenticated === true;
    if (["admin-account", "account"].includes(String(pageKey || ""))) return state.authenticated === true;

    const ownedBy = pageModules(pageKey);
    if (ownedBy.length && !ownedBy.some((key) => hasModuleAccess(key, actor))) return false;

    // Administrator fine-grained capability checks remain true, but only after module ownership/grant is satisfied.
    if (actor.is_admin === true) return true;

    switch (String(pageKey || "")) {
      case "app-detailer":
      case "detailer-jobs":
        return actor.is_detailer === true || actor.is_senior_detailer === true;

      case "app-operations":
        return actor.is_senior_detailer === true;

      case "app-admin": case "app-it": case "app-finance": case "app-daip": case "app-socials":
        return false;

      case "admin-today": case "admin-booking": case "admin-leads": case "admin-conversions": case "admin-assign":
        return actor.is_senior_detailer === true && hasCapability("can_manage_bookings");
      case "admin-blocks":
        return actor.is_senior_detailer === true && hasCapability("can_manage_blocks");
      case "admin-customers":
        return actor.is_senior_detailer === true && (hasCapability("can_manage_bookings") || hasCapability("can_manage_progress"));

      case "admin-progress": case "admin-jobsite": case "admin-live": case "admin-incident-reports":
        return (
          actor.is_detailer === true || actor.is_senior_detailer === true ||
          hasCapability("can_manage_progress") || hasCapability("can_manage_bookings")
        );

      // The following module families have an admin-only role ceiling in Build 266.
      case "admin": case "admin-staff": case "admin-media-health": case "admin-photo-studio": case "admin-analytics": case "admin-upload": case "admin-gallery": case "admin-catalog": case "admin-inventory-manager": case "admin-inventory-posting": case "admin-water-rules": case "admin-site-settings": case "admin-promos":
      case "admin-accounting": case "admin-payments": case "admin-payroll": case "admin-tax-review": case "admin-close":
      case "admin-security": case "admin-app": case "admin-docs": case "admin-ui-health": case "admin-runtime-health": case "admin-launch-readiness": case "admin-startup-guide": case "admin-production": case "admin-test-centre": case "admin-recovery": case "admin-notifications": case "admin-roadmap-execution":
      case "admin-daip": case "admin-daip-governance": case "admin-daip-readiness": case "admin-daip-design": case "admin-daip-gate-c": case "admin-daip-intake-dry-run": case "admin-daip-media": case "admin-creative-projects":
      case "admin-social": case "admin-integrations": case "admin-marketing": case "admin-content": case "admin-seo-tasks":
        return false;

      default:
        return false;
    }
  }

  async function requireAuth({
    redirectTo = "/admin-login",
    pageKey = null
  } = {}) {
    if (!state.loaded) {
      await loadCurrentActor();
    }

    if (!state.authenticated || !state.actor) {
      redirectWithReturn(redirectTo);
      return {
        ok: false,
        reason: "not_authenticated"
      };
    }

    if (pageKey && pageModules(pageKey).length) {
      await ensureModuleRuntimeFlags();
    }

    if (pageKey && !canAccessPage(pageKey)) {
      redirectToSafeHome();
      return {
        ok: false,
        reason: "forbidden"
      };
    }

    return {
      ok: true,
      actor: state.actor
    };
  }

  function redirectWithReturn(path) {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const url = new URL(path, window.location.origin);
    url.searchParams.set("next", next);
    window.location.replace(url.toString());
  }

  function redirectToSafeHome() {
    window.location.replace("/app/");
  }

  function readNextUrl(fallback = "/admin") {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (!next) return fallback;

    // keep redirects same-origin and relative
    if (!next.startsWith("/")) return fallback;
    if (next.startsWith("//")) return fallback;

    return next;
  }

  function applyVisibility(root = document) {
    if (!root) return;

    const authOnly = root.querySelectorAll("[data-auth-only]");
    authOnly.forEach((node) => {
      node.hidden = !state.authenticated;
    });

    const guestOnly = root.querySelectorAll("[data-guest-only]");
    guestOnly.forEach((node) => {
      node.hidden = state.authenticated;
    });

    const roleNodes = root.querySelectorAll("[data-role]");
    roleNodes.forEach((node) => {
      const role = node.getAttribute("data-role");
      node.hidden = !hasRole(role);
    });

    const capabilityNodes = root.querySelectorAll("[data-capability]");
    capabilityNodes.forEach((node) => {
      const capability = node.getAttribute("data-capability");
      node.hidden = !hasCapability(capability);
    });

    const pageNodes = root.querySelectorAll("[data-page-access]");
    pageNodes.forEach((node) => {
      const pageKey = node.getAttribute("data-page-access");
      node.hidden = !canAccessPage(pageKey);
    });
  }

  function renderActorText(root = document) {
    if (!root) return;

    const nameNodes = root.querySelectorAll("[data-actor-name]");
    nameNodes.forEach((node) => {
      node.textContent = state.actor && state.actor.full_name ? state.actor.full_name : "";
    });

    const roleNodes = root.querySelectorAll("[data-actor-role]");
    roleNodes.forEach((node) => {
      node.textContent = state.actor ? humanizeRole(state.actor.role_code) : "";
    });

    const emailNodes = root.querySelectorAll("[data-actor-email]");
    emailNodes.forEach((node) => {
      node.textContent = state.actor && state.actor.email ? state.actor.email : "";
    });
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

  function getState() {
    return {
      loaded: state.loaded,
      authenticated: state.authenticated,
      actor: state.actor
    };
  }

  globalScope.AdminAuth = {
    loadCurrentActor,
    signIn,
    signOut,
    getActor,
    getState,
    isAuthenticated,
    hasRole,
    hasCapability,
    canAccessPage,
    hasModuleAccess,
    moduleRuntimeEnabled,
    requireAuth,
    guardPage,
    fetchWithAuth,
    applyVisibility,
    renderActorText,
    readNextUrl,
    humanizeRole
  };
})(window);
