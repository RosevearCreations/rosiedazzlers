import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_HOSTS = new Set(["amazon.ca", "amazon.com", "www.amazon.ca", "www.amazon.com", "a.co", "amzn.to"]);
const AMAZON_DESTINATION_HOSTS = new Set(["amazon.ca", "amazon.com", "www.amazon.ca", "www.amazon.com"]);
const SHORT_HOSTS = new Set(["a.co", "amzn.to"]);
const MAX_HTML_BYTES = 1_500_000;
const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; RosieDazzlersInventoryImporter/2.0; +https://rosiedazzlers.ca)",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
  "Accept-Language": "en-CA,en;q=0.9",
};

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}
export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return withCors(access.response);

    const raw = extractHttpsUrl(String(body?.url || "").trim());
    if (!raw) return withCors(json({ error: "A supplier product URL is required." }, 400));

    let inputUrl;
    try {
      inputUrl = new URL(raw);
    } catch {
      return withCors(json({ error: "Enter a valid https product URL." }, 400));
    }
    if (inputUrl.protocol !== "https:") {
      return withCors(json({ error: "Only https supplier links are accepted." }, 400));
    }
    if (!ALLOWED_HOSTS.has(inputUrl.hostname.toLowerCase())) {
      return withCors(
        json(
          {
            error:
              "Supplier-link import currently supports Amazon.ca, Amazon.com, a.co, and amzn.to links. Other suppliers should use the same review-first adapter contract when added.",
          },
          400,
        ),
      );
    }

    const page = await fetchAmazonProductPage(inputUrl);
    const canonical = page.canonicalUrl;
    const asin = page.asin;
    const duplicate = await findDuplicate(env, canonical, asin);
    const meta = extractMetadata(page.html, canonical, asin);
    const classification = classify(meta.title, meta.description);
    const isCad = meta.currency === "CAD" || new URL(canonical).hostname.endsWith("amazon.ca");
    const costCad = meta.price != null && isCad ? meta.price : null;
    const priceNote =
      meta.price == null
        ? ""
        : isCad
          ? `Supplier page price observed as CAD ${formatMoney(meta.price)}. Confirm tax, shipping, coupons, and final paid cost before saving.`
          : `Supplier page price observed as ${meta.currency || "USD"} ${formatMoney(meta.price)}. CAD cost was intentionally left blank; convert and review the actual Canadian landed cost before saving.`;

    const draftName = meta.title || titleFromUrl(canonical) || (asin ? `Amazon item ${asin}` : "Amazon item");
    const draft = {
      source_provider: "amazon",
      source_url: canonical,
      resolved_source_url: page.resolvedUrl,
      amazon_url: canonical,
      amazon_asin: asin || null,
      name: draftName,
      item_key: makeKey(draftName || asin || "amazon_item"),
      item_type: classification.item_type,
      category: classification.category,
      subcategory: classification.subcategory,
      preferred_vendor: "Amazon",
      vendor_sku: asin || null,
      image_url: meta.image || null,
      cost_cad: costCad,
      source_price: meta.price,
      source_currency: meta.currency || (new URL(canonical).hostname.endsWith("amazon.ca") ? "CAD" : "USD"),
      unit_label: classification.unit_label,
      reuse_policy: classification.reuse_policy,
      reorder_point: classification.item_type === "consumable" ? 1 : 0,
      reorder_qty: 1,
      qty_on_hand: 1,
      amazon_brand: meta.brand || null,
      amazon_title: meta.title || null,
      amazon_category: meta.category || null,
      description: meta.description || null,
      notes: [
        meta.description ? `Imported description: ${meta.description}` : "",
        priceNote,
        `Supplier-link draft created ${new Date().toISOString().slice(0, 10)}. Review all fields before saving.`,
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const warnings = [page.warning, meta.warning].filter(Boolean);
    const parseStatus = meta.title || meta.image || meta.price != null ? "parsed" : page.html ? "partial" : "partial";
    await writeAudit(env, {
      url: canonical,
      provider: "amazon",
      asin,
      status: parseStatus,
      warning: warnings.join(" ") || null,
      duplicate_item_key: duplicate?.item_key || null,
      actor: access.actor,
    });

    return withCors(
      json({
        ok: true,
        draft,
        duplicate: duplicate || null,
        warning: warnings.join(" ") || null,
        review_required: true,
        resolved_url: page.resolvedUrl,
        canonical_url: canonical,
        fetch_status: page.status,
        metadata_source: meta.source,
        extracted: {
          title: Boolean(meta.title),
          image: Boolean(meta.image),
          price: meta.price != null,
          currency: meta.currency || null,
          brand: Boolean(meta.brand),
          category: Boolean(meta.category),
        },
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        message: "catalog supplier link preview failed",
        error: message,
        path: requestUrl.pathname,
      }),
    );
    return withCors(
      json(
        {
          error: "The supplier link could not be previewed. The item was not saved.",
          detail: safePublicError(message),
          retryable: true,
        },
        500,
      ),
    );
  }
}

function extractHttpsUrl(value) {
  if (!value) return "";
  const match = value.match(/https:\/\/[^\s<>"']+/i);
  return (match?.[0] || value).replace(/[),.;]+$/, "");
}

async function fetchAmazonProductPage(inputUrl) {
  const inputHost = inputUrl.hostname.toLowerCase();
  const initialAsin = extractAsin(inputUrl.href);
  const shouldResolveFirst = SHORT_HOSTS.has(inputHost) || !initialAsin;
  let firstUrl = inputUrl.href;
  if (!shouldResolveFirst && initialAsin) firstUrl = canonicalAmazonUrl(inputUrl, initialAsin);

  let response;
  let html = "";
  let warning = "";
  try {
    response = await fetch(firstUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    const resolved = new URL(response.url || firstUrl);
    const resolvedHost = resolved.hostname.toLowerCase();
    if (!AMAZON_DESTINATION_HOSTS.has(resolvedHost)) {
      throw new Error(`Amazon share link resolved to an unsupported host (${resolvedHost}).`);
    }
    if (response.ok) {
      html = await readTextLimited(response, MAX_HTML_BYTES);
    } else {
      warning = `Amazon returned HTTP ${response.status}. A partial draft was created without trusting missing page metadata.`;
    }

    const resolvedAsin = extractAsin(resolved.href) || initialAsin;
    const canonical = canonicalAmazonUrl(resolved, resolvedAsin);
    return {
      html,
      warning,
      status: response.status,
      resolvedUrl: resolved.href,
      canonicalUrl: canonical,
      asin: resolvedAsin,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fallbackAsin = initialAsin;
    if (!fallbackAsin && SHORT_HOSTS.has(inputHost)) {
      throw new Error(`Amazon short link could not be resolved: ${message}`);
    }
    return {
      html: "",
      warning: `Amazon page could not be read: ${message}. A review-only draft was created from the URL/ASIN where possible.`,
      status: null,
      resolvedUrl: inputUrl.href,
      canonicalUrl: canonicalAmazonUrl(inputUrl, fallbackAsin),
      asin: fallbackAsin,
    };
  }
}

async function readTextLimited(response, limitBytes) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  try {
    while (total < limitBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      const remaining = limitBytes - total;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      total += chunk.byteLength;
      text += decoder.decode(chunk, { stream: total < limitBytes });
      if (chunk.byteLength < value.byteLength) break;
    }
    text += decoder.decode();
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The upstream may already be closed. Nothing else to do.
    }
  }
  return text;
}

function canonicalAmazonUrl(url, asin = extractAsin(url.href)) {
  const host = url.hostname.toLowerCase().endsWith("amazon.com") ? "www.amazon.com" : "www.amazon.ca";
  if (asin) return `https://${host}/dp/${asin}`;
  if (AMAZON_DESTINATION_HOSTS.has(url.hostname.toLowerCase())) {
    return `https://${host}${url.pathname || "/"}`;
  }
  return url.href;
}

function extractAsin(value) {
  const text = String(value || "");
  const match =
    text.match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/)([A-Z0-9]{10})(?:[/?]|$)/i) ||
    text.match(/[?&](?:asin|ASIN)=([A-Z0-9]{10})(?:&|$)/i) ||
    text.match(/\b([A-Z0-9]{10})\b/i);
  return match ? match[1].toUpperCase() : null;
}

