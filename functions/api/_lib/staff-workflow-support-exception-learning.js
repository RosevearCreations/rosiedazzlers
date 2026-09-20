// Build 442 — aggregate-only Staff Workflow & Support Exception Learning.
const URGENCY_RANK = Object.freeze({ urgent: 0, high: 1, normal: 2, low: 3 });

export function buildStaffWorkflowSupportExceptionLearning({
  today = {},
  support = {},
  source_status = {},
  generated_at = null
} = {}) {
  const generatedAt = generated_at || new Date().toISOString();
  const tasks = Array.isArray(today?.items) ? today.items : [];
  const exceptions = Array.isArray(support?.queue) ? support.queue : [];

  const taskGroups = groupTasks(tasks);
  const exceptionGroups = groupExceptions(exceptions);
  const repeatedTasks = taskGroups.filter((row) => row.count >= 2).slice(0, 8);
  const repeatedExceptions = exceptionGroups.filter((row) => row.count >= 2).slice(0, 8);
  const candidates = [
    ...repeatedTasks.map(taskCandidate),
    ...repeatedExceptions.map(exceptionCandidate)
  ].sort(compareCandidates).slice(0, 12);

  const availableSources = Object.values(source_status || {}).filter((row) => row?.available === true).length;
  const restrictedSources = Object.values(source_status || {}).filter((row) => row?.restricted === true).length;
  const totalSources = Object.keys(source_status || {}).length;
  const evidenceStatus = availableSources === 0
    ? "unavailable"
    : availableSources < totalSources
      ? "partial"
      : "observed";

  return {
    build: 442,
    mode: "staff_workflow_support_exception_learning",
    generated_at: generatedAt,
    evidence_status: evidenceStatus,
    staff_workflow: {
      tasks_observed: tasks.length,
      urgency_counts: countUrgency(tasks),
      distinct_task_patterns: taskGroups.length,
      repeated_task_patterns: repeatedTasks.length,
      top_repeated_patterns: repeatedTasks
    },
    support_exceptions: {
      exceptions_observed: exceptions.length,
      severity_counts: countSeverity(exceptions),
      distinct_exception_patterns: exceptionGroups.length,
      repeated_exception_patterns: repeatedExceptions.length,
      top_repeated_patterns: repeatedExceptions
    },
    learning_candidates: candidates,
    source_status: safeSourceStatus(source_status),
    evidence_notes: {
      root_cause_proven: false,
      repeated_count_means: "Multiple current items share the same bounded pattern; this does not establish a common root cause.",
      no_repeat_means: "No repeated pattern in this bounded snapshot does not prove the workflow is friction-free.",
      restricted_source_means: restrictedSources > 0
        ? "At least one retained source is restricted for this actor; missing evidence is not inferred."
        : "No retained source reported a restricted state."
    },
    boundaries: {
      read_only: true,
      aggregate_only: true,
      manual_refresh_only: true,
      root_cause_inference_allowed: false,
      role_ceiling_change_allowed: false,
      automatic_completion_allowed: false,
      automatic_exception_correction_allowed: false,
      silent_posting_allowed: false,
      automatic_outreach_allowed: false,
      provider_transaction_allowed: false,
      permanent_polling_allowed: false,
      customer_identity_exposed: false,
      raw_booking_ids_exposed: false,
      raw_exception_ids_exposed: false
    }
  };
}

function groupTasks(tasks) {
  const groups = new Map();
  for (const item of tasks) {
    const label = clean(item?.title) || "Unlabelled staff task";
    const sourceType = safeToken(item?.source_type) || "generated";
    const key = sourceType + ":" + slug(label);
    const current = groups.get(key) || {
      pattern: key,
      label,
      source_type: sourceType,
      count: 0,
      highest_urgency: "low"
    };
    current.count += 1;
    current.highest_urgency = higherUrgency(current.highest_urgency, clean(item?.urgency).toLowerCase());
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) =>
    b.count - a.count ||
    (URGENCY_RANK[a.highest_urgency] ?? 99) - (URGENCY_RANK[b.highest_urgency] ?? 99) ||
    a.label.localeCompare(b.label)
  );
}

