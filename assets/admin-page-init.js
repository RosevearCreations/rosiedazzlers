// assets/admin-page-init.js
//
// Shared admin/detailer page initializer.
//
// What this file does:
// - boots AdminShell for protected pages
// - renders AdminMenu automatically
// - loads Build 274 contextual help without blocking normal page startup
// - gives each page one simple init call
// - reduces repeated auth/menu startup code across admin pages
//
// Expected dependencies:
// - /assets/admin-auth.js
// - /assets/admin-shell.js
// - /assets/admin-menu.js
//
// Typical page usage:
// <script src="/assets/admin-auth.js"></script>
// <script src="/assets/admin-shell.js"></script>
// <script src="/assets/admin-menu.js"></script>
// <script src="/assets/admin-page-init.js"></script>
// <script>
//   window.AdminPageInit.init({
//     pageKey: "admin-booking",
//     onReady: async ({ actor }) => { ... }
//   });
// </script>
//
// Optional page markup hook:
// - [data-admin-menu-mount]

(function attachAdminPageInit(globalScope) {
  let helpPromise = null;

  function assertDependencies() {
    if (!globalScope.AdminShell) {
      throw new Error("AdminPageInit requires /assets/admin-shell.js.");
    }
    if (!globalScope.AdminMenu) {
      throw new Error("AdminPageInit requires /assets/admin-menu.js.");
    }
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

  function loadContextualHelp(pageKey) {
    if (pageKey) document.documentElement.dataset.helpPage = String(pageKey).trim();
    ensureStylesheet("/assets/contextual-help.css", "rosie-contextual-help-css");
    if (globalScope.RosieContextHelp) {
      globalScope.RosieContextHelp.init({ pageKey });
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
      runtime?.init?.({ pageKey });
      return runtime;
    });
  }

  async function init(options = {}) {
    assertDependencies();

    const pageKey = String(options.pageKey || "").trim();
    const mount = options.menuMount || document.querySelector("[data-admin-menu-mount]");
    const menuTitle = options.menuTitle || "Internal Menu";

    // Help must never be able to block auth, menus or page-specific initialization.
    void loadContextualHelp(pageKey);

    const result = await globalScope.AdminShell.boot({
      pageKey,
      loginUrl: options.loginUrl || "/admin-login",
      logoutRedirect: options.logoutRedirect || "/admin-login",
      root: options.root || document,
      onReady: async ({ actor, auth }) => {
        if (mount) {
          globalScope.AdminMenu.render({
            currentPage: pageKey,
            mount,
            title: menuTitle
          });
        }

        if (typeof options.onReady === "function") {
          await options.onReady({ actor, auth });
        }

        globalScope.RosieContextHelp?.refresh?.({ pageKey });
      },
      onError: options.onError
    });

    return result;
  }

  globalScope.AdminPageInit = {
    init,
    loadContextualHelp
  };

  // Pages that already include AdminPageInit but still use a legacy direct AdminShell boot
  // receive the same help runtime automatically. Any failure is intentionally non-blocking.
  void loadContextualHelp(document.body?.dataset?.page || "");
})(window);
