// Build 703: a non-transactional bridge from the public service picker to an
// owner-reviewable email draft. Never transfer customer identity, gift codes,
// appointment holds, payment data, or estimated prices via the URL.
const VALID_SIZES_703 = new Set(["small", "mid", "oversize"]);

function label703(value, maxLength = 96) {
  if (typeof value !== "string") return "";
  return value.normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, maxLength).trim();
}

function addons703(values) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const name = label703(value, 72);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    result.push(name);
    seen.add(key);
    if (result.length === 8) break;
  }
  return result;
}

export function buildQuoteHandoffHref703(selection = {}) {
  const query = new URLSearchParams();
  query.set("source", "booking_quote");
  if (VALID_SIZES_703.has(selection.size)) query.set("size", selection.size);
  const service = label703(selection.service);
  if (service) query.set("service", service);
  for (const addon of addons703(selection.addons)) query.append("addon", addon);
  if (selection.inspection === true) query.set("inspection", "1");
  return `/contact?${query.toString()}#contactPrepHeading`;
}

export function parseQuoteHandoff703(search = "") {
  const query = new URLSearchParams(String(search).replace(/^\?/, ""));
  if (query.get("source") !== "booking_quote") return null;
  const size = query.get("size");
  return {
    size: VALID_SIZES_703.has(size) ? size : "unknown",
    service: label703(query.get("service")),
    addons: addons703(query.getAll("addon")),
    inspection: query.get("inspection") === "1",
  };
}

export function quoteHandoffNotes703(selection) {
  const service = label703(selection?.service) || "Please help us choose";
  const addons = addons703(selection?.addons);
  const lines = [
    "Website booking selection for staff quote review:",
    `Service: ${service}`,
    `Extras: ${addons.length ? addons.join(", ") : "None selected"}`,
    selection?.inspection === true
      ? "Some extras need an inspection/condition quote. Please review the scope before booking."
      : "Please confirm the recommended scope and quote if needed.",
    "Vehicle condition / questions (please add details):",
    "",
    "This is an enquiry, not a reserved booking or approved price."
  ];
  return lines.join("\n").slice(0, 800);
}

export function hydrateContactQuoteHandoff703(doc, search) {
  const incoming = parseQuoteHandoff703(search);
  if (!incoming) return false;
  const form = doc?.getElementById("contactPrepForm");
  const topic = doc?.getElementById("contactPrepTopic");
  const size = doc?.getElementById("contactPrepSize");
  const notes = doc?.getElementById("contactPrepMessage");
  if (!form || !topic || !size || !notes) return false;
  topic.value = incoming.inspection ? "photo" : "addons";
  size.value = incoming.size;
  notes.value = quoteHandoffNotes703(incoming);
  const status = doc.getElementById("quoteHandoffStatus703");
  if (status) {
    status.hidden = false;
    status.textContent = "Your service choices are ready in the enquiry below. Review the text, add vehicle details and open your email app to send it. Nothing has been sent or booked yet.";
  }
  form.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
