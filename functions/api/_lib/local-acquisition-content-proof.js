// Build 431 — Local Acquisition & Content Proof.
// Pure read-only prioritizer over bounded first-party traffic, approved proof,
// dated provider evidence and existing local SEO task evidence.

export const LOCAL_CONTENT_TARGETS = [
  { path: "/tillsonburg-auto-detailing", kind: "town", label: "Tillsonburg", proof_keys: ["tillsonburg"] },
  { path: "/woodstock-ingersoll-auto-detailing", kind: "town", label: "Woodstock / Ingersoll", proof_keys: ["woodstock", "ingersoll"] },
  { path: "/simcoe-delhi-auto-detailing", kind: "town", label: "Simcoe / Delhi", proof_keys: ["simcoe", "delhi"] },
  { path: "/port-dover-auto-detailing", kind: "town", label: "Port Dover", proof_keys: ["port dover"] },
  { path: "/norwich-otterville-auto-detailing", kind: "town", label: "Norwich / Otterville", proof_keys: ["norwich", "otterville"] },
  { path: "/zorra-thamesford-embro-auto-detailing", kind: "town", label: "Zorra / Thamesford / Embro", proof_keys: ["zorra", "thamesford", "embro"] },
  { path: "/waterford-vittoria-auto-detailing", kind: "town", label: "Waterford / Vittoria", proof_keys: ["waterford", "vittoria"] },
  { path: "/port-rowan-turkey-point-auto-detailing", kind: "town", label: "Port Rowan / Turkey Point", proof_keys: ["port rowan", "turkey point"] },
  { path: "/ceramic-coating", kind: "service", label: "Ceramic coating", proof_keys: ["ceramic coating", "ceramic"] },
  { path: "/pet-hair-removal", kind: "service", label: "Pet hair removal", proof_keys: ["pet hair removal", "pet hair"] },
  { path: "/odor-removal", kind: "service", label: "Odor removal", proof_keys: ["odor removal", "odour removal", "odor", "odour"] },
  { path: "/headlight-restoration", kind: "service", label: "Headlight restoration", proof_keys: ["headlight restoration", "headlights"] },
  { path: "/paint-correction", kind: "service", label: "Paint correction", proof_keys: ["paint correction"] }
];

const LOW_VIEW_THRESHOLD = 5;

export function buildLocalAcquisitionContentProof(input = {}) {
  const measurement = input.measurement && typeof input.measurement === "object" ? input.measurement : {};
  const pageRows = Array.isArray(input.page_rows) ? input.page_rows : [];
  const proofItems = Array.isArray(input.proof_items) ? input.proof_items : [];
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const pageEvidenceAvailable = input.page_evidence_available !== false;
  const proofEvidenceAvailable = input.proof_evidence_available !== false;
  const tasksEvidenceAvailable = input.tasks_evidence_available !== false;
  const pageSourceTruncated = Boolean(input.page_source_truncated_possible);

  const viewMap = aggregateViews(pageRows);
  const publicProof = proofItems.filter(isGenuinePublicProof);
  const providers = summarizeProviders(measurement.providers || {});

  const pages = LOCAL_CONTENT_TARGETS.map((target) => {
    const views = pageEvidenceAvailable ? Number(viewMap.get(target.path) || viewMap.get(target.path + "/") || 0) : null;
    const proofCount = proofEvidenceAvailable ? countProof(publicProof, target) : null;
    const relatedTasks = tasksEvidenceAvailable ? tasks.filter((task) => taskMatches(task, target) && !isClosedTask(task)).length : null;
    const reasons = [];
    let attention = 0;

    if (!pageEvidenceAvailable) {
      reasons.push("first_party_page_evidence_unavailable");
      attention += 20;
    } else if (views === 0) {
      reasons.push("no_observed_page_views_in_window");
      attention += 35;
    } else if (views <= LOW_VIEW_THRESHOLD) {
      reasons.push("low_observed_page_views_in_window");
      attention += 20;
    }

    if (!proofEvidenceAvailable) {
      reasons.push("genuine_local_proof_evidence_unavailable");
      attention += 20;
    } else if (proofCount === 0) {
      reasons.push("no_current_genuine_public_proof");
      attention += 30;
    }

    if (relatedTasks && relatedTasks > 0) {
      reasons.push("existing_local_seo_task");
      attention += Math.min(15, relatedTasks * 5);
    }

    // Source-copy checks are intentionally performed by the admin client against
    // the same-origin deployed page. This payload never claims duplicate/thin copy.
    reasons.push("deployed_source_review_required");

    return {
      path: target.path,
      kind: target.kind,
      label: target.label,
      observed_views_30d: views,
      genuine_public_proof_count: proofCount,
      related_open_task_count: relatedTasks,
      attention_score: Math.min(100, attention),
      reasons,
      source_review: {
        state: "pending_client_review",
        thin_copy_inferred: false,
        duplicate_copy_inferred: false,
        service_mismatch_inferred: false
      }
    };
  }).sort((a, b) => b.attention_score - a.attention_score || String(a.path).localeCompare(String(b.path)));

  const analyticsState = !pageEvidenceAvailable
    ? "unavailable"
    : pageSourceTruncated
      ? "bounded_truncation_possible"
      : "observed";
  const proofState = !proofEvidenceAvailable ? "unavailable" : "observed";
  const taskState = !tasksEvidenceAvailable ? "unavailable" : "observed";

  return {
    ok: true,
    build: 431,
    mode: "local_acquisition_content_proof",
    generated_at: clean(input.generated_at) || new Date().toISOString(),
    window_days: Number(input.window_days || measurement.window_days || 30),
    evidence: {
      first_party_page_traffic: analyticsState,
      genuine_local_proof: proofState,
      local_seo_tasks: taskState,
      search_console: providers.search_console,
      google_business_profile: providers.google_business_profile,
      page_source_truncated_possible: pageSourceTruncated
    },
    counts: {
      target_pages: pages.length,
      pages_with_observed_views: pages.filter((row) => Number(row.observed_views_30d || 0) > 0).length,
      pages_without_observed_views: pageEvidenceAvailable ? pages.filter((row) => row.observed_views_30d === 0).length : null,
      pages_with_genuine_proof: proofEvidenceAvailable ? pages.filter((row) => Number(row.genuine_public_proof_count || 0) > 0).length : null,
      pages_without_genuine_proof: proofEvidenceAvailable ? pages.filter((row) => row.genuine_public_proof_count === 0).length : null,
      genuine_public_proof_items: proofEvidenceAvailable ? publicProof.length : null,
      open_task_cards: tasksEvidenceAvailable ? tasks.filter((task) => !isClosedTask(task)).length : null
    },
    content_candidates: pages,
    operator_rules: {
      low_view_threshold: LOW_VIEW_THRESHOLD,
      low_view_threshold_is_ranking_benchmark: false,
      source_copy_review_is_heuristic: true,
      provider_evidence_must_be_dated_and_attributed: true,
      one_meaningful_h1_required: true,
      truthful_service_area_claims_required: true,
      canonical_metadata_integrity_required: true
    },
    truth_boundary: {
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      search_console_outcome_inferred_when_missing: false,
      gbp_outcome_inferred_when_missing: false,
      fabricated_review_allowed: false,
      fabricated_location_content_allowed: false,
      customer_identity_exposed: false,
      automatic_content_publishing_allowed: false,
      third_party_provider_mutation_allowed: false,
      customer_outreach_allowed: false,
      ad_spend_mutation_allowed: false,
      dns_mutation_allowed: false,
      schema_authority: false,
      permanent_polling_allowed: false
    }
  };
}

