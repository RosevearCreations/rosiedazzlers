// assets/admin-page-init.js
//
// Shared admin/detailer page initializer.

(function attachAdminPageInit(globalScope) {
  function assertDependencies() {
    if (!globalScope.AdminShell) {
      throw new Error("AdminPageInit requires /assets/admin-shell.js.");
    }
    if (!globalScope.AdminMenu) {
      throw new Error("AdminPageInit requires /assets/admin-menu.js.");
    }
  }

  async function init(options = {}) {
    assertDependencies();

    const pageKey = String(options.pageKey || "").trim();
    const mount = options.menuMount || document.querySelector("[data-admin-menu-mount]");
    const menuTitle = options.menuTitle || "Internal Menu";

    const result = await globalScope.AdminShell.boot({
      pageKey,
      loginUrl: options.loginUrl || "/admin-login.html",
      logoutRedirect: options.logoutRedirect || "/admin-login.html",
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
      },
      onError: options.onError
    });

    return result;
  }

  globalScope.AdminPageInit = { init };
})(window);
