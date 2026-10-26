// Build 670 — advisory customer receipt/certificate/confirmation copy checks, no issuance or payment authority.
export const GIFT_RECEIPT_PREVIEW = "Your gift receipt lookup confirms the issued gift details when the checkout session reference and matching email are verified. Purchasing a gift and confirming a detailing appointment are separate steps. Your printable gift certificate shows the recorded remaining value; enter the code during booking for final eligibility and the amount applied. Booking confirmation is a separate step and depends on verified payment or an approved gift-covered booking path.";

const RULES = [
  ["gift_purchase_is_booking", /\b(?:gift\s*(?:purchase|receipt|checkout|certificate)|purchasing\s+(?:a\s+)?gift)\b.{0,95}\b(?:automatically\s+)?(?:confirms?|guarantees?|reserves?|books?)\b.{0,36}\b(?:appointment|time\s+slot|booking)\b/i],
  ["gift_receipt_confirms_service_payment", /\b(?:gift\s+receipt|certificate\s+receipt)\b.{0,100}\b(?:proves?|guarantees?|confirms?)\b.{0,36}\b(?:full\s+service\s+payment|entire\s+booking\s+paid|all\s+service\s+charges)\b/i],
  ["certificate_guarantees_current_balance", /\b(?:print(?:ed|able)?\s+)?(?:gift\s+)?certificate\b.{0,105}\b(?:always\s+shows?|guarantees?)\b.{0,50}\b(?:live|current|real[ -]?time)\s+(?:balance|value)\b/i],
  ["entire_gift_consumed_by_booking", /\b(?:using|redeeming|entering)\s+(?:the|a|your)?\s*gift\s+code\b.{0,100}\b(?:uses?|redeems?|spends?)\b.{0,35}\b(?:entire|full|all\s+remaining)\s+(?:balance|value|gift)\b/i],
  ["unverified_booking_confirmation", /\b(?:booking|appointment)\s+(?:is\s+)?(?:automatically|instantly)\s+confirmed\b.{0,70}\b(?:gift\s+code|receipt|certificate)\b|\b(?:gift\s+code|receipt|certificate)\b.{0,90}\b(?:automatically|instantly)\s+confirms\s+(?:your\s+)?booking\b/i],
  ["share_checkout_reference", /\b(?:post|share|publish)\s+(?:your\s+)?(?:stripe\s+)?(?:checkout\s+)?session[_ -]?id\b.{0,55}\b(?:publicly|with\s+anyone|online)\b/i],
  ["deposit_due_paid_ambiguous", /\bdeposit\s+due\s*\/\s*paid\b/i]
];

export const receiptReadable = (value) => String(value ?? "")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
  .replace(/\s+/g, " ").trim();

export function receiptCopyRisks(value) {
  const text = receiptReadable(value);
  return RULES.filter(([code, regex]) => {
    const match = regex.exec(text);
    if (!match) return false;
    if ((code === "gift_purchase_is_booking" || code === "unverified_booking_confirmation") &&
      /\b(?:not|never|doesn['’]?t|does\s+not|isn['’]?t)\b.{0,30}\b(?:confirm(?:s|ed)?|guarantee(?:s|d)?|reserve(?:s|d)?|book(?:s|ed)?)\b/i.test(match[0])) return false;
    return true;
  }).map(([code]) => code);
}

function excerpt(value, code) {
  const text = receiptReadable(value);
  const at = RULES.find(([name]) => name === code)?.[1].exec(text)?.index ?? 0;
  return text.slice(Math.max(0, at - 30), Math.min(text.length, at + 205))
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\b(?:cs_(?:test_|live_)?|RD[-_])[A-Za-z0-9_-]+\b/gi, "[reference]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 175);
}

