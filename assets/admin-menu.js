// Build 238 retained complete admin navigation and retained current workbench/preflight routes.
// assets/admin-menu.js
//
// Shared internal admin/detailer navigation.
//
// What this file does:
// - builds a session-aware internal menu for admin/detailer pages
// - shows only links the current actor should see
// - highlights the current page
// - gives the growing internal app a reusable nav instead of hard-coded page links
//
// Expected dependencies:
// - /assets/admin-auth.js
//
// Typical page usage:
// <script src="/assets/admin-auth.js"></script>
// <script src="/assets/admin-menu.js"></script>
// <script>
//   window.AdminMenu.render({
//     currentPage: "admin-booking",
//     mount: document.querySelector("[data-admin-menu-mount]")
//   });
// </script>

(function attachAdminMenu(globalScope) {
  function assertDependency() {
    if (!globalScope.AdminAuth) {
      throw new Error("AdminMenu requires /assets/admin-auth.js to be loaded first.");
    }
  }

  const MENU_ITEMS = [
    {
      key: "admin",
      label: "Dashboard",
      href: "/admin.html",
      description: "Internal home",
      visible: () => true
    },
    {
      key: "admin-today",
      label: "Today Needs Attention",
      href: "/admin-today.html",
      description: "Prioritized owner action queue",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-today")
    },
    {
      key: "admin-booking",
      label: "Bookings",
      href: "/admin-booking.html",
      description: "Search and manage bookings",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-booking")
    },
    {
      key: "admin-leads",
      label: "Leads & Estimates",
      href: "/admin-leads.html",
      description: "Public leads and quote photo uploads",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-leads")
    },
    {
      key: "admin-conversions",
      label: "Conversion Queue",
      href: "/admin-conversions.html",
      description: "Review conversion drafts and create confirmed bookings",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-conversions")
    },
    {
      key: "admin-payments",
      label: "Payments",
      href: "/admin-payments.html",
      description: "Webhook history, receipt queueing, and refund tracking",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-payments")
    },

    {
      key: "admin-media-health",
      label: "Media Health",
      href: "/admin-media-health.html",
      description: "Public image recovery, R2 checks, upload review, and persistent alerts",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-media-health")
    },
    {
      key: "admin-photo-studio",
      label: "Photo Studio",
      href: "/admin-photo-studio.html",
      description: "R2 photo library, alt text, renaming, and card/page assignments",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-photo-studio")
    },
    {
      key: "admin-daip",
      label: "DAIP Test Lab",
      href: "/admin-daip.html",
      description: "Internal-only media-process registry and privacy gate testing",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip")
    },
    {
      key: "admin-daip-media",
      label: "DAIP Media Intake",
      href: "/admin-daip-media.html",
      description: "Private resumable raw photo/video ingestion for Creative Projects",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-media")
    },
    {
      key: "admin-daip-governance",
      label: "DAIP Governance",
      href: "/admin-daip-governance.html",
      description: "Owner decisions and promotion gates; no production media capability",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-governance")
    },
    {
      key: "admin-daip-readiness",
      label: "DAIP Readiness",
      href: "/admin-daip-readiness.html",
      description: "Evidence review for a written private-MVP design only",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-readiness")
    },
    {
      key: "admin-daip-design",
      label: "DAIP Blueprint",
      href: "/admin-daip-design.html",
      description: "Independent review of a written private-MVP proposal; Gate C remains held",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-design")
    },
    {
      key: "admin-water-rules",
      label: "Water Rules",
      href: "/admin-water-rules.html",
      description: "Editable municipal water-use reminders",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-water-rules")
    },

    {
      key: "admin-site-settings",
      label: "Editable Settings",
      href: "/admin-site-settings.html",
      description: "Business profile, policies, templates, navigation, analytics labels, and media requirements",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-site-settings")
    },
    {
      key: "admin-tax-review",
      label: "Tax Review",
      href: "/admin-tax-review.html",
      description: "HST/GST payment review",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-tax-review")
    },
    {
      key: "admin-close",
      label: "Month-End Close",
      href: "/admin-close.html",
      description: "Payment close checklist",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-close")
    },
    {
      key: "admin-seo-tasks",
      label: "SEO Tasks",
      href: "/admin-seo-tasks.html",
      description: "Search Console and local proof tasks",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-seo-tasks")
    },
    {
      key: "admin-content",
      label: "Content Center",
      href: "/admin-content.html",
      description: "FAQ and public help content",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-content")
    },
    {
      key: "admin-blocks",
      label: "Blocks",
      href: "/admin-blocks.html",
      description: "Day and slot capacity",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-blocks")
    },
    {
      key: "admin-progress",
      label: "Progress",
      href: "/admin-progress.html",
      description: "Customer progress updates",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-progress")
    },
    {
      key: "admin-social",
      label: "Social Queue",
      href: "/admin-social.html",
      description: "Review job photos for social posting",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-social")
    },
    {
      key: "admin-jobsite",
      label: "Jobsite",
      href: "/admin-jobsite.html",
      description: "Live field workspace",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-jobsite")
    },
    {
      key: "admin-live",
      label: "Live",
      href: "/admin-live.html",
      description: "Operational live view",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-live")
    },
    {
      key: "admin-staff",
      label: "Staff",
      href: "/admin-staff.html",
      description: "Users and passwords",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-staff")
    },


    {
      key: "admin-docs",
      label: "Docs & Sanity",
      href: "/admin-docs.html",
      description: "Canonical docs, Markdown sanity, and visual placeholder readiness",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-docs")
    },
    {
      key: "admin-ui-health",
      label: "UI & SEO Health",
      href: "/admin-ui-health.html",
      description: "Critical route, CSS, asset, H1, metadata, clean-route, and cache acceptance scanner",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-ui-health")
    },
    {
      key: "admin-runtime-health",
      label: "Runtime & CPU Diagnostics",
      href: "/admin-runtime-health.html",
      description: "Local API failure history, route timing, Ray IDs, and CPU source-risk audit",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-runtime-health")
    },
    {
      key: "admin-app",
      label: "App Management",
      href: "/admin-app.html",
      description: "Roles, screens, feature access",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-app")
    },
    {
      key: "admin-customers",
      label: "Customers",
      href: "/admin-customers.html",
      description: "Profiles and tiers",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-customers")
    },
    {
      key: "admin-promos",
      label: "Promos",
      href: "/admin-promos.html",
      description: "Promo code management",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-promos")
    },
    {
      key: "admin-accounting",
      label: "Accounting",
      href: "/admin-accounting.html",
      description: "Ledger, expenses, payables, tax, exports",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-accounting") || globalScope.AdminAuth.canAccessPage("admin")
    },
    {
      key: "admin-daip-gate-c",
      label: "DAIP Gate C",
      href: "/admin-daip-gate-c.html",
      description: "Technical review and rollback evidence; Gate C remains held",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-gate-c")
    },
    {
      key: "admin-daip-intake-dry-run",
      label: "DAIP Intake Test",
      href: "/admin-daip-intake-dry-run.html",
      description: "Fictional metadata validation; no uploads or storage",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-daip-intake-dry-run")
    },
    {
      key: "admin-inventory-manager",
      label: "Inventory Workbench",
      href: "/admin-inventory-manager.html",
      description: "Spreadsheet, JSON table, gallery and bulk inventory editing",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-inventory-manager") || globalScope.AdminAuth.canAccessPage("admin")
    },
    {
      key: "admin-inventory-posting",
      label: "Inventory Posting",
      href: "/admin-inventory-posting.html",
      description: "Preview, post and reverse booking or project inventory as one audited transaction",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-inventory-posting") || globalScope.AdminAuth.canAccessPage("admin")
    },
    {
      key: "admin-startup-guide",
      label: "Startup Command Center",
      href: "/admin-startup-guide.html",
      description: "All blockers, evidence, production checks, guided tests, and next-20 roadmap in one interface",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-startup-guide") || globalScope.AdminAuth.canAccessPage("admin")
    },
    {
      key: "admin-launch-readiness",
      label: "Launch Readiness",
      href: "/admin-launch-readiness.html",
      description: "Preflight evidence, blockers and controlled go-live checks",
      visible: () => false // Build 239 compatibility route now forwards into Startup Command Center
    },
    {
      key: "admin-creative-projects",
      label: "Creative Projects",
      href: "/admin-creative-projects.html",
      description: "Document the full process and govern all content, commerce, archive, and learning outputs",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-creative-projects")
    },
    {
      key: "admin-roadmap-execution",
      label: "Roadmap Execution",
      href: "/admin-roadmap-execution.html",
      description: "DB-backed next-20 execution queue and DAIP planning policy",
      visible: () => false // Build 239 roadmap is embedded in Startup Command Center
    },
    {
      key: "admin-integrations",
      label: "Connections",
      href: "/admin-integrations.html",
      description: "Social publishing and consent-first analytics configuration status",
      visible: () => globalScope.AdminAuth.canAccessPage("admin-integrations")
    },
    {
      key: "account",
      label: "My Account",
      href: "/admin-account.html",
      description: "My session and password",
      visible: () => globalScope.AdminAuth.isAuthenticated()
    }
];

  function render(options = {}) {
    assertDependency();

    const mount = options.mount || document.querySelector("[data-admin-menu-mount]");
    const currentPage = String(options.currentPage || "").trim();
    const title = options.title || "Internal Menu";

    if (!mount) return;

    const items = MENU_ITEMS.filter((item) => {
      try {
        return item.visible();
      } catch {
        return false;
      }
    });

    mount.innerHTML = "";
    mount.appendChild(buildMenuNode({ items, currentPage, title }));
  }

  function buildMenuNode({ items, currentPage, title }) {
    const wrapper = document.createElement("aside");
    wrapper.className = "admin-menu";

    const style = document.createElement("style");
    style.textContent = `
      .admin-menu {
        border-radius: 18px;
        padding: 16px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 14px 35px rgba(0,0,0,0.18);
      }

      .admin-menu__title {
        margin: 0 0 12px;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #93c5fd;
      }

      .admin-menu__list {
        display: grid;
        gap: 10px;
      }

      .admin-menu__item {
        display: block;
        text-decoration: none;
        color: #f8fafc;
        border-radius: 12px;
        padding: 12px 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        transition: background 0.15s ease, transform 0.05s ease, border-color 0.15s ease;
      }

      .admin-menu__item:hover {
        background: rgba(255,255,255,0.08);
      }

      .admin-menu__item:active {
        transform: translateY(1px);
      }

      .admin-menu__item.is-active {
        background: rgba(37,99,235,0.22);
        border-color: rgba(96,165,250,0.42);
      }

      .admin-menu__label {
        display: block;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .admin-menu__desc {
        display: block;
        color: #cbd5e1;
        font-size: 0.88rem;
        line-height: 1.35;
      }
    `;
    wrapper.appendChild(style);

    const heading = document.createElement("h2");
    heading.className = "admin-menu__title";
    heading.textContent = title;
    wrapper.appendChild(heading);

    const list = document.createElement("nav");
    list.className = "admin-menu__list";
    list.setAttribute("aria-label", title);

    items.forEach((item) => {
      const link = document.createElement("a");
      link.className = "admin-menu__item" + (item.key === currentPage ? " is-active" : "");
      link.href = item.href;

      const label = document.createElement("span");
      label.className = "admin-menu__label";
      label.textContent = item.label;

      const desc = document.createElement("span");
      desc.className = "admin-menu__desc";
      desc.textContent = item.description || "";

      link.appendChild(label);
      link.appendChild(desc);
      list.appendChild(link);
    });

    wrapper.appendChild(list);
    return wrapper;
  }

  globalScope.AdminMenu = {
    render,
    items: MENU_ITEMS.slice()
  };
})(window);
