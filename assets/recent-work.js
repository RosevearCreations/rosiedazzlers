function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadGallery() {
  const res = await fetch('/api/before_after_gallery_public', { cache: 'no-store' });
  const out = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(out?.items)) throw new Error(out?.error || 'Could not load recent work right now.');
  return out.items;
}

function mediaMarkup(item, side) {
  const kind = String(item?.[`${side}_kind`] || 'image').toLowerCase() === 'video' ? 'video' : 'image';
  const url = String(item?.[`${side}_url`] || '').trim();
  const label = side === 'before' ? 'Before detailing' : 'After detailing';
  if (!url) return `<div class="recent-work-${side} recent-work-empty" aria-label="${label}"></div>`;
  if (kind === 'video') return `<video class="recent-work-${side}" src="${esc(url)}" muted playsinline controls preload="metadata"></video>`;
  return `<img class="recent-work-${side}" src="${esc(url)}" alt="${esc(label + ' - ' + (item?.title || 'recent work'))}">`;
}

function renderBeforeAfterSlider(item, idx) {
  return `<div class="recent-work-compare" data-recent-work-stage="${idx}" style="--split:50%">
    ${mediaMarkup(item, 'after')}
    ${mediaMarkup(item, 'before')}
    <span class="recent-work-label before">Before</span>
    <span class="recent-work-label after">After</span>
    <span class="recent-work-handle" aria-hidden="true"></span>
  </div>
  <input class="recent-work-range" type="range" min="0" max="100" value="50" data-recent-work-range="${idx}" aria-label="Slide to compare before and after image" />`;
}

function wireRecentWorkSliders(root = document) {
  [...root.querySelectorAll('[data-recent-work-range]')].forEach((range) => {
    range.addEventListener('input', () => {
      const stage = root.querySelector(`[data-recent-work-stage="${range.dataset.recentWorkRange}"]`);
      if (stage) stage.style.setProperty('--split', `${range.value}%`);
    });
  });
}

export async function renderRecentWorkMounts(limit = 3) {
  const mounts = [...document.querySelectorAll('[data-recent-work-mount]')];
  if (!mounts.length) return;
  try {
    const items = (await loadGallery()).slice(0, Math.max(1, Number(limit || 3)));
    const html = items.length ? `<div class="recent-work-grid">${items.map((item, idx) => `
      <article class="recent-work-card">
        ${renderBeforeAfterSlider(item, idx)}
        <h3>${esc(item?.title || 'Detail result')}</h3>
        <p class="section-kicker">${esc(item?.location || 'Oxford / Norfolk Counties')}</p>
        <p class="muted">${esc(item?.note || 'View more before/after work in the public gallery.')}</p>
        <div class="cta-row" style="margin-top:10px">
          <a class="btn ghost small" href="/gallery">Open gallery</a>
          <a class="btn ghost small" href="/book">Book now</a>
        </div>
      </article>
    `).join('')}</div>` : '<div class="notice soft">Add more approved before/after comparisons in App Management to strengthen public proof.</div>';
    mounts.forEach((mount) => { mount.innerHTML = html; wireRecentWorkSliders(mount); });
  } catch (err) {
    mounts.forEach((mount) => { mount.innerHTML = `<div class="notice">${esc(err?.message || 'Could not load recent work.')}</div>`; });
  }
}
