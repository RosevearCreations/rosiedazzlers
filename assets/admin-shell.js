// assets/admin-shell.js
(() => {
  const globalScope = window;

  function ensureStyles() {
    if (document.getElementById("admin-shell-inline-styles")) return;
    const style = document.createElement("style");
    style.id = "admin-shell-inline-styles";
    style.textContent = `
      .admin-shell-loading {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(2px);
        z-index: 9999;
      }
      .admin-shell-loading[hidden] { display: none; }
      .admin-shell-loading .panel {
        min-width: 260px;
        max-width: 92vw;
        padding: 18px 20px;
        border-radius: 16px;
        background: #0f172a;
        color: #e5e7eb;
        box-shadow: 0 16px 40px rgba(0,0,0,.35);
        border: 1px solid rgba(255,255,255,.08);
        text-align: center;
      }
      .admin-shell-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .admin-shell-toolbar .left,
      .admin-shell-toolbar .right {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .admin-shell-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(255,255,255,.08);
        color: #e5e7eb;
        font-size: .92rem;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLoadingOverlay() {
    let node = document.getElementById("admin-shell-loading");
    if (node) return node;
    node = document.createElement("div");
    node.id = "admin-shell-loading";
    node.className = "admin-shell-loading";
    node.hidden = true;
    node.innerHTML = `
      <div class="panel">
        <div style="font-weight:700; font-size:1rem; margin-bottom:6px;">Loading admin…</div>
        <div style="opacity:.85; font-size:.92rem;">Checking sign-in status and preparing the page.</div>
      </div>
    `;
    document.body.appendChild(node);
    return node;
  }

  function setLoading(active) {
    const overlay = ensureLoadingOverlay();
    overlay.hidden = !active;
  }

  function makeBtn(href, text) {
    const a = document.createElement("a");
    a.className = "btn ghost small";
    a.href = href;
    a.textContent = text;
    return a;
  }

  function renderToolbar(container, actor) {
    const wrap = document.createElement("div");
    wrap.className = "admin-shell-toolbar";

    const left = document.createElement("div");
    left.className = "left";
    left.appendChild(makeBtn("/admin", "← Admin Dashboard"));
    left.appendChild(makeBtn("/admin-account", "Account"));
    left.appendChild(makeBtn("/admin-analytics", "Analytics"));
    left.appendChild(makeBtn("/admin-catalog", "Inventory"));

    const right = document.createElement("div");
    right.className = "right";

    const chip = document.createElement("div");
    chip.className = "admin-shell-chip";
    chip.textContent = actor?.email
      ? `Signed in: ${actor.email}${actor.role ? ` • ${actor.role}` : ""}`
      : "Signed in";
    right.appendChild(chip);

    const logout = document.createElement("button");
    logout.className = "btn ghost small";
    logout.type = "button";
    logout.textContent = "Logout";
    logout.addEventListener("click", async () => {
      try {
        if (globalScope.AdminAuth?.logout) {
          await globalScope.AdminAuth.logout();
        } else {
          await fetch("/api/admin/auth_logout", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: "{}"
          });
        }
      } finally {
        window.location.href = "/admin-login";
      }
    });
    right.appendChild(logout);

    wrap.appendChild(left);
    wrap.appendChild(right);
    container.prepend(wrap);
  }

  async function init(options = {}) {
    ensureStyles();
    setLoading(true);

    try {
      let actor = null;

      if (globalScope.AdminAuth?.ensureSignedIn) {
        actor = await globalScope.AdminAuth.ensureSignedIn({
          redirectTo: options.loginUrl || "/admin-login"
        });
      } else {
        const res = await fetch("/api/admin/auth_me", { credentials: "include" });
        if (!res.ok) {
          window.location.href = options.loginUrl || "/admin-login";
          return null;
        }
        const data = await res.json().catch(() => ({}));
        actor = data?.actor || data?.staff || data || null;
      }

      const mount =
        document.querySelector("[data-admin-shell]") ||
        document.querySelector("main") ||
        document.body;

      renderToolbar(mount, actor);
      return actor;
    } finally {
      setLoading(false);
    }
  }

  globalScope.AdminShell = {
    init,
    setLoading
  };
})();