export function auditReceiptFields(value, source) {
  const findings = [];
  const check = (value, field) => {
    for (const code of receiptCopyRisks(value)) {
      if (findings.length < 50) findings.push({ field, code, excerpt: excerpt(value, code) });
    }
  };
  const rows = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : null;
  const scope = /gift|receipt|certificate|voucher|redemption|confirm|balance|payment/i;
  if (rows) {
    rows.slice(0, 100).forEach((row, index) => {
      if (!scope.test(`${row?.category || ""} ${row?.question || ""}`)) return;
      check(row?.question, `rows[${index}].question`);
      check(row?.answer, `rows[${index}].answer`);
    });
    return findings;
  }
  const walk = (node, path, depth, inScope) => {
    if (depth > 7 || findings.length >= 50) return;
    if (typeof node === "string") { if (inScope || scope.test(node)) check(node, path); return; }
    if (!node || typeof node !== "object") return;
    for (const [key, nested] of Object.entries(node).slice(0, 100)) {
      if (/^(?:privacy|analytics|security|consent|marketing)(?:_|$)/i.test(key)) continue;
      walk(nested, `${path}.${key}`, depth + 1, inScope || scope.test(key));
    }
  };
  walk(value, source, 0, /gift|receipt|voucher/i.test(source));
  return findings;
}

const CHECKLIST = {
  "/gifts": [
    ["receipt_lookup_reference", /session[_ -]?id/i, "Explain the checkout session reference needed for receipt lookup."],
    ["receipt_lookup_email", /email/i, "Explain which matching email is required for receipt lookup."],
    ["gift_purchase_not_appointment", /(?:gift\s+purchase|buying\s+a\s+gift).{0,110}(?:not|does\s+not)\s+(?:book|confirm|reserve)\s+(?:an?\s+)?(?:appointment|booking)/i, "Distinguish gift purchase/receipt success from an actual booking confirmation."]
  ],
  "/gift-certificate-print": [
    ["certificate_remaining_value", /remaining\s+value|recorded\s+remaining/i, "Label recorded remaining value clearly; zero must not display the original gift face value."],
    ["certificate_not_booking", /not\s+a\s+booked\s+appointment|not\s+a\s+booking/i, "Clarify that presenting a certificate does not reserve an appointment."],
    ["certificate_final_checkout", /final\s+gift\s+eligibility.{0,90}booking/i, "Explain that final eligibility and amount applied are checked during booking."]
  ],
  "/order-confirmation": [
    ["order_booking_reference", /booking/i, "Show the booking reference."],
    ["separate_payment_status", /(?:payment\s+status|deposit\s+status|deposit\s+(?:due|paid))\b/i, "Distinguish a deposit due from verified payment instead of combining due/paid into one label."]
  ],
  "/gift-cards": [
    ["certificate_redemption_path", /(?:redeem|redemption).{0,110}(?:book|contact)|(?:book|contact).{0,110}(?:redeem|redemption)/i, "Identify the booking/contact redemption path."],
    ["gift_receipt_vs_appointment", /(?:gift\s+purchase|certificate).{0,100}not\s+(?:a\s+)?(?:booked\s+appointment|booking)/i, "Explain that gifting a certificate is distinct from confirming a service appointment."]
  ]
};

export function receiptGuidanceGaps(path, raw) {
  // Inspect public-only markup and scripts. No customer token or gift code is fetched.
  const copy = String(raw || "").slice(0, 170000).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  return (CHECKLIST[path] || []).filter(([, regex]) => !regex.test(copy)).map(([code, , note]) => ({ code, note }));
}

export function receiptDisplayFindings({ printSource = "", deliverySource = "", orderSource = "" } = {}) {
  const findings = [];
  if (/remaining_cents\s*\|\|\s*gift\.face_value_cents/i.test(printSource) || /remaining_cents\s*\|\|\s*gift\.face_value_cents/i.test(deliverySource))
    findings.push({ code: "zero_remaining_falls_back_to_original_value", note: "The printed or e-gift amount can show the original face value when stored remaining value is zero. Treat zero as a real balance and use fallback only when missing." });
  if (/deposit\s+due\s*\/\s*paid/i.test(orderSource))
    findings.push({ code: "unverified_deposit_status_label", note: "An order-confirmation document labels one number 'Deposit due / paid'. A document alone does not distinguish amount owed from verified settlement; owner should approve separate status wording." });
  return findings;
}
