export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const adminPassword = request.headers.get("x-admin-password") || "";
    if (!env.ADMIN_PASSWORD || adminPassword !== env.ADMIN_PASSWORD) {
      return json({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const booking_id = String(body.booking_id || "").trim();
    const detailer_name = String(body.detailer_name || "").trim();

    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const intake = {
      booking_id,

      detailer_name: detailer_name || null,

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

    const existingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=id&booking_id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      { headers }
    );

    if (!existingRes.ok) {
      const text = await existingRes.text();
      return json({ error: `Could not check existing intake. ${text}` }, 500);
    }

    const existingRows = await existingRes.json();
    const existing = Array.isArray(existingRows) ? existingRows[0] : null;

    if (existing?.id) {
      const patchRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/jobsite_intake?id=eq.${encodeURIComponent(existing.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(intake)
        }
      );

      if (!patchRes.ok) {
        const text = await patchRes.text();
        return json({ error: `Could not update intake. ${text}` }, 500);
      }

      const rows = await patchRes.json();
      return json({
        ok: true,
        message: "Job-site intake updated.",
        intake: Array.isArray(rows) ? rows[0] || null : null
      });
    }

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          ...intake,
          created_at: new Date().toISOString()
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not create intake. ${text}` }, 500);
    }

    const rows = await insertRes.json();

    return json({
      ok: true,
      message: "Job-site intake saved.",
      intake: Array.isArray(rows) ? rows[0] || null : null
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function cleanText(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

function toBoolean(value) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function nullableBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  return toBoolean(value);
}

function toNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function cleanStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
