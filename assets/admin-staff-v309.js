    import { setBrandImages, setFooter } from "/assets/site.js";

    const runtime = window.AdminRuntime;
    let currentPassword = "";
    let staffUsers = [];
    let customerTiers = [];
    let selectedStaffId = "";
    const MODULE_KEYS = ["detailer","operations","admin","it","finance","daip","socials"];
    const ROLE_MODULES = {
      detailer: ["detailer"],
      senior_detailer: ["detailer","operations"],
      operations_manager: ["detailer","operations"],
      accountant: ["finance"],
      it_specialist: ["it"],
      promoter: ["socials"],
      daip_manager: ["daip"],
      admin: [...MODULE_KEYS]
    };

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }
    function setNotice(message, kind = "") {
      const el = document.querySelector("#pageNotice");
      el.className = kind ? `notice ${kind}` : "notice";
      el.textContent = message;
    }
    async function apiPost(url, password, body) {
      const result = await runtime.requestJson(url, { method: "POST", body: body || {}, password: password || undefined });
      if (!result.ok) throw new Error(runtime.normalizeError(result, `Request failed for ${url}`));
      return result.data || {};
    }
    function renderTiers() {
      const box = document.querySelector("#tiersBox");
      box.innerHTML = customerTiers.length
        ? customerTiers.map((tier) => `<div><strong>${escapeHtml(tier.label || tier.code)}</strong> — ${escapeHtml(tier.description || "")}</div>`).join("")
        : "No customer tiers loaded.";
    }
    function syncModuleAccess(row = null, useRoleDefaults = false) {
      const role = document.querySelector("#roleCode").value || "detailer";
      const ceiling = new Set(ROLE_MODULES[role] || []);
      const profile = row?.permissions_profile?.module_access && typeof row.permissions_profile.module_access === "object" ? row.permissions_profile.module_access : {};
      document.querySelectorAll("[data-module-access]").forEach((input) => {
        const key = input.getAttribute("data-module-access");
        const allowed = ceiling.has(key);
        const hasExplicit = Object.prototype.hasOwnProperty.call(profile, key);
        const forcedAdmin = role === "admin";
        input.disabled = !allowed || forcedAdmin;
        input.checked = forcedAdmin ? true : (allowed && (useRoleDefaults || !hasExplicit ? true : profile[key] === true));
        input.closest("label")?.classList.toggle("muted", !allowed);
        input.title = forcedAdmin ? "Administrator accounts are always granted every internal module." : (allowed ? "This role may be granted this module." : `The ${role} role cannot be elevated into this module.`);
      });
    }
    function collectModuleAccess() {
      const out = {};
      document.querySelectorAll("[data-module-access]").forEach((input) => { out[input.getAttribute("data-module-access")] = input.checked === true; });
      return out;
    }
    function fillForm(row) {
      document.querySelector("#staffId").value = row?.id || "";
      document.querySelector("#fullName").value = row?.full_name || "";
      document.querySelector("#email").value = row?.email || "";
      document.querySelector("#roleCode").value = row?.role_code || "detailer";
      document.querySelector("#isActive").value = String(row?.is_active !== false);
      document.querySelector("#canOverride").checked = row?.can_override_lower_entries === true;
      document.querySelector("#canManageBookings").checked = row?.can_manage_bookings === true;
      document.querySelector("#canManageBlocks").checked = row?.can_manage_blocks === true;
      document.querySelector("#canManageProgress").checked = row?.can_manage_progress === true;
      document.querySelector("#canManagePromos").checked = row?.can_manage_promos === true;
      document.querySelector("#canManageStaff").checked = row?.can_manage_staff === true;
      document.querySelector("#employeeCode").value = row?.employee_code || "";
      document.querySelector("#positionTitle").value = row?.position_title || "";
      document.querySelector("#paySchedule").value = row?.pay_schedule || "weekly";
      document.querySelector("#hourlyRateCad").value = row?.hourly_rate_cents != null ? String((Number(row.hourly_rate_cents || 0) / 100).toFixed(2)) : "";
      document.querySelector("#maxHoursPerDay").value = row?.max_hours_per_day != null ? row.max_hours_per_day : 8;
      document.querySelector("#maxHoursPerWeek").value = row?.max_hours_per_week != null ? row.max_hours_per_week : 40;
      document.querySelector("#payrollEnabled").checked = row?.payroll_enabled !== false;
      document.querySelector("#preferredWorkHours").value = typeof row?.preferred_work_hours === 'string' ? row.preferred_work_hours : (row?.preferred_work_hours ? JSON.stringify(row.preferred_work_hours, null, 2) : "");
      document.querySelector("#tipsPayoutNotes").value = row?.tips_payout_notes || "";
      document.querySelector("#payrollNotes").value = row?.payroll_notes || "";
      document.querySelector("#notes").value = row?.notes || "";
      syncModuleAccess(row, !row);
    }
    function renderSelectedStaff() {
      const row = staffUsers.find((s) => s.id === selectedStaffId) || null;
      document.querySelector("#staffTitle").textContent = row?.full_name || "No staff selected";
      document.querySelector("#staffMeta").textContent = row ? `${row.role_code || "detailer"} · ${row.email || "—"}` : "Choose a staff user from the list or create a new one.";
    }
    function clearForm() { selectedStaffId = ""; fillForm(null); renderSelectedStaff(); }
    function renderStaffList() {
      const wrap = document.querySelector("#staffList");
      if (!staffUsers.length) { wrap.innerHTML = `<div class="notice">No staff users found.</div>`; return; }
      wrap.innerHTML = staffUsers.map((row) => `
        <article class="card">
          <div class="kicker">${escapeHtml(row.role_code || "detailer")} · ${row.is_active ? "active" : "inactive"}</div>
          <h3>${escapeHtml(row.full_name || "Unnamed")}</h3>
          <p>${escapeHtml(row.email || "—")}</p><div class="kicker">${escapeHtml(row.position_title || row.pay_schedule || 'pay setup pending')}${row.hourly_rate_cents != null ? ' · $' + escapeHtml((Number(row.hourly_rate_cents || 0) / 100).toFixed(2)) + '/hr' : ''}</div>
          <div class="hr"></div>
          <button class="btn primary" type="button" data-staff-id="${escapeHtml(row.id)}">Edit staff</button>
        </article>`).join("");
      wrap.querySelectorAll("[data-staff-id]").forEach((btn) => {
        btn.addEventListener("click", () => { selectedStaffId = btn.getAttribute("data-staff-id"); fillForm(staffUsers.find((s) => s.id === selectedStaffId) || null); renderSelectedStaff(); });
      });
    }
    function syncSessionMeta(actor) {
      var meta = document.querySelector("#sessionMeta");
      if (!meta) return;
      meta.textContent = runtime.bridgeLabel(actor || window.AdminAuth.getActor(), currentPassword);
    }

    async function refreshStaff() {
      syncSessionMeta();
      const data = await apiPost("/api/admin/staff_list", currentPassword, {});
      staffUsers = Array.isArray(data.staff_users) ? data.staff_users : [];
      customerTiers = Array.isArray(data.customer_tiers) ? data.customer_tiers : [];
      syncSessionMeta(data && data.actor ? data.actor : null);
      renderStaffList(); renderTiers(); renderSelectedStaff();
      document.querySelector("#saveStaffBtn").disabled = false;
      document.querySelector("#newStaffBtn").disabled = false;
      if (selectedStaffId) fillForm(staffUsers.find((s) => s.id === selectedStaffId) || null);
    }
    function collectPayload() {
      return {
        id: document.querySelector("#staffId").value.trim() || null,
        full_name: document.querySelector("#fullName").value.trim(),
        email: document.querySelector("#email").value.trim(),
        role_code: document.querySelector("#roleCode").value,
        is_active: document.querySelector("#isActive").value === "true",
        can_override_lower_entries: document.querySelector("#canOverride").checked,
        can_manage_bookings: document.querySelector("#canManageBookings").checked,
        can_manage_blocks: document.querySelector("#canManageBlocks").checked,
        can_manage_progress: document.querySelector("#canManageProgress").checked,
        can_manage_promos: document.querySelector("#canManagePromos").checked,
        can_manage_staff: document.querySelector("#canManageStaff").checked,
        module_access: collectModuleAccess(),
        employee_code: document.querySelector("#employeeCode").value.trim(),
        position_title: document.querySelector("#positionTitle").value.trim(),
        pay_schedule: document.querySelector("#paySchedule").value,
        hourly_rate_cad: document.querySelector("#hourlyRateCad").value,
        max_hours_per_day: document.querySelector("#maxHoursPerDay").value,
        max_hours_per_week: document.querySelector("#maxHoursPerWeek").value,
        payroll_enabled: document.querySelector("#payrollEnabled").checked,
        preferred_work_hours: document.querySelector("#preferredWorkHours").value.trim(),
        tips_payout_notes: document.querySelector("#tipsPayoutNotes").value.trim(),
        payroll_notes: document.querySelector("#payrollNotes").value.trim(),
        notes: document.querySelector("#notes").value.trim()
      };
    }

    document.addEventListener("DOMContentLoaded", async () => {
      setBrandImages();
      setFooter();
      syncSessionMeta();
      document.querySelector("#roleCode").addEventListener("change", () => syncModuleAccess(null, true));
      document.querySelector("#adminPassword").addEventListener("input", function () {
        currentPassword = document.querySelector("#adminPassword").value.trim();
        syncSessionMeta();
        syncSessionMeta();
      });
      document.querySelector("#adminForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        currentPassword = document.querySelector("#adminPassword").value.trim();
        try { setNotice("Loading staff users…"); await refreshStaff(); setNotice("Staff users loaded.", "ok"); }
        catch (err) { setNotice(err.message || "Could not load staff users.", "bad"); }
      });
      document.querySelector("#staffForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        try { setNotice("Saving staff user…"); await apiPost("/api/admin/staff_save", currentPassword, collectPayload()); await refreshStaff(); setNotice("Staff user saved.", "ok"); }
        catch (err) { setNotice(err.message || "Could not save staff user.", "bad"); }
      });
      document.querySelector("#newStaffBtn").addEventListener("click", () => { clearForm(); setNotice("Ready to create a new staff user."); });
      await window.AdminPageInit.init({
        pageKey: "admin-staff",
        onReady: async ({ actor }) => {
          syncSessionMeta(actor);
          document.querySelector("#adminForm").requestSubmit();
        }
      });
    });