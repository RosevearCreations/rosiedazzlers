// Build 668: advisory gift/voucher/store-credit copy review only. No balance or legal decision authority.
export const GIFT_CREDIT_PREVIEW = "Choosing a Rosie Dazzlers gift? Dollar-value and specific-service gifts may have different conditions. Review the gift type, included value, applicable terms and booking availability before purchase. Contact our team about redemption, remaining value or a credit request; no change or refund is approved by this message.";

export const giftReadable = (value) => String(value ?? "")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
  .replace(/\s+/g, " ").trim();

const RULES = [
  ["blanket_gift_expiry", /\b(?:all|every|any)?\s*(?:gift\s*(?:cards?|certificates?|vouchers?)|dollar\s*gifts?)\s+(?:are\s+)?(?:valid\s+for|expire\s+(?:in|after)|expires?\s+after)\s+(?:only\s+)?(?:one|1|twelve|12)\s*(?:year|months?)\b/i],
  ["blanket_gift_nonrefundable", /\b(?:gift\s*(?:cards?|certificates?|vouchers?)|dollar\s*gifts?)\b.{0,80}\b(?:non[ -]?refundable|no\s+refunds?)\b|\b(?:no\s+refunds?|non[ -]?refundable)\b.{0,60}\b(?:gift\s*(?:cards?|certificates?|vouchers?)|dollar\s*gifts?)\b/i],
  ["gift_value_reduction_fee", /\b(?:gift\s*(?:cards?|certificates?|vouchers?)|store\s+credits?)\b.{0,70}\b(?:dormancy|inactivity|activation|monthly\s+maintenance)\s+fee\b/i],
  ["unqualified_universal_redemption", /\b(?:gift\s*(?:cards?|certificates?|vouchers?)|store\s+credits?)\b.{0,85}\b(?:any\s+service\s+without\s+restriction|always\s+cover\s+every\s+service|accepted\s+anywhere)\b/i],
  ["automatic_cash_conversion", /\b(?:gift\s*(?:cards?|certificates?|vouchers?)|store\s+credits?)\b.{0,70}\b(?:automatically\s+refunded\s+as\s+cash|always\s+redeemable\s+for\s+cash|automatically\s+cashed\s+out)\b/i],
  ["gift_is_confirmed_booking", /\b(?:gift\s*(?:cards?|certificates?|vouchers?)|voucher)\s+(?:purchase|checkout|redemption)\s+(?:automatically|instantly)\s+(?:books|confirms|reserves)\s+(?:your|an?)?\s*appointment\b/i]
];

export function giftCreditCopyRisks(value) {
  const text = giftReadable(value);
  return RULES.filter(([, regex]) => regex.test(text)).map(([code]) => code);
}

const excerpt = (value, code) => {
  const text = giftReadable(value);
  const pattern = RULES.find(([id]) => id === code)?.[1];
  const at = pattern?.exec(text)?.index || 0;
  return text.slice(Math.max(0, at - 40), Math.min(text.length, at + 190))
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[email]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .slice(0, 180);
};
const scope = /gift|voucher|credit|certificate|redemption|redeem|recipient|delivery|expiry|expir|balance/i;

export function auditGiftCreditFields(value, source) {
  const findings = [];
  const check = (text, field) => {
    for (const code of giftCreditCopyRisks(text)) {
      if (findings.length < 50) findings.push({ source, field, code, excerpt: excerpt(text, code) });
    }
  };
  const auditRows = (rows, prefix) => rows.slice(0, 100).forEach((row, i) => {
    if (!scope.test(`${giftReadable(row?.category)} ${giftReadable(row?.question)}`)) return;
    check(row?.question, `${prefix}[${i}].question`);
    check(row?.answer, `${prefix}[${i}].answer`);
  });
  if (Array.isArray(value?.items)) auditRows(value.items, "items");
  else if (Array.isArray(value)) auditRows(value, "rows");
  else if (value && typeof value === "object") {
    const walk = (node, path, depth, inScope) => {
      if (depth > 7 || findings.length >= 50) return;
      if (typeof node === "string") { if (inScope || scope.test(node)) check(node, path); return; }
      if (!node || typeof node !== "object") return;
      for (const [key, child] of Object.entries(node).slice(0, 100)) {
        if (/^(?:privacy|consent|analytics|security|marketing)(?:_|$)/i.test(key)) continue;
        walk(child, `${path}.${key}`, depth + 1, inScope || scope.test(key));
      }
    };
    walk(value, source, 0, /app_management_settings\.(?:gift_delivery_settings|gift_templates|voucher_templates|store_credit_templates)$/.test(source));
  }
  return findings;
}

export function reviewGiftTypeExpiryScope(giftsText, termsText) {
  const gifts = giftReadable(giftsText);
  const terms = giftReadable(termsText);
  if (/\bdollar\s+gifts?\b/i.test(gifts) && /\bservice\s+gifts?\b/i.test(gifts) &&
      /\bgift\s+certificates?\s+(?:are\s+)?valid\s+for\s+(?:one|1)\s+year\b/i.test(gifts + " " + terms)) {
    return { code: "gift_type_expiry_scope_review", sources: ["/gifts", "/terms"], note: "Dollar-value and specific-service gifts are sold, but a broad one-year gift validity statement appears. Ask the owner/qualified adviser to confirm and clarify type-specific terms; no expiry or stored value is changed." };
  }
  return null;
}
