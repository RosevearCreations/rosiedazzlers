// Build 267 — generic lazy module shell. Auth + cached module flags only; no subsystem dataset reads.
(function (globalScope) {
  'use strict';

  async function boot() {
    const body = document.body;
    const key = String(body.dataset.appModule || '').trim();
    if (!key) throw new Error('Missing module key.');

    await globalScope.AdminShell.boot({
      pageKey: `app-${key}`,
      onReady: async ({ actor }) => {
        const resolver = globalScope.RosieAppCore.ModuleResolver;
        const flagState = await resolver.loadRuntimeFlags();
        if (!resolver.canAccess(key, actor)) {
          location.replace('/app/');
          return;
        }
        resolver.remember(key);
        globalScope.RosieAppCore.ModuleNavigation?.renderHome?.(key);
        const status = document.getElementById('moduleRuntimeStatus');
        if (status) {
          status.className = 'notice ok';
          status.textContent = `${resolver.MODULES[key]?.name || key} is available. No ${key} dataset has been loaded. Module flags: ${flagState.source}.`;
        }
      }
    });
  }

  boot().catch((error) => {
    const status = document.getElementById('moduleRuntimeStatus');
    if (status) {
      status.className = 'notice bad';
      status.textContent = error.message || 'Could not start module shell.';
    }
  });
})(window);
