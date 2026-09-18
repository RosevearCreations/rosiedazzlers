// Build 418 — Backup, Restore & Accountant Export Operational Proof
// Authenticated, read-only evidence composition. No restore, export generation or business mutation.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { listLaunchEvidence } from "../_lib/launch-readiness-evidence.js";
import { buildFinanceCloseAcceptanceSnapshot } from "../_lib/accounting-finance-close-acceptance.js";
import { buildRecoveryExportOperationalProof } from "../_lib/recovery-export-operational-proof.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const url = new URL(request.url);
  const now = new Date();
  const month = clamp(url.searchParams.get("month"), 1, 12, now.getMonth() + 1);
  const year = clamp(url.searchParams.get("year"), 2020, 2100, now.getFullYear());

  const [launchResult, financeResult] = await Promise.all([
    loadLaunchEvidence(env),
    loadFinanceAcceptance(env, { month, year })
  ]);

  const proof = buildRecoveryExportOperationalProof({
    launch_evidence: launchResult.items,
    finance_acceptance: financeResult.acceptance,
    generated_at: new Date().toISOString()
  });

  return json({
    ok: true,
    build: 418,
    authority: "backup_restore_accountant_export_operational_proof",
    period: { month, year },
    source_status: {
      launch_evidence: {
        available: launchResult.available,
        warning: launchResult.warning || null
      },
      finance_acceptance: {
        available: financeResult.available,
        warning: financeResult.warning || null
      }
    },
    proof
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" }
  });
}

async function loadLaunchEvidence(env) {
  try {
    const result = await listLaunchEvidence(env);
    return {
      available: result?.ready === true,
      items: Array.isArray(result?.items) ? result.items : [],
      warning: result?.warning || null
    };
  } catch (error) {
    return { available: false, items: [], warning: error?.message || "Launch evidence is unavailable." };
  }
}

async function loadFinanceAcceptance(env, period) {
  try {
    const acceptance = await buildFinanceCloseAcceptanceSnapshot(env, period);
    return { available: true, acceptance, warning: null };
  } catch (error) {
    return {
      available: false,
      acceptance: null,
      warning: error?.message || "Finance close/accountant-export acceptance is unavailable."
    };
  }
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
