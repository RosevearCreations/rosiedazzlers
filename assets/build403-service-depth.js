// Build 403 — professional service-depth convergence for public specialty landing pages.
// Content is advisory and condition-dependent. It adds no pricing, booking, consent or provider authority.

const SERVICE_DEPTH = {
  'paint-correction': {
    title: 'How professional paint correction is assessed and performed',
    intro: 'Paint correction is not one fixed polishing recipe. The safe approach depends on paint condition, defect depth, contamination, prior repairs and the finish the customer wants to preserve.',
    steps: [
      ['Assessment & safe wash', 'Inspect the paint in useful lighting, document visible defects and wash safely before deciding how aggressive correction should be.'],
      ['Decontamination', 'Remove bonded and embedded contamination as appropriate so correction is performed on a genuinely clean surface rather than grinding contamination into the finish.'],
      ['Test spot & correction plan', 'Use a controlled test area and the least-aggressive effective pad, polish or compound combination. Paint measurement may be appropriate where risk, history or condition warrants it.'],
      ['Correction & refinement', 'Correct the approved areas, then refine haze or micro-marring as needed. Deep scratches, thin paint, failing clear coat and previous repairs may limit what can safely be removed.'],
      ['Protection', 'After the approved finish is reached, prepare the surface and apply the selected protection so the corrected result is not left bare.']
    ],
    scope: ['swirl and oxidation severity', 'scratch depth and paint thickness/risk', 'vehicle size and panel count', 'contamination and prior repair history', 'one-stage versus multi-stage correction', 'chosen protection and required preparation'],
    timing: 'A light enhancement may be comparatively straightforward. Heavy oxidation, widespread defects or multi-stage correction can require several hours or substantially longer. Rosie Dazzlers does not promise a fixed correction time or perfect defect removal before inspection.'
  },
  'odor-removal': {
    title: 'Odor remediation starts with the source—not perfume',
    intro: 'Long-lasting odor work is a source-removal and cleaning problem first. Deodorizer is not a substitute for removing contaminated debris, residue or moisture.',
    steps: [
      ['Source inspection', 'Identify likely odor sources and affected materials, including spills, food, smoke residue, pet contamination, damp carpet or hidden debris.'],
      ['Physical removal & cleaning', 'Remove accessible source material, vacuum thoroughly and clean the affected hard and soft surfaces using methods appropriate to each material.'],
      ['Extraction where appropriate', 'Use controlled extraction when washable fabric or carpet holds soluble contamination, while avoiding unnecessary saturation.'],
      ['Drying & reinspection', 'Confirm cleaned areas are drying properly and reassess for trapped residue or moisture before final treatment.'],
      ['Odor-neutralizing treatment', 'Use an appropriate final deodorizing or neutralizing treatment only after source cleaning. Some severe smoke, biological or deeply absorbed odors may require additional work or may not be fully correctable by detailing alone.']
    ],
    scope: ['odor source and how long it has been present', 'affected materials and hidden contamination', 'smoke, food, pet, moisture or spill severity', 'extraction and drying requirements', 'access needed beneath seats, trim or carpet', 'whether multiple treatment stages are justified'],
    timing: 'Minor odor cleanup can be relatively simple. Severe smoke, biological contamination or deeply soaked materials can require several hours, repeated cleaning or restoration work. Final scope is confirmed after inspection; complete odor removal is never promised before the source and materials are assessed.'
  },
  'ceramic-coating': {
    title: 'Coating performance depends on preparation',
    intro: 'A ceramic coating is the final protective layer, not a shortcut around paint preparation. The amount of preparation depends on contamination, paint condition and the finish approved with the customer.',
    steps: [
      ['Inspection & wash', 'Inspect paint condition, previous protection and obvious defects, then perform a safe wash.'],
      ['Decontamination', 'Remove bonded contamination where needed so the coating is not installed over material that should have been removed first.'],
      ['Correction decision', 'Discuss whether paint enhancement or correction is appropriate. Coating can preserve the appearance underneath it, including defects that were not corrected.'],
      ['Panel preparation', 'Prepare the surface for the selected coating according to product requirements and verify that residues have been removed.'],
      ['Application & cure guidance', 'Apply the coating under suitable conditions and provide realistic initial-care/cure guidance for the product used.']
    ],
    scope: ['existing protection and contamination', 'paint defects and approved correction level', 'vehicle size and surface complexity', 'coating system selected', 'indoor/weather conditions required for application and cure'],
    timing: 'A well-kept vehicle needing limited preparation is very different from neglected or defect-heavy paint. Preparation and correction can add several hours. Coating scope and timing are confirmed from actual condition rather than a fixed promise.'
  },
  'pet-hair-removal': {
    title: 'Pet-hair removal is driven by fabric and embedment',
    intro: 'Loose hair on smooth upholstery is very different from hair woven into carpet, seat fabric, cargo trim and narrow crevices. Removal is assessed by material and density, not just by vehicle size.',
    steps: [
      ['Inspect affected zones', 'Identify the seats, carpet, cargo areas, crevices and fabrics where hair is loose versus deeply embedded.'],
      ['Dry removal first', 'Vacuum and use material-safe agitation or specialized hair-removal tools to lift hair without unnecessarily wetting the interior.'],
      ['Detail seams & crevices', 'Work edges, seat tracks and trim transitions where hair commonly packs into narrow spaces.'],
      ['Clean after removal', 'Complete the approved interior cleaning once the bulk hair is removed so loose fibres and soil are not simply redistributed.'],
      ['Final inspection', 'Recheck high-friction fabric and cargo areas and document any material limitations.']
    ],
    scope: ['hair density and length', 'carpet/upholstery weave', 'cargo-area and seat coverage', 'hair packed beneath trim or seat edges', 'other soil or stains discovered during removal'],
    timing: 'Light loose hair may add limited labour. Dense embedded hair across carpet, cloth seating and cargo trim can require several hours. Final labour is based on observed embedment and approved scope.'
  },
  'headlight-restoration': {
    title: 'Headlight restoration depends on where the damage is',
    intro: 'Yellowing and haze on the outside of a lens can often be restored, but internal moisture, internal coating damage, cracks or failed sealed units are different problems and may require repair or replacement outside detailing scope.',
    steps: [
      ['Lens assessment', 'Determine whether the visible problem is external oxidation/haze or evidence of internal damage, cracking or moisture.'],
      ['Clean & protect adjacent surfaces', 'Clean the lens and protect surrounding paint and trim before abrasive work.'],
      ['Staged restoration', 'Where appropriate, use controlled sanding or other staged abrasion based on severity rather than treating every lens the same.'],
      ['Refine & clarify', 'Refine and polish the lens to remove restoration haze and restore optical clarity as far as the material safely allows.'],
      ['UV-resistant protection', 'Apply an appropriate UV-resistant protective finish or coating after restoration; polishing alone should not be presented as a durable final step.']
    ],
    scope: ['external oxidation severity', 'failed factory coating', 'pitting, chips or cracks', 'internal moisture or reflector/lens damage', 'shape and access around the lamp', 'protection system selected'],
    timing: 'Mild external haze may be comparatively quick; heavily oxidized lenses can require multiple sanding/refinement stages and substantially more labour. Internal failure cannot be promised away by exterior restoration.'
  }
};

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function slug() {
  return String(document.body?.dataset?.landingSlug || location.pathname.split('/').filter(Boolean).pop() || '').trim();
}

