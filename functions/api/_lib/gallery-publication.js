// Build 283 — one fail-closed authority for Gallery publication and real-proof eligibility.

const PUBLIC_APPROVALS = new Set([
  "approved_public",
  "customer_approved_public",
  "public",
  "approved",
]);

const BLOCKED_APPROVALS = new Set([
  "rejected",
  "private",
  "approved_private",
  "pending",
  "pending_review",
  "needs_review",
  "needs_blur",
  "hidden",
]);

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function normalizeConsent(value) {
  const raw = cleanText(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const aliases = {
    customer_public: "customer_approved_public",
    customer_approved: "customer_approved_public",
    approved_customer: "customer_approved_public",
    public_approved: "approved_public",
    approved_for_public: "approved_public",
    public_ok: "approved_public",
    ok_public: "approved_public",
    needs_review_public: "needs_review",
    review: "pending_review",
  };
  return aliases[raw] || raw;
}

export function normalizePublicationStatus(value) {
  const raw = cleanText(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const aliases = {
    public: "published",
    publish: "published",
    live: "published",
    hidden: "unpublished",
    private: "unpublished",
    review: "draft",
    pending: "draft",
  };
  return aliases[raw] || raw || "draft";
}

export function galleryPublishEligibility(item) {
  const blockers = [];
  const beforeUrl = cleanText(item?.before_url);
  const afterUrl = cleanText(item?.after_url);
  const consent = normalizeConsent(item?.consent_status);
  const privacy = normalizeConsent(item?.media_privacy_status);
  const sample = consent === "sample" || cleanText(item?.proof_kind).toLowerCase() === "sample";

  if (!cleanText(item?.title)) blockers.push("title is required");
  if (!cleanText(item?.service)) blockers.push("service is required");
  if (!cleanText(item?.town || item?.location)) blockers.push("town/location is required");
  if (!beforeUrl) blockers.push("before media is required");
  if (!afterUrl) blockers.push("after media is required");

  if (sample) {
    if (consent !== "sample") blockers.push("sample rows must be marked sample");
    if (!PUBLIC_APPROVALS.has(privacy)) blockers.push("sample media privacy must be approved_public");
  } else {
    if (!PUBLIC_APPROVALS.has(consent)) blockers.push("customer/public-use consent is not approved");
    if (!PUBLIC_APPROVALS.has(privacy)) blockers.push("media privacy review is not approved for public use");
  }

  if (BLOCKED_APPROVALS.has(consent)) blockers.push(`consent status ${consent} blocks publication`);
  if (BLOCKED_APPROVALS.has(privacy)) blockers.push(`privacy status ${privacy} blocks publication`);

  return { eligible: blockers.length === 0, blockers, sample };
}

export function galleryProofEligibility(item) {
  const publish = galleryPublishEligibility(item);
  const blockers = [...publish.blockers];
  const publicationStatus = normalizePublicationStatus(item?.publication_status);

  if (publish.sample) blockers.push("sample/fallback media is not real Rosie proof");
  if (publicationStatus !== "published") blockers.push("gallery row is not published");
  if (!cleanText(item?.vehicle_label)) blockers.push("vehicle type/label is required for proof");
  if (!cleanText(item?.condition_summary)) blockers.push("condition summary is required for proof");
  if (!cleanText(item?.problem)) blockers.push("problem statement is required for proof");
  if (!cleanText(item?.process)) blockers.push("process statement is required for proof");
  if (!cleanText(item?.result)) blockers.push("result statement is required for proof");

  return { eligible: blockers.length === 0, blockers, publication_status: publicationStatus };
}

export function isGalleryPublished(item) {
  if (normalizePublicationStatus(item?.publication_status) !== "published") return false;
  return galleryPublishEligibility(item).eligible;
}

export function galleryApprovalStatus(item) {
  const consent = normalizeConsent(item?.consent_status);
  const privacy = normalizeConsent(item?.media_privacy_status);

  if (consent === "rejected" || privacy === "rejected") return "rejected";
  if (["private", "approved_private"].includes(consent) || ["private", "approved_private"].includes(privacy)) return "private";
  if (consent === "hidden" || privacy === "hidden") return "hidden";
  if (consent === "sample") return "sample";
  if (PUBLIC_APPROVALS.has(consent) && PUBLIC_APPROVALS.has(privacy)) return "approved";
  return "pending";
}