function aggregateViews(rows) {
  const out = new Map();
  for (const row of rows) {
    const path = normalizePath(row?.dimension_value || row?.path);
    if (!path) continue;
    out.set(path, (out.get(path) || 0) + Math.max(0, Number(row?.count || row?.views || 0)));
  }
  return out;
}

function isGenuinePublicProof(item) {
  const publication = clean(item?.publication_status).toLowerCase();
  const proofKind = clean(item?.proof_kind).toLowerCase();
  const consent = clean(item?.consent_status || item?.media_consent_status).toLowerCase();
  const privacy = clean(item?.media_privacy_status || item?.privacy_status).toLowerCase();
  const pair = Boolean(clean(item?.before_url || item?.beforeUrl) && clean(item?.after_url || item?.afterUrl));
  const publicApproved = ["approved_public", "customer_approved_public", "public", "approved"].includes(consent)
    || ["approved_public", "customer_approved_public", "public"].includes(privacy);
  return publication === "published" && proofKind !== "sample" && publicApproved && pair;
}

function countProof(items, target) {
  return items.filter((item) => {
    const source = target.kind === "town"
      ? clean(item?.town || item?.city || item?.location)
      : clean(item?.service || item?.service_label || item?.category);
    const normalized = normalizePhrase(source);
    return target.proof_keys.some((key) => normalized.includes(normalizePhrase(key)));
  }).length;
}

function taskMatches(task, target) {
  const blob = [
    task?.title,
    task?.town,
    task?.service,
    task?.task_type,
    task?.path,
    task?.page_path
  ].map(normalizePhrase).filter(Boolean).join(" ");
  return target.proof_keys.some((key) => blob.includes(normalizePhrase(key)))
    || blob.includes(normalizePhrase(target.path));
}

function isClosedTask(task) {
  const state = clean(task?.status).toLowerCase();
  return ["done", "completed", "closed", "cancelled", "canceled"].includes(state);
}

function summarizeProviders(providers) {
  return {
    search_console: providerEvidenceState(providers?.search_console),
    google_business_profile: providerEvidenceState(providers?.google_business_profile)
  };
}

function providerEvidenceState(source) {
  const state = clean(source?.evidence_state).toLowerCase();
  if (state === "observed_snapshot") return "dated_observed";
  if (state.startsWith("stale_")) return "stale_owner_action";
  return "provider_dependent";
}

function normalizePath(value) {
  const raw = clean(value);
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://rosiedazzlers.ca");
    return (parsed.pathname || "/").replace(/\/+$/, "") || "/";
  } catch {
    return (raw.split("?")[0].split("#")[0] || "/").replace(/\/+$/, "") || "/";
  }
}

function normalizePhrase(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\bodour\b/g, "odor")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}