// Accept either pick(html, [regex1, regex2]) or pick(html, regex1, regex2).
// Build 247 accidentally assumed only the first shape, which caused "patterns is not iterable".
function pick(html, ...patterns) {
  const list = patterns.flatMap((entry) => (Array.isArray(entry) ? entry : [entry])).filter(Boolean);
  for (const pattern of list) {
    if (!(pattern instanceof RegExp)) continue;
    const match = String(html || "").match(pattern);
    if (match?.[1]) return decode(match[1]).trim();
  }
  return "";
}

function extractMetadata(html, url, asin) {
  if (!html) {
    return {
      title: "",
      image: "",
      description: "",
      price: null,
      currency: null,
      brand: "",
      category: "",
      asin,
      url,
      source: "url_only",
      warning: "Amazon page metadata was unavailable; review the draft manually.",
    };
  }

  const jsonLd = extractProductJsonLd(html);
  const meta = extractMetaTags(html);
  const title = cleanAmazonTitle(
    firstNonEmpty(
      jsonLd?.name,
      meta["og:title"],
      meta["twitter:title"],
      pick(html, /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i),
      pick(html, /<title[^>]*>([^<]+)/i),
    ),
  );
  const image = firstNonEmpty(
    jsonLd?.image,
    meta["og:image"],
    meta["twitter:image"],
    pick(html, /["']hiRes["']\s*:\s*["']([^"']+)/i),
    pick(html, /["']large["']\s*:\s*["']([^"']+)/i),
  );
  const description = firstNonEmpty(
    jsonLd?.description,
    meta.description,
    meta["og:description"],
    meta["twitter:description"],
  ).slice(0, 1200);
  const priceRaw = firstNonEmpty(
    jsonLd?.price,
    meta["product:price:amount"],
    pick(
      html,
      /["']price["']\s*:\s*["']?([0-9]+(?:\.[0-9]{1,2})?)/i,
      /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*(?:C?\$|US\$)?\s*([0-9,.]+)/i,
    ),
  ).replace(/,/g, "");
  const currency = normalizeCurrency(
    firstNonEmpty(jsonLd?.currency, meta["product:price:currency"], pick(html, /["']priceCurrency["']\s*:\s*["']([^"']+)/i)),
    url,
  );
  const brand = firstNonEmpty(
    jsonLd?.brand,
    meta["product:brand"],
    pick(
      html,
      /["']brand["']\s*:\s*["']([^"']+)/i,
      /<a[^>]+id=["']bylineInfo["'][^>]*>([\s\S]*?)<\/a>/i,
    ),
  )
    .replace(/^Visit the\s+/i, "")
    .replace(/\s+Store$/i, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  const category = firstNonEmpty(
    jsonLd?.category,
    meta["product:category"],
    pick(html, /["']category["']\s*:\s*["']([^"']+)/i),
  );
  const price = priceRaw && Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : null;
  const source = jsonLd ? "json_ld+meta" : "html_meta";
  return { title, image, description, price, currency, brand, category, asin, url, source, warning: "" };
}

function extractMetaTags(html) {
  const result = {};
  const tags = String(html || "").match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gi)) {
      attrs[match[1].toLowerCase()] = decode(match[3]);
    }
    const key = String(attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (key && attrs.content && result[key] == null) result[key] = attrs.content.trim();
  }
  return result;
}

function extractProductJsonLd(html) {
  const blocks = String(html || "").match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of blocks.slice(0, 30)) {
    const raw = block.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    if (!raw || raw.length > 500_000) continue;
    try {
      const parsed = JSON.parse(raw);
      const product = findJsonLdProduct(parsed);
      if (!product) continue;
      const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers || {};
      const brandValue = typeof product.brand === "string" ? product.brand : product.brand?.name;
      const imageValue = Array.isArray(product.image) ? product.image[0] : typeof product.image === "object" ? product.image?.url : product.image;
      return {
        name: cleanText(product.name, 400),
        image: cleanText(imageValue, 1500),
        description: cleanText(product.description, 2000),
        brand: cleanText(brandValue, 300),
        category: cleanText(product.category, 300),
        price: cleanText(offers?.price ?? offers?.lowPrice ?? "", 60),
        currency: cleanText(offers?.priceCurrency || "", 12),
      };
    } catch {
      // Amazon sometimes emits non-JSON script fragments; continue to HTML metadata fallbacks.
    }
  }
  return null;
}

function findJsonLdProduct(value, depth = 0) {
  if (depth > 8 || value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonLdProduct(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  const type = value["@type"];
  if ((Array.isArray(type) && type.some((x) => String(x).toLowerCase() === "product")) || String(type || "").toLowerCase() === "product") {
    return value;
  }
  if (value["@graph"]) {
    const found = findJsonLdProduct(value["@graph"], depth + 1);
    if (found) return found;
  }
  for (const child of Object.values(value)) {
    const found = findJsonLdProduct(child, depth + 1);
    if (found) return found;
  }
  return null;
}

function normalizeCurrency(value, url) {
  const code = String(value || "").trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) return code;
  try {
    return new URL(url).hostname.endsWith("amazon.ca") ? "CAD" : "USD";
  } catch {
    return null;
  }
}

function classify(title, description) {
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  const tool = /polisher|extractor|pressure washer|steam cleaner|camera|tripod|light|compressor|generator|drill|vacuum|blower|machine|charger|battery|brush set/.test(text);
  const chemical = /soap|shampoo|cleaner|compound|polish|wax|ceramic|coating|spray|degreaser|dressing|solvent/.test(text);
  const disposable = /microfiber|towel|glove|tape|pad|cloth|wipe|filter|bottle|bag|mask/.test(text);
  const item_type = tool && !chemical && !disposable ? "tool" : "consumable";
  let category = tool ? "tools and equipment" : "shop supplies";
  if (chemical) category = "cleaning liquids";
  else if (/camera|tripod|light/.test(text)) category = "media equipment";
  else if (/microfiber|towel|cloth/.test(text)) category = "microfiber towels";
  else if (/pad|polisher|compound|polish/.test(text)) category = "pads and polishers";
  else if (/glove|mask|safety/.test(text)) category = "safety gear";
  return {
    item_type,
    category,
    subcategory: tool ? "equipment" : "consumable",
    unit_label: /pack|set|kit/.test(text) ? "pack" : "each",
    reuse_policy: item_type === "tool" ? "never_reuse" : "reorder",
  };
}

async function findDuplicate(env, url, asin) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: "application/json",
  };
  const clauses = [];
  if (asin) clauses.push(`amazon_asin.eq.${encodeURIComponent(asin)}`);
  if (url) clauses.push(`amazon_url.eq.${encodeURIComponent(url)}`);
  if (!clauses.length) return null;
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,item_type,amazon_url,amazon_asin&or=(${clauses.join(",")})&limit=1`,
    { headers },
  );
  if (!response.ok) return null;
  return (await response.json().catch(() => []))[0] || null;
}

async function writeAudit(env, row) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
    await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_supplier_import_audit`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify([
        {
          source_url: row.url,
          provider: row.provider,
          external_product_id: row.asin || null,
          parse_status: row.status,
          warning_text: row.warning,
          duplicate_item_key: row.duplicate_item_key,
          actor_name: row.actor?.display_name || row.actor?.full_name || row.actor?.email || null,
        },
      ]),
    });
  } catch {
    // Audit failure must not turn a review-only supplier preview into a 500.
  }
}

function titleFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const candidate = parts.find((x) => x.toLowerCase() !== "dp" && !/^[A-Z0-9]{10}$/i.test(x)) || "Amazon item";
    return decodeURIComponent(candidate)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  } catch {
    return "Amazon item";
  }
}

function makeKey(value) {
  return String(value || "inventory_item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "inventory_item";
}

function cleanAmazonTitle(value) {
  return cleanText(value, 400)
    .replace(/<[^>]+>/g, "")
    .replace(/\s*:\s*Amazon\.[^:]+.*$/i, "")
    .replace(/\s*[-|]\s*Amazon\.(?:ca|com).*$/i, "")
    .trim();
}

function cleanText(value, max = 2000) {
  if (value == null) return "";
  return decode(String(value).replace(/<[^>]+>/g, " ")).trim().slice(0, max);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = cleanText(value, 5000);
    if (text) return text;
  }
  return "";
}

function formatMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : String(value || "");
}

function decode(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ");
}

function safePublicError(message) {
  const text = String(message || "");
  if (/short link could not be resolved/i.test(text)) return "The Amazon share link could not be resolved. Try the full Amazon product URL.";
  if (/unsupported host/i.test(text)) return "The supplier redirect did not remain on an approved Amazon host.";
  return "Try the link again, or paste the full Amazon product URL if Amazon is blocking automated metadata reads.";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store",
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
