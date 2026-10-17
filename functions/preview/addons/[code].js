// Cloudflare Pages dynamic read-only *preview* route for 24 canonical add-on codes.
import { ADDON_GUIDES_572, addonGuide572 } from "../../../assets/addon-guides-v572.js";
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export async function onRequestGet({params}) {
  const code=String(params?.code||"");
  if (!Object.prototype.hasOwnProperty.call(ADDON_GUIDES_572,code)) return new Response("Guide not found",{status:404,headers:{"X-Robots-Tag":"noindex"}});
  // No media approval manifest is configured: image slot must stay empty until a separate owner-reviewed release.
  const guide=addonGuide572(code,null,null);
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(guide.name)} — Preview | Rosie Dazzlers</title><link rel="stylesheet" href="/assets/addon-guides-v572.css"></head>
<body><main class="addon-wrap"><nav><a href="/preview/addons/">All add-on guides</a> · <a href="/preview/services/">Service guide preview</a></nav>
<p class="eyebrow">Build 572 · Unindexed editorial preview</p><h1>${escapeHtml(guide.name)}</h1><p class="category">${escapeHtml(guide.category)}</p>
<p class="lead">${escapeHtml(guide.overview)}</p>
<p class="warning"><strong>Preview only.</strong> No price or appointment is confirmed. The existing booking system remains authoritative; ask staff about suitability.</p>
<div class="addon-grid"><section class="addon-panel"><h2>What to assess first</h2><p>${escapeHtml(guide.assessment)}</p>
<h2>Limitations and realistic expectations</h2><p>${escapeHtml(guide.limitations)}</p>
<p class="notice">Current catalog availability, add-on eligibility and quote requirements must be confirmed by Rosie Dazzlers staff.</p></section>
<section class="addon-panel"><h2>Service photo</h2><div class="photo-pending" role="note">Photo awaiting verified owner approval</div>
<p class="caption">No unapproved customer, stock or placeholder image is presented as finished work. Target photo 1600×1067, minimum 1200×800.</p></section></div>
<section class="addon-panel faq"><h2>Before booking</h2><p>Tell our team about vehicle condition, previous treatments, surface damage, location and weather considerations. Rosie brings standard detailing water and power, subject to safe site access.</p><h2>Is the result guaranteed?</h2><p>No. Results vary by vehicle, surface and existing wear. Treatment and pricing depend on professional assessment and acceptance of current commercial terms.</p></section>
<div class="actions"><a href="/preview/quote-first/">Try the quote-first preview</a><a href="/book">Use current booking</a></div>
</main></body></html>`;
  return new Response(html,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow, noarchive","Content-Security-Policy":"default-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'"}});
}
