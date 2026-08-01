import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }

async function handle({ request, env }) {
  try {
    const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const now = new Date();
    const checks = [];
    const warnings = [];

    addCheck(checks, "Supabase service", !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY), "Required for all production workflows.", env.SUPABASE_URL ? "SUPABASE_URL present" : "SUPABASE_URL missing");
    addCheck(checks, "Email notification provider", !!(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL), "Required before customer/staff email notifications can leave the app.", providerLabel(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL));
    addCheck(checks, "SMS notification provider", !!(env.NOTIFICATIONS_SMS_WEBHOOK_URL || env.RECOVERY_SMS_WEBHOOK_URL), "Optional; use only after consent/cost controls are ready.", providerLabel(env.NOTIFICATIONS_SMS_WEBHOOK_URL || env.RECOVERY_SMS_WEBHOOK_URL), true);
    addCheck(checks, "Stripe hosted checkout", !!env.STRIPE_SECRET_KEY, "Required for automated hosted final-balance payment links.", env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY present" : "Stripe key missing");
    addCheck(checks, "PayPal credentials", !!(env.PAYPAL_CLIENT_ID && (env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET)), "Optional final-balance/deposit payment fallback.", env.PAYPAL_CLIENT_ID ? "PayPal client present" : "PayPal not configured", true);
    addCheck(checks, "Job media storage", !!(env.JOB_MEDIA_BUCKET || env.SUPABASE_URL), "Used by live job photos/videos and signed upload URLs.", env.JOB_MEDIA_BUCKET ? `Bucket ${env.JOB_MEDIA_BUCKET}` : "Supabase storage default bucket expected");
    addCheck(checks, "Public assets R2 binding", hasAnyR2Binding(env), "Used by public visual assets and incident/gallery media where configured.", hasAnyR2Binding(env) ? "At least one R2 binding is present" : "No R2 public asset binding detected", true);

    const tables = {};
    const tableQueries = {
      notifications: "notification_events?select=id,event_type,channel,status,attempt_count,last_error,next_attempt_at,created_at&order=created_at.desc&limit=150",
      balances: "final_balance_payment_requests?select=id,booking_id,customer_name,customer_email,status,amount_cents,currency,payment_url,checkout_url,provider,provider_status,external_checkout_id,created_at&order=created_at.desc&limit=150",
      upload_sessions: "live_upload_sessions?select=id,booking_id,filename,status,progress_percent,retry_count,last_error,file_size_bytes,content_type,media_kind,updated_at&order=updated_at.desc&limit=150",
      retention_media: `job_media?select=id,booking_id,kind,stage,retention_policy,retention_expires_at,retention_status,thread_status,storage_bucket,storage_path,media_url,created_at&or=(retention_expires_at.is.null,retention_expires_at.lte.${encodeURIComponent(now.toISOString())})&order=created_at.asc&limit=200`,
      summaries: "completed_job_summaries?select=id,booking_id,status,customer_visible,generated_at,payment_status&order=generated_at.desc&limit=100",
      incidents: "incident_reports?select=id,booking_id,status,decision_status,severity,updated_at&order=updated_at.desc&limit=100",
      test_runs: "production_test_runs?select=id,test_key,status,performed_at,created_at,environment&order=performed_at.desc,created_at.desc&limit=500"
    };
    await Promise.all(Object.entries(tableQueries).map(async ([key, path]) => { const out = await readTable(env, path); tables[key] = out.rows; if (out.warning) warnings.push(`${key}: ${out.warning}`); }));

    const notificationRows = tables.notifications || [];
    const balanceRows = tables.balances || [];
    const uploadRows = tables.upload_sessions || [];
    const retentionRows = (tables.retention_media || []).filter((row) => isRetentionDue(row, now));
    const unresolvedIncidents = (tables.incidents || []).filter((row) => !["resolved","closed","customer_resolved","no_fault"].includes(clean(row.status)) && !["resolved","closed","customer_resolved","no_fault"].includes(clean(row.decision_status)));

    const failedNotifications = notificationRows.filter((row) => ["failed","retry"].includes(clean(row.status)));
    const queuedNotifications = notificationRows.filter((row) => clean(row.status) === "queued");
    const paymentMissingCheckout = balanceRows.filter((row) => !isPaid(row.status) && !row.checkout_url && !row.payment_url);
    const paymentDrafts = balanceRows.filter((row) => ["draft","requested","open","sent"].includes(clean(row.status)) && !isPaid(row.status));
    const weakUploads = uploadRows.filter((row) => ["failed","cancelled","uploading","prepared"].includes(clean(row.status)));
    const testing = summarizeTestRuns(tables.test_runs || []);

    const attention = [];
    if (failedNotifications.length) attention.push(att("urgent", "Notification failures", `${failedNotifications.length} notification event(s) need retry/provider repair.`, "/admin-startup-guide.html#production"));
    if (queuedNotifications.length && !(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL)) attention.push(att("high", "Queued notifications cannot send", "Email provider webhook is not configured.", "/admin-startup-guide.html#production"));
    if (paymentMissingCheckout.length) attention.push(att("high", "Payment links missing", `${paymentMissingCheckout.length} open final-balance request(s) need hosted/manual payment links.`, "/admin-startup-guide.html#production"));
    if (weakUploads.length) attention.push(att("high", "Mobile upload recovery", `${weakUploads.length} upload session(s) need retry, cancellation, or review.`, "/admin-startup-guide.html#production"));
    if (retentionRows.length) attention.push(att("normal", "Retention cleanup review", `${retentionRows.length} job media item(s) are due for retention review.`, "/admin-startup-guide.html#production"));
    if (unresolvedIncidents.length) attention.push(att("urgent", "Unresolved incidents", `${unresolvedIncidents.length} incident(s) still block clean closeout/reviews.`, "/admin-incident-reports.html"));
    if (testing.failed || testing.blocked) attention.push(att("high", "Guided production tests need attention", `${testing.failed} failed and ${testing.blocked} blocked test result(s).`, "/admin-startup-guide.html#tests"));
    if (!testing.last_run_at) attention.push(att("normal", "Run guided production tests", "No Build 212 test results are recorded yet. Use internal test data only.", "/admin-startup-guide.html#tests"));

    const counts = {
      notification_failed: failedNotifications.length,
      notification_queued: queuedNotifications.length,
      final_balance_open: paymentDrafts.length,
      payment_links_missing: paymentMissingCheckout.length,
      upload_sessions_needing_review: weakUploads.length,
      retention_due: retentionRows.length,
      unresolved_incidents: unresolvedIncidents.length,
      completed_summaries: (tables.summaries || []).length,
      production_tests_passed: testing.passed,
      production_tests_failed: testing.failed,
      production_tests_blocked: testing.blocked,
      production_tests_not_started: testing.not_started
    };

    return withCors(json({
      ok:true,
      build:212,
      generated_at:now.toISOString(),
      checks,
      counts,
      attention,
      testing,
      provider_readiness:{
        email_configured: !!(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL),
        sms_configured: !!(env.NOTIFICATIONS_SMS_WEBHOOK_URL || env.RECOVERY_SMS_WEBHOOK_URL),
        stripe_configured: !!env.STRIPE_SECRET_KEY,
        paypal_configured: !!(env.PAYPAL_CLIENT_ID && (env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET)),
        r2_binding_detected: hasAnyR2Binding(env)
      },
      samples:{
        failed_notifications: failedNotifications.slice(0,10),
        payment_links_missing: paymentMissingCheckout.slice(0,10),
        weak_upload_sessions: weakUploads.slice(0,10),
        retention_due: retentionRows.slice(0,10),
        unresolved_incidents: unresolvedIncidents.slice(0,10)
      },
      warnings,
      table_ready:warnings.length===0
    }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not load production reliability report." }, 500));
  }
}

const TEST_KEYS_BUILD212 = ["environment_preflight","notification_delivery","hosted_final_balance_checkout","customer_visibility_privacy","mobile_upload_recovery","proof_completion_gate","incident_review_safety","retention_dry_run","end_to_end_smoke"];
function summarizeTestRuns(rows){ const latest={}; for(const row of rows||[]){const key=String(row.test_key||"").trim();if(key&&!latest[key])latest[key]=row;} const values=Object.values(latest); return {total:TEST_KEYS_BUILD212.length,passed:values.filter(r=>clean(r.status)==="passed").length,failed:values.filter(r=>clean(r.status)==="failed").length,blocked:values.filter(r=>clean(r.status)==="blocked").length,not_started:TEST_KEYS_BUILD212.filter(key=>!latest[key]||clean(latest[key].status)==="not_started").length,last_run_at:values.map(r=>r.performed_at||r.created_at).filter(Boolean).sort().reverse()[0]||null}; }

async function readTable(env, path) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { rows:[], warning:"Supabase env vars are missing." };
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers:serviceHeaders(env) });
    const text = await res.text();
    if (!res.ok) return { rows:[], warning:text.slice(0,260) };
    return { rows: safeJson(text) || [], warning:null };
  } catch (err) { return { rows:[], warning:String(err) }; }
}
function addCheck(checks, label, ok, why, detail, optional=false){ checks.push({ label, ok:!!ok, optional, state:ok?"ok":(optional?"optional":"needs_setup"), why, detail }); }
function providerLabel(url){ if(!url) return "Provider webhook missing"; try{ const u=new URL(url); return `${u.hostname} configured`; }catch{return "Provider webhook configured";} }
function hasAnyR2Binding(env){ return !!(env.ROSIE_PUBLIC_ASSETS_BUCKET || env.PUBLIC_ASSETS_BUCKET || env.R2_PUBLIC_ASSETS_BUCKET || env.ASSETS_BUCKET); }
function clean(v){ return String(v||"").toLowerCase(); }
function isPaid(v){ return /paid|succeeded|complete/.test(clean(v)); }
function isRetentionDue(row, now){ const policy=clean(row.retention_policy); if(["permanent_proof","legal_hold"].includes(policy)) return false; if(["archived","deleted","legal_hold"].includes(clean(row.retention_status))) return false; if(!row.retention_expires_at) return false; return new Date(row.retention_expires_at) <= now; }
function att(urgency,title,detail,target){ return { urgency,title,detail,target }; }
function safeJson(text){ try{return JSON.parse(text);}catch{return null;} }
function corsHeaders(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