function groupExceptions(exceptions) {
  const groups = new Map();
  for (const item of exceptions) {
    const family = safeToken(item?.family) || "support";
    const state = safeToken(item?.state) || "unknown";
    const source = safeToken(item?.source) || "support_exceptions";
    const severity = normalizeSeverity(item?.severity);
    const key = source + ":" + family + ":" + state;
    const current = groups.get(key) || {
      pattern: key,
      source,
      family,
      state,
      count: 0,
      highest_severity: "info"
    };
    current.count += 1;
    current.highest_severity = higherSeverity(current.highest_severity, severity);
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) =>
    b.count - a.count ||
    severityRank(a.highest_severity) - severityRank(b.highest_severity) ||
    a.pattern.localeCompare(b.pattern)
  );
}

function taskCandidate(row) {
  return {
    area: "staff_task_pattern",
    evidence_state: "observed_repeat",
    occurrence_count: row.count,
    priority: urgencyToPriority(row.highest_urgency),
    pattern: row.pattern,
    finding: row.count + " current needs-attention items share the “" + row.label + "” task pattern.",
    bounded_operator_review: "Open Today Needs Attention and verify whether these are independent jobs or a shared workflow friction before changing any process.",
    root_cause_proven: false,
    automatic_correction_authorized: false
  };
}

function exceptionCandidate(row) {
  return {
    area: "support_exception_pattern",
    evidence_state: row.highest_severity === "hold" ? "provider_dependent" : "observed_repeat",
    occurrence_count: row.count,
    priority: severityToPriority(row.highest_severity),
    pattern: row.pattern,
    finding: row.count + " current support exceptions share the " + row.family + " / " + row.state + " pattern.",
    bounded_operator_review: "Open Support Exceptions and the owning evidence surface. Confirm the repeated evidence before changing configuration or business state.",
    root_cause_proven: false,
    automatic_correction_authorized: false
  };
}

function countUrgency(tasks) {
  const counts = { urgent: 0, high: 0, normal: 0, low: 0 };
  for (const item of tasks) {
    const key = clean(item?.urgency).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
    else counts.normal += 1;
  }
  return counts;
}

function countSeverity(exceptions) {
  const counts = { critical: 0, warning: 0, hold: 0, action: 0, info: 0 };
  for (const item of exceptions) counts[normalizeSeverity(item?.severity)] += 1;
  return counts;
}

function safeSourceStatus(sourceStatus) {
  const out = {};
  for (const [key, value] of Object.entries(sourceStatus || {})) {
    out[safeToken(key) || "unknown"] = {
      available: value?.available === true,
      restricted: value?.restricted === true,
      http_status: Number(value?.http_status) || null,
      error_class: safeToken(value?.error_class) || null
    };
  }
  return out;
}

function compareCandidates(a, b) {
  return priorityRank(a.priority) - priorityRank(b.priority)
    || b.occurrence_count - a.occurrence_count
    || a.pattern.localeCompare(b.pattern);
}

function higherUrgency(a, b) {
  const aa = Object.prototype.hasOwnProperty.call(URGENCY_RANK, a) ? a : "low";
  const bb = Object.prototype.hasOwnProperty.call(URGENCY_RANK, b) ? b : "normal";
  return URGENCY_RANK[bb] < URGENCY_RANK[aa] ? bb : aa;
}

function higherSeverity(a, b) {
  return severityRank(b) < severityRank(a) ? b : a;
}

function normalizeSeverity(value) {
  const severity = clean(value).toLowerCase();
  return ["critical", "warning", "hold", "action", "info"].includes(severity) ? severity : "warning";
}

function severityRank(value) {
  return ({ critical: 0, warning: 1, hold: 2, action: 3, info: 4 })[value] ?? 5;
}

function priorityRank(value) {
  return ({ urgent: 0, high: 1, normal: 2, low: 3 })[value] ?? 4;
}

function urgencyToPriority(value) {
  return ["urgent", "high", "normal", "low"].includes(value) ? value : "normal";
}

function severityToPriority(value) {
  if (value === "critical") return "urgent";
  if (value === "warning" || value === "hold") return "high";
  if (value === "action") return "normal";
  return "low";
}

function safeToken(value) {
  const text = clean(value).toLowerCase();
  return /^[a-z0-9._:-]{1,120}$/.test(text) ? text : null;
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "unknown";
}

function clean(value) {
  return String(value ?? "").trim();
}
