import { serviceHeaders } from "./staff-auth.js";

export const REQUIRED_PROOF_STAGES = ["arrival", "during", "final"];

export async function loadProofMediaStatus(env, bookingId) {
  const result = { required_stages: [...REQUIRED_PROOF_STAGES], counts: { arrival:0, during:0, final:0 }, missing_stages: [], ready_to_complete: false };
  if (!bookingId || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    result.missing_stages = [...REQUIRED_PROOF_STAGES];
    return result;
  }
  const select = "id,stage,kind,visibility,thread_status,review_status,storage_bucket,storage_path,media_url";
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=${select}&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc`, { headers: serviceHeaders(env) });
  if (!res.ok) {
    result.warning = `Could not verify proof media: ${await res.text()}`;
    result.missing_stages = [...REQUIRED_PROOF_STAGES];
    return result;
  }
  const rows = await res.json().catch(() => []);
  for (const row of Array.isArray(rows) ? rows : []) {
    const stage = String(row?.stage || "").toLowerCase();
    if (!REQUIRED_PROOF_STAGES.includes(stage)) continue;
    if (["hidden","removed"].includes(String(row?.thread_status || ""))) continue;
    if (String(row?.review_status || "") === "rejected") continue;
    if (!(row?.media_url || (row?.storage_bucket && row?.storage_path))) continue;
    result.counts[stage] += 1;
  }
  result.missing_stages = REQUIRED_PROOF_STAGES.filter((stage) => result.counts[stage] < 1);
  result.ready_to_complete = result.missing_stages.length === 0;
  return result;
}

export async function upsertProofChecklistStatus(env, bookingId, proof, actor = {}, override = {}) {
  const now = new Date().toISOString();
  const row = {
    booking_id: bookingId,
    checklist_name: "Live detail proof of work",
    status: proof.ready_to_complete ? "ready" : "incomplete",
    required_media_stages: proof.required_stages,
    media_stage_status: proof.counts,
    ready_to_complete: proof.ready_to_complete,
    updated_at: now
  };
  if (override.reason) {
    row.status = "override_ready";
    row.ready_to_complete = true;
    row.completion_override_reason = override.reason;
    row.completion_override_by = actor.id || null;
    row.completion_override_at = now;
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/proof_of_work_checklists?on_conflict=booking_id`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([row])
  });
  return { ok: res.ok, warning: res.ok ? null : await res.text() };
}

// Build 210 compatibility aliases used by connected workflow endpoints.
export async function loadProofOfWorkStatus({ env, bookingId }) {
  const status = await loadProofMediaStatus(env, bookingId);
  return { ...status, ready: status.ready_to_complete, stage_counts: status.counts };
}
export async function saveProofOfWorkStatus({ env, bookingId, status, actor = {}, overrideReason = null }) {
  return upsertProofChecklistStatus(env, bookingId, {
    required_stages: status.required_stages || REQUIRED_PROOF_STAGES,
    counts: status.counts || status.stage_counts || {},
    missing_stages: status.missing_stages || [],
    ready_to_complete: status.ready_to_complete === true || status.ready === true
  }, actor, { reason: overrideReason });
}
