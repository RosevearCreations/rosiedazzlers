import { requireStaffAccess, serviceHeaders, json, cleanText, cleanStringArray, toBoolean, toNullableInteger, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return json({ error: "Valid booking_id is required." }, 400);

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const actor = access.actor || {};
    const intake = {
      booking_id,
      detailer_name: cleanText(body.detailer_name) || actor.full_name || actor.email || null,
      exterior_condition_notes: cleanText(body.exterior_condition_notes),
      interior_condition_notes: cleanText(body.interior_condition_notes),
      existing_damage_notes: cleanText(body.existing_damage_notes),
      valuables_present: nullableBoolean(body.valuables_present),
      valuables_notes: cleanText(body.valuables_notes),
      valuables_photo_urls: cleanStringArray(body.valuables_photo_urls),
      exterior_photo_urls: cleanStringArray(body.exterior_photo_urls),
      interior_photo_urls: cleanStringArray(body.interior_photo_urls),
      damage_photo_urls: cleanStringArray(body.damage_photo_urls),
      keys_collected: toBoolean(body.keys_collected),
      owner_present_for_visual_inspection: toBoolean(body.owner_present_for_visual_inspection),
      water_hookup_located: toBoolean(body.water_hookup_located),
      water_tested: toBoolean(body.water_tested),
      power_hookup_located: toBoolean(body.power_hookup_located),
      power_tested: toBoolean(body.power_tested),
      vehicle_accessible_and_safe: toBoolean(body.vehicle_accessible_and_safe),
      garbage_bag_estimate: cleanText(body.garbage_bag_estimate),
      extra_bag_count: toNullableInteger(body.extra_bag_count),
      extra_debris_charge_possible: nullableBoolean(body.extra_debris_charge_possible),
      extra_charge_notes: cleanText(body.extra_charge_notes),
      owner_name: cleanText(body.owner_name),
      owner_email: cleanText(body.owner_email),
      inspection_acknowledged: nullableBoolean(body.inspection_acknowledged),
      existing_condition_acknowledged: nullableBoolean(body.existing_condition_acknowledged),
      keys_handed_over_acknowledged: nullableBoolean(body.keys_handed_over_acknowledged),
      owner_notes: cleanText(body.owner_notes),
      detailer_pre_job_notes: cleanText(body.detailer_pre_job_notes),
      site_weather_notes: cleanText(body.site_weather_notes),
      intake_complete: cleanText(body.intake_complete),
      updated_at: new Date().toISOString()
    };

    const existingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=id&booking_id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers: serviceHeaders(env) });
    if (!existingRes.ok) return json({ error: `Could not check existing intake. ${await existingRes.text()}` }, 500);
    const existingRows = await existingRes.json().catch(() => []);
    const existing = Array.isArray(existingRows) ? existingRows[0] || null : null;

    if (existing?.id) {
      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?id=eq.${encodeURIComponent(existing.id)}`, {
        method: "PATCH",
        headers: { ...serviceHeaders(env), Prefer: "return=representation" },
        body: JSON.stringify(intake)
      });
      if (!patchRes.ok) return json({ error: `Could not update intake. ${await patchRes.text()}` }, 500);
      const rows = await patchRes.json().catch(() => []);
      return json({ ok: true, message: "Job-site intake updated.", actor: { id: actor.id || null, full_name: actor.full_name || null }, intake: Array.isArray(rows) ? rows[0] || null : null });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{ ...intake, created_at: new Date().toISOString() }])
    });
    if (!insertRes.ok) return json({ error: `Could not create intake. ${await insertRes.text()}` }, 500);
    const rows = await insertRes.json().catch(() => []);
    return json({ ok: true, message: "Job-site intake saved.", actor: { id: actor.id || null, full_name: actor.full_name || null }, intake: Array.isArray(rows) ? rows[0] || null : null });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

function nullableBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  return toBoolean(value);
}
