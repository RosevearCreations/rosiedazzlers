// File: /functions/api/admin/structured_data_preview.js
// Build 195: preview public LocalBusiness/Service structured data from editable settings.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const [profile, landing] = await Promise.all([loadEditableSetting(env, "business_profile"), loadEditableSetting(env, "landing_pages_content")]);
  const b = profile.value?.business || profile.value || {};
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: b.name || b.short_name || "Rosie Dazzlers Mobile Auto Detailing",
    url: b.website || "https://rosiedazzlers.ca",
    email: b.contact?.public_email || b.email || undefined,
    telephone: b.contact?.phone || b.phone || undefined,
    areaServed: b.service_area || "Oxford County and Norfolk County, Ontario",
    address: b.address || undefined,
    sameAs: Array.isArray(b.social_links) ? b.social_links.map((row) => row.url || row.href).filter(Boolean) : []
  };
  const services = collectServices(landing.value).slice(0, 20).map((row) => ({ "@context": "https://schema.org", "@type": "Service", name: row.title || row.name || row.slug || "Mobile detailing service", areaServed: row.town || row.area || localBusiness.areaServed, provider: { "@type": "LocalBusiness", name: localBusiness.name, url: localBusiness.url }, url: row.path || row.href || row.url || undefined }));
  return json({ ok: true, build: "195", source_status: { business_profile: profile.source_status, landing_pages_content: landing.source_status }, local_business: localBusiness, service_pages: services, warnings: validate(localBusiness, services) });
}
function collectServices(value) { if (Array.isArray(value?.pages)) return value.pages; if (Array.isArray(value?.landing_pages)) return value.landing_pages; return []; }
function validate(localBusiness, services) { const warnings = []; if (!localBusiness.email && !localBusiness.telephone) warnings.push("LocalBusiness should include at least one public contact method."); if (!localBusiness.areaServed) warnings.push("LocalBusiness areaServed is missing."); if (!services.length) warnings.push("No service/landing page structured-data previews found."); return warnings; }
