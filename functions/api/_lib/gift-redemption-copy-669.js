// Build 669: customer copy advice, never balance or redemption authority.
export const GIFT_REDEMPTION_PREVIEW = "Have a Rosie Dazzlers gift? Enter the code during booking. The estimate is a preview; final checkout confirms any eligible gift amount applied toward the deposit. A gift can have value left after booking. To check remaining value, sign in to view a gift linked to your account, or contact Rosie Dazzlers for help. Service gifts must match the chosen package and vehicle size. No redemption or refund is approved by this message.";

const RULES = [
  ["full_booking_paid_promise", /\b(?:gift\s*(?:cards?|codes?|certificates?|vouchers?)|store\s+credits?)\b.{0,90}\b(?:always\s+pay(?:s)?\s+(?:the\s+)?(?:entire|full)\s+(?:booking|total)|cover(?:s)?\s+(?:the\s+)?entire\s+booking|automatically\s+pay(?:s)?\s+the\s+balance)\b/i],
  ["automatic_full_gift_redemption", /\b(?:gift\s*(?:cards?|codes?|certificates?|vouchers?)|store\s+credits?)\b.{0,95}\b(?:use(?:s)?\s+all\s+(?:the\s+)?remaining\s+(?:balance|value)\s+at\s+booking|fully\s+redeem(?:s|ed)?\s+when\s+booking)\b/i],
  ["remaining_value_forfeiture", /\b(?:unused|leftover|remaining)\s+(?:gift\s+)?(?:balance|credit|value)\b.{0,75}\b(?:disappear(?:s)?|is\s+forfeit(?:ed)?|will\s+be\s+lost|must\s+be\s+used\s+immediately)\b/i],
  ["unqualified_live_balance", /\b(?:gift\s+)?(?:balance|remaining\s+(?:value|credit))\b.{0,85}\b(?:always\s+(?:updates?|accurate|current)|guaranteed\s+real[ -]?time|instantly\s+updates?)\b/i],
  ["unrestricted_balance_check", /\b(?:anyone|everyone|no\s+sign[ -]?in\s+needed)\b.{0,65}\b(?:check|view|see)\b.{0,45}\b(?:gift\s+)?(?:balance|remaining\s+value)\b|\b(?:gift\s+)?(?:balance|remaining\s+value)\b.{0,65}\b(?:anyone\s+can\s+see|without\s+(?:an\s+)?account)\b/i],
  ["gift_code_confirms_appointment", /\b(?:entering|using|redeeming)\s+(?:a\s+|your\s+)?gift\s+code\b.{0,75}\b(?:automatically\s+confirms|guarantees|reserves)\b.{0,20}\b(?:appointment|booking|time\s+slot)\b/i],
  ["unrestricted_service_gift", /\bservice\s+gifts?\b.{0,75}\b(?:any\s+package|any\s+vehicle\s+size|no\s+package\s+restriction|any\s+service\s+without\s+restriction)\b/i],
  ["automatic_gift_cashout", /\b(?:remaining\s+)?(?:gift\s+)?(?:balance|credit|value)\b.{0,65}\b(?:automatically\s+(?:paid|refunded|returned)\s+in\s+cash|always\s+cashed\s+out)\b/i],
  ["ambiguous_total_offset", /\bdollar\s+gifts?\s+deduct\s+from\s+the\s+booking\s+total\b/i]
];

export function redemptionReadable(value) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
    .replace(/\s+/g, " ").trim();
}

export function redemptionRisks(value) {
  const text = redemptionReadable(value);
  return RULES.filter(([, regex]) => regex.test(text)).map(([code]) => code);
}

const scope = /gift|voucher|certificate|credit|redeem|redemption|balance|recipient/i;
function redactedExcerpt(value, code) {
  const text = redemptionReadable(value);
  const at = RULES.find(([name]) => name === code)?.[1].exec(text)?.index ?? 0;
  return text.slice(Math.max(0, at - 35), Math.min(text.length, at + 195))
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\b(?:RD[-_])?[A-Z0-9]{4,}[-_][A-Z0-9-]{4,}\b/gi, "[code]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]").slice(0, 180);
}

