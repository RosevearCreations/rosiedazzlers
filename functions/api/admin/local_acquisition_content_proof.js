// Build 431 — authenticated, read-only Local Acquisition & Content Proof workbench.
import { onRequestGet as getMeasurementReport } from "./local_search_measurement_report.js";
import { serviceHeaders } from "../_lib/staff-auth.js";
import { buildLocalAcquisitionContentProof } from "../_lib/local-acquisition-content-proof.js";

const WINDOW_DAYS = 30;
const PAGE_ROW_LIMIT = 2000;
const TASK_LIMIT = 200;

export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }
export async function onRequestPatch() { return methodNotAllowed(); }
export async function onRequestDelete() { return methodNotAllowed(); }
export async function onRequestPut() { return methodNotAllowed(); }
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function handle({ request, env }) {
  try {
    // Reuse the retained Build 414 staff authorization and provider/measurement authority.
    const reportRequest = new Request(request.url, { method: "GET", headers: request.headers });
    const reportResponse = await getMeasurementReport({ request: reportRequest, env });
    const measurement = await reportResponse.json().catch(() => null);
    if (!reportResponse.ok || !measurement?.ok) {
      return json({
        ok: false,
        build: 431,
        mode: "local_acquisition_content_proof",
        error: measurement?.error || "Local-search measurement authority is unavailable."
      }, reportResponse.status || 503);
    }

    if (!hasSupabaseConfig(env)) {
      const workbench = buildLocalAcquisitionContentProof({
        measurement,
        page_rows: [],
        proof_items: [],
        tasks: [],
        page_evidence_available: false,
        proof_evidence_available: false,
        tasks_evidence_available: false,
        generated_at: new Date().toISOString(),
        window_days: WINDOW_DAYS
      });
      return json({ ...workbench, warning: "Supabase evidence is unavailable; content prioritization remains fail-closed." });
    }

    const headers = serviceHeaders(env);
    const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
    const [pageRes, galleryRes, taskRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_dimension_daily_rollups?select=dimension_value,count&dimension_type=eq.page_path&rollup_date=gte.${encodeURIComponent(since)}&limit=${PAGE_ROW_LIMIT}`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.before_after_gallery&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/local_seo_task_cards?select=*&limit=${TASK_LIMIT}`, { headers })
    ]);

    const pageRows = pageRes.ok ? await pageRes.json().catch(() => []) : [];
    const galleryRows = galleryRes.ok ? await galleryRes.json().catch(() => []) : [];
    const taskRows = taskRes.ok ? await taskRes.json().catch(() => []) : [];
    const gallery = Array.isArray(galleryRows) && galleryRows[0]?.value && typeof galleryRows[0].value === "object"
      ? galleryRows[0].value
      : {};
    const proofItems = Array.isArray(gallery?.items) ? gallery.items : [];

    const workbench = buildLocalAcquisitionContentProof({
      measurement,
      page_rows: Array.isArray(pageRows) ? pageRows : [],
      proof_items: proofItems,
      tasks: Array.isArray(taskRows) ? taskRows : [],
      page_evidence_available: pageRes.ok,
      proof_evidence_available: galleryRes.ok,
      tasks_evidence_available: taskRes.ok,
      page_source_truncated_possible: pageRes.ok && Array.isArray(pageRows) && pageRows.length >= PAGE_ROW_LIMIT,
      generated_at: new Date().toISOString(),
      window_days: WINDOW_DAYS
    });

    return json({
      ...workbench,
      source_rows: {
        page_rollups_read: Array.isArray(pageRows) ? pageRows.length : 0,
        gallery_items_read: proofItems.length,
        task_cards_read: Array.isArray(taskRows) ? taskRows.length : 0
      },
      source_failures: {
        page_rollups: pageRes.ok ? null : "unavailable",
        gallery: galleryRes.ok ? null : "unavailable",
        task_cards: taskRes.ok ? null : "unavailable"
      }
    });
  } catch (error) {
    return json({
      ok: false,
      build: 431,
      mode: "local_acquisition_content_proof",
      error: safeError(error)
    }, 503);
  }
}

function methodNotAllowed() {
  return json({
    ok: false,
    build: 431,
    mutation_authority: false,
    error: "Build 431 is read-only."
  }, 405);
}

function hasSupabaseConfig(env) {
  return Boolean(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}
function safeError(error) {
  return String(error?.message || error || "Local acquisition content proof is unavailable.")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 500);
}
function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: corsHeaders() });
}