function markup(config) {
  return `<section class="section panel" data-build403-service-depth="true"><p class="eyebrow">Professional process & condition assessment</p><h2 style="margin-top:0">${esc(config.title)}</h2><p>${esc(config.intro)}</p><div class="grid cards" style="margin-top:14px">${config.steps.map(([title, body], index) => `<article class="card"><div class="kicker">Step ${index + 1}</div><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p></article>`).join('')}</div><div class="grid cards two-col-stretch" style="margin-top:14px"><article class="card"><h3>What changes scope</h3><ul>${config.scope.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article><article class="card"><h3>Timing & approval</h3><p>${esc(config.timing)}</p><p class="muted">Products, equipment, labour and duration depend on actual condition and severity. If inspection shows materially more work than the requested scope, Rosie Dazzlers explains the finding and gets customer approval before expanding the job.</p></article></div><div class="notice" style="margin-top:14px"><strong>Need water extraction or flooded-floor restoration?</strong> Saturated carpet and underlay can require extraction, trim/seat/carpet access, trapped-moisture inspection, drying, cleaning, mold/rust-risk mitigation and deodorization. <a href="/water-extraction">See the flooded-floor restoration process</a>.</div></section>`;
}

function install() {
  const config = SERVICE_DEPTH[slug()];
  if (!config) return true;
  const mount = document.getElementById('landingMount');
  if (!mount || mount.querySelector('[data-build403-service-depth]')) return Boolean(mount?.querySelector('[data-build403-service-depth]'));
  const firstRenderedSection = mount.querySelector('section');
  if (!firstRenderedSection || /Page not found|Could not load this page/i.test(mount.textContent || '')) return false;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup(config);
  const section = wrapper.firstElementChild;
  const proof = mount.querySelector('[data-photo-managed-before-after], [data-recent-work-mount]')?.closest('section');
  if (proof?.parentNode === mount) mount.insertBefore(section, proof);
  else mount.appendChild(section);
  return true;
}

export function startBuild403ServiceDepth() {
  if (typeof document === 'undefined' || !SERVICE_DEPTH[slug()]) return;
  if (install()) return;
  const mount = document.getElementById('landingMount');
  if (!mount) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(mount, { childList: true, subtree: true });
}