export function auditRedemptionFields(value, source) {
  const findings = [];
  const check = (value, field) => {
    for (const code of redemptionRisks(value)) {
      if (findings.length < 50) findings.push({ field, code, excerpt: redactedExcerpt(value, code) });
    }
  };
  const rows = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : null;
  if (rows) {
    rows.slice(0, 100).forEach((row, index) => {
      if (!scope.test(`${row?.category || ""} ${row?.question || ""}`)) return;
      check(row?.question, `rows[${index}].question`);
      check(row?.answer, `rows[${index}].answer`);
    });
    return findings;
  }
  const walk = (node, field, depth, inScope) => {
    if (depth > 7 || findings.length >= 50) return;
    if (typeof node === "string") { if (inScope || scope.test(node)) check(node, field); return; }
    if (!node || typeof node !== "object") return;
    for (const [key, nested] of Object.entries(node).slice(0, 100)) {
      if (/^(?:privacy|analytics|security|consent|marketing)(?:_|$)/i.test(key)) continue;
      walk(nested, `${field}.${key}`, depth + 1, inScope || scope.test(key));
    }
  };
  walk(value, source, 0, /gift|voucher|credit/i.test(source));
  return findings;
}

const REQUIRED_GUIDANCE = {
  "/gifts": [
    ["booking_code_step", /redeem\s+gifts?\s+during\s+booking|gift\s+code\s+(?:at|during)\s+booking|enter\s+(?:the\s+|gift\s+)?code\s+during\s+booking/i, "Explain where to enter a gift code during booking."],
    ["deposit_application_boundary", /gift\s+(?:value|amount)\s+(?:may\s+be\s+)?appl(?:y|ied)\s+(?:toward|to)\s+(?:the\s+)?deposit/i, "Explain that final checkout currently applies gift value toward the deposit, not automatically to the entire booking."],
    ["remaining_value_lookup", /(?:remaining\s+(?:balance|value).{0,100}(?:sign\s+in|account)|(?:sign\s+in|account).{0,100}remaining\s+(?:balance|value))/i, "Explain how to find remaining gift value through an eligible signed-in account or staff assistance."]
  ],
  "/gift-cards": [
    ["redemption_channel", /booking|contact/i, "Explain the booking/contact path for redemption."],
    ["balance_after_use", /remaining\s+(?:value|balance)|check\s+(?:your\s+)?(?:gift\s+)?balance/i, "Explain where customers can check remaining gift value after partial use."]
  ],
  "/booking-planner": [
    ["gift_code_entry", /gift\s+code/i, "The booking wizard must identify its gift-code field."],
    ["deposit_vs_total", /gift\s+(?:amount|value)\s+appl(?:y|ied)\s+(?:toward|to)\s+(?:the\s+)?deposit/i, "Clarify gift application to the deposit in mobile checkout copy."]
  ],
  "/my-account": [
    ["balance_location", /gift\s+(?:balance|certificates?)|remaining/i, "Show where signed-in customers can review their gift balance."],
    ["ownership_scope", /(?:purchaser|recipient).{0,75}(?:balance|gift)|(?:balance|gift).{0,75}(?:purchaser|recipient)/i, "Clarify that the account balance check only works for gifts linked to the signed-in purchaser or recipient."]
  ],
  "/gift-certificate-print": [
    ["remaining_label", /remaining\s+(?:value|balance)|value\s*\/\s*remaining/i, "Identify the remaining value without treating zero as the original face value."],
    ["verify_at_checkout", /final\s+(?:eligible\s+)?(?:amount|balance).{0,75}(?:booking|checkout)|(?:booking|checkout).{0,75}final\s+(?:eligible\s+)?(?:amount|balance)/i, "Explain that printed amounts do not guarantee the final checkout application."]
  ]
};

export function redemptionGuidanceGaps(path, text) {
  const readable = redemptionReadable(text);
  return (REQUIRED_GUIDANCE[path] || []).filter(([, pattern]) => !pattern.test(readable))
    .map(([code, , note]) => ({ code, note }));
}

export function redemptionContractAlignment({ gifts = "", previewAppliesToTotal = true, checkoutDepositCapped = true, printZeroFallsBackToFaceValue = true } = {}) {
  const issues = [];
  if (previewAppliesToTotal && checkoutDepositCapped) {
    issues.push({ code: "pricing_preview_vs_checkout_scope", sources: ["/api/codes/preview", "/api/checkout"], note: "The pricing preview can offset the full service total while final checkout currently applies gift value only up to the deposit. Owner must reconcile the promised redemption amount and customer explanation before changing payment behaviour." });
    if (redemptionRisks(gifts).includes("ambiguous_total_offset")) issues.push({ code: "gift_total_wording_needs_scope", sources: ["/gifts", "/api/checkout"], note: "Public 'Dollar gifts deduct from the booking total' wording needs reconciliation with the current deposit-capped final checkout. Do not claim the entire balance is spent or forfeited." });
  }
  if (printZeroFallsBackToFaceValue) issues.push({ code: "printed_zero_balance_face_value_fallback", sources: ["/gift-certificate-print"], note: "The printable certificate display currently uses a truthy fallback from remaining_cents to face_value_cents. A genuine zero remaining balance can display the original value. Fix its display fallback before relying on printed balance advice; no gift value is changed by this review." });
  return issues;
}
