// /assets/chrome.js

/* =========================
   BRAND / NAV / FOOTER
   ========================= */

const BRAND = {
  name: "Rosie Dazzlers",
  logo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
  banner: "https://assets.rosiedazzlers.ca/brand/RosieDazzlersBanner.png",
  reviews: "https://assets.rosiedazzlers.ca/brand/RosieReviews.png",
  footerLogo: "https://assets.rosiedazzlers.ca/brand/RosieDazzlerLogoOriginal3D.png",
};

const SOCIALS = [
  ["TikTok", "https://www.tiktok.com/@rosiedazzler"],
  ["Instagram", "https://www.instagram.com/rosiedazzlers/"],
  ["Facebook", "https://www.facebook.com/rosiedazzlers"],
  ["YouTube", "https://www.youtube.com/@rosiedazzlers"],
  ["Twitch", "https://www.twitch.tv/rosiedazzlers/"],
  ["X", "https://x.com/RosieDazzlers"],
  ["LinkedIn", "https://www.linkedin.com/in/rosiedazzlers/"],
];

const DEFAULT_NAV_LINKS = [
  ["/services", "Services"],
  ["/pricing", "Pricing"],
  ["/gear", "Gear"],
  ["/consumables", "Consumables"],
  ["/about", "About"],
  ["/contact", "Contact"],
  ["/book", "Book"],
];

function normalizePath(p) {
  const x = (p || "/").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureNavLinks() {
  const links = document.querySelector("#navLinks");
  if (!links) return;

  const existing = links.querySelectorAll("a");
  if (existing.length > 0) return;

  links.innerHTML = DEFAULT_NAV_LINKS.map(
    ([href, label]) => `<a href="${href}">${label}</a>`
  ).join("");
}

function setBrandImagesEverywhere() {
  document.querySelectorAll("[data-logo]").forEach((logo) => {
    logo.src = BRAND.logo;
    if (!logo.getAttribute("alt")) {
      logo.alt = `${BRAND.name} logo`;
    }
  });
}

function ensureMainBanner() {
  const existingImg =
    document.querySelector("[data-main-banner] img") ||
    document.querySelector("#mainBanner img") ||
    document.querySelector(".main-banner img") ||
    document.querySelector("img[data-main-banner]") ||
    document.querySelector("img[data-banner]") ||
    document.querySelector("#bannerImage");

  if (existingImg) {
    existingImg.src = BRAND.banner;
    existingImg.alt = "Rosie Dazzlers banner";
    existingImg.loading = "eager";
    existingImg.style.display = "block";
    existingImg.style.width = "100%";
    existingImg.style.height = "auto";
    existingImg.style.objectFit = "contain";
    return;
  }

  const existingWrap =
    document.querySelector("[data-main-banner]") ||
    document.querySelector("#mainBanner") ||
    document.querySelector(".main-banner");

  if (existingWrap) {
    existingWrap.innerHTML = `
      <img
        src="${BRAND.banner}"
        alt="Rosie Dazzlers banner"
        loading="eager"
        style="display:block;width:100%;height:auto;object-fit:contain"
      >
    `;
    return;
  }

  if (document.querySelector("#globalMainBanner")) return;

  const nav = document.querySelector(".nav");
  const anchor = nav || document.querySelector("header") || document.body.firstElementChild || document.body;

  const wrap = document.createElement("div");
  wrap.id = "globalMainBanner";
  wrap.className = "container";
  wrap.style.paddingTop = "14px";
  wrap.style.paddingBottom = "8px";

  wrap.innerHTML = `
    <div
      class="panel"
      style="padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden"
    >
      <img
        src="${BRAND.banner}"
        alt="Rosie Dazzlers banner"
        loading="eager"
        style="display:block;width:100%;max-width:980px;height:auto;object-fit:contain"
      >
    </div>
  `;

  if (anchor && anchor.parentNode) {
    if (anchor === document.body) {
      document.body.insertBefore(wrap, document.body.firstChild);
    } else {
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    }
  } else {
    document.body.insertBefore(wrap, document.body.firstChild);
  }
}

function ensureReviewsPanel() {
  const path = normalizePath(location.pathname);
  if (path !== "/") return;

  const directImg =
    document.querySelector("[data-reviews]") ||
    document.querySelector("#reviewsImage") ||
    document.querySelector(".reviews img") ||
    document.querySelector(".review-banner img") ||
    document.querySelector("img[data-role='reviews']");

  if (directImg && directImg.tagName && directImg.tagName.toLowerCase() === "img") {
    directImg.src = BRAND.reviews;
    directImg.alt = "Rosie Dazzlers reviews";
    directImg.loading = "lazy";
    directImg.style.display = "block";
    directImg.style.width = "100%";
    directImg.style.height = "auto";
    directImg.style.objectFit = "contain";
    return;
  }

  const wrapTarget =
    document.querySelector(".reviews") ||
    document.querySelector(".review-banner") ||
    document.querySelector("[data-reviews-wrap]");

  if (wrapTarget) {
    wrapTarget.innerHTML = `
      <img
        src="${BRAND.reviews}"
        alt="Rosie Dazzlers reviews"
        loading="lazy"
        style="display:block;width:100%;height:auto;object-fit:contain"
      >
    `;
    return;
  }

  if (document.querySelector("#globalReviewsPanel")) return;

  const afterBanner =
    document.querySelector("#globalMainBanner") ||
    document.querySelector("[data-main-banner]") ||
    document.querySelector("#mainBanner") ||
    document.querySelector(".main-banner");

  const homePackages =
    document.querySelector("#homePackages") ||
    document.querySelector("main") ||
    document.querySelector(".container");

  const wrap = document.createElement("div");
  wrap.id = "globalReviewsPanel";
  wrap.className = "container";
  wrap.style.paddingTop = "8px";
  wrap.style.paddingBottom = "8px";

  wrap.innerHTML = `
    <div
      class="panel"
      style="padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden"
    >
      <img
        src="${BRAND.reviews}"
        alt="Rosie Dazzlers reviews"
        loading="lazy"
        style="display:block;width:100%;max-width:980px;height:auto;object-fit:contain"
      >
    </div>
  `;

  if (afterBanner && afterBanner.parentNode) {
    if (afterBanner.nextSibling) {
      afterBanner.parentNode.insertBefore(wrap, afterBanner.nextSibling);
    } else {
      afterBanner.parentNode.appendChild(wrap);
    }
    return;
  }

  if (homePackages && homePackages.parentNode) {
    homePackages.parentNode.insertBefore(wrap, homePackages);
    return;
  }

  document.body.appendChild(wrap);
}

function setActiveNavLink() {
  const path = normalizePath(location.pathname);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = normalizePath(a.getAttribute("href") || "/");
    const active =
      (href === "/" && path === "/") ||
      (href !== "/" && path.startsWith(href));
    a.classList.toggle("active", active);
  });
}

function initNavToggle() {
  const btn = document.querySelector("#navToggle");
  const links = document.querySelector("#navLinks");
  if (!btn || !links) return;

  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    links.classList.toggle("open");
    btn.setAttribute(
      "aria-expanded",
      links.classList.contains("open") ? "true" : "false"
    );
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

function setFooter() {
  const el = document.querySelector("[data-footer]");
  if (!el) return;

  const year = new Date().getFullYear();

  el.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <img
            src="${BRAND.footerLogo}"
            alt="${BRAND.name} logo"
            style="width:72px;height:72px;object-fit:contain;border-radius:14px;flex:0 0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.10);padding:6px;"
          >
          <div>
            <div class="footer-title">Rosie Dazzlers</div>
            <div class="footer-muted">Mobile Auto Detailing</div>
            <div class="footer-muted">Norfolk & Oxford Counties, Ontario</div>
          </div>
        </div>

        <div class="footer-muted" style="margin-top:12px">
          Email: <a href="mailto:info@rosiedazzlers.ca">info@rosiedazzlers.ca</a><br>
          Backup: <a href="mailto:rosiedazzlers@gmail.com">rosiedazzlers@gmail.com</a>
        </div>

        <div class="footer-note" style="margin-top:10px">
          Driveway required · customer provides power + water (or additional charges may apply).
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-title">Explore</div>
        <a href="/services">Services</a>
        <a href="/pricing">Pricing</a>
        <a href="/book">Book</a>
        <a href="/gear">Gear</a>
        <a href="/consumables">Consumables</a>
      </div>

      <div class="footer-col">
        <div class="footer-title">Company</div>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>

        <div class="footer-title" style="margin-top:12px">Social</div>
        <div class="footer-social">
          ${SOCIALS.map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`).join("")}
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-title">Policies</div>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/waiver">Waiver</a>

        <div class="footer-note" style="margin-top:12px">
          Deposits secure booking times. Cancellation fees may apply.
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div>© ${year} Rosie Dazzlers Mobile Auto Detailing</div>
      <div class="footer-bottom-links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/waiver">Waiver</a>
      </div>
    </div>
  `;
}

/* =========================
   PACKAGE CARD HOVER ROTATION
   ========================= */

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";

const STATIC_HOVER_FILES = [
  "Exterior Detail.png",
  "Interior Detail.png",
  "CarSizeChart.PNG",
];

const SIZE_ICON_BY_VALUE = {
  small: "SmallCar.png",
  mid: "MidSizedCars.png",
  oversize: "ExoticLargeSizedCars.png",
};

const loadState = new Map();

function fileUrl(fileName) {
  return encodeURI(`${PACKAGES_BASE}${fileName}`);
}

function preload(url) {
  const s = loadState.get(url);
  if (s === "ok" || s === "fail" || s === "pending") return;

  loadState.set(url, "pending");
  const img = new Image();
  img.onload = () => loadState.set(url, "ok");
  img.onerror = () => loadState.set(url, "fail");
  img.src = url;
}

function isOk(url) {
  return loadState.get(url) === "ok";
}

function currentSize() {
  const sel = document.querySelector("#size");
  return sel && sel.value ? sel.value : null;
}

function guessGiftCertUrl(baseSrc) {
  try {
    const u = new URL(baseSrc);
    const file = u.pathname.split("/").pop() || "";
    if (!/\.png$/i.test(file)) return null;

    const giftFile = file.replace(/\.png$/i, "GiftCert.png");
    const giftUrl = `${u.origin}/packages/${encodeURIComponent(giftFile)}`;
    return giftUrl.replace(/%2F/g, "/");
  } catch {
    return null;
  }
}

function buildPlaylist(baseSrc) {
  const urls = [];

  urls.push(baseSrc);

  for (const f of STATIC_HOVER_FILES) urls.push(fileUrl(f));

  const s = currentSize();
  if (s && SIZE_ICON_BY_VALUE[s]) urls.push(fileUrl(SIZE_ICON_BY_VALUE[s]));

  const gift = guessGiftCertUrl(baseSrc);
  if (gift) urls.push(gift);

  return urls.filter((u, i, arr) => arr.indexOf(u) === i);
}

function attachRotators(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  function attach(card) {
    if (!card || card.dataset.hoverInit === "1") return;
    const img = card.querySelector("img");
    if (!img) return;

    card.dataset.hoverInit = "1";

    let timer = null;
    let playlist = [];
    let base = "";

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (base) img.src = base;
    }

    card.addEventListener("mouseenter", () => {
      base = img.currentSrc || img.src;

      img.onerror = () => {
        img.style.display = "";
        img.src = base;
      };

      playlist = buildPlaylist(base);
      playlist.forEach(preload);

      if (timer) clearInterval(timer);

      timer = setInterval(() => {
        if (!playlist.length) return;

        const currentIdx = playlist.indexOf(img.src);
        let idx = currentIdx >= 0 ? currentIdx : 0;

        for (let tries = 0; tries < playlist.length; tries++) {
          idx = (idx + 1) % playlist.length;
          const candidate = playlist[idx];

          if (candidate === base) {
            img.src = candidate;
            return;
          }

          if (isOk(candidate)) {
            img.src = candidate;
            return;
          }
        }
      }, 1200);
    });

    card.addEventListener("mouseleave", stop);
  }

  container.querySelectorAll(".card").forEach(attach);

  const mo = new MutationObserver(() => {
    container.querySelectorAll(".card").forEach(attach);
  });
  mo.observe(container, { childList: true, subtree: true });
}



/* =========================
   PUBLIC ACCOUNT WIDGET + ANALYTICS
   ========================= */

function isAdminLikePath() {
  const path = normalizePath(location.pathname);
  return path.startsWith('/admin');
}

function ensureSupportScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((s) => s.src && s.src.includes(src));
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

function ensurePublicAccountWidgetStyles() {
  if (document.querySelector('#publicAccountWidgetStyles')) return;
  const style = document.createElement('style');
  style.id = 'publicAccountWidgetStyles';
  style.textContent = `
    .public-account-widget{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto}
    .public-account-widget .state{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .public-account-widget .meta{font-size:.86rem;color:rgba(234,242,255,.78)}
    .public-account-widget .pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:.85rem}
    .public-account-pop{position:fixed;right:18px;top:72px;z-index:9999;max-width:420px;width:min(420px,calc(100vw - 24px));background:rgba(10,14,24,.98);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px;box-shadow:0 16px 46px rgba(0,0,0,.35);display:none}
    .public-account-pop.open{display:block}
    .public-account-pop h3{margin:0 0 8px}
    .public-account-pop .muted{color:#94a3b8;font-size:.92rem}
    .public-account-pop .field{margin-bottom:10px}
    .public-account-pop label{display:block;margin-bottom:6px;font-size:.9rem;font-weight:700}
    .public-account-pop input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#f8fafc}
    .public-account-pop .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .public-account-pop .status{margin-top:10px;font-size:.92rem;color:#e5e7eb}
    .public-account-pop .status.error{color:#fecaca}.public-account-pop .status.success{color:#bbf7d0}
    @media (max-width:980px){.public-account-widget{width:100%;justify-content:flex-start;margin-top:8px}}
  `;
  document.head.appendChild(style);
}

function ensurePublicAccountWidgetMarkup() {
  if (isAdminLikePath()) return null;
  const navInner = document.querySelector('.nav .nav-inner');
  if (!navInner) return null;
  let widget = document.querySelector('#publicAccountWidget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'publicAccountWidget';
    widget.className = 'public-account-widget';
    widget.innerHTML = `<div class="state"><span class="pill">Account</span><span class="meta">Checking session…</span></div>`;
    const bookBtn = navInner.querySelector('a.btn.primary');
    if (bookBtn && bookBtn.parentNode) navInner.insertBefore(widget, bookBtn);
    else navInner.appendChild(widget);
  }
  let pop = document.querySelector('#publicAccountPopover');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'publicAccountPopover';
    pop.className = 'public-account-pop';
    pop.innerHTML = `
      <h3>Account help</h3>
      <div class="muted">Sign in as a customer or staff member, request a password reset, or resend a verification email.</div>
      <div class="field"><label for="publicAccountEmail">Email</label><input id="publicAccountEmail" type="email" placeholder="you@example.com"></div>
      <div class="field"><label for="publicAccountPassword">Password</label><input id="publicAccountPassword" type="password" placeholder="Password"></div>
      <div class="field" id="resetTokenWrap" style="display:none"><label for="publicResetToken">Reset token</label><input id="publicResetToken" type="text" placeholder="Paste reset token"></div>
      <div class="field" id="newPasswordWrap" style="display:none"><label for="publicNewPassword">New password</label><input id="publicNewPassword" type="password" placeholder="New password"></div>
      <div class="actions">
        <button class="btn small" type="button" id="publicSignInBtn">Login</button>
        <a class="btn small ghost" href="/login">Open login page</a>
        <button class="btn small ghost" type="button" id="publicForgotBtn">Forgot password</button>
        <button class="btn small ghost" type="button" id="publicVerifyBtn">Forgot email verification</button>
        <button class="btn small ghost" type="button" id="publicResetBtn" style="display:none">Reset now</button>
        <button class="btn small ghost" type="button" id="publicCloseBtn">Close</button>
      </div>
      <div id="publicAccountStatus" class="status"></div>
    `;
    document.body.appendChild(pop);
  }
  return { widget, pop };
}

async function initPublicAccountWidget() {
  if (isAdminLikePath()) return;
  ensurePublicAccountWidgetStyles();
  const nodes = ensurePublicAccountWidgetMarkup();
  if (!nodes) return;
  try { await ensureSupportScript('/assets/client-auth.js'); } catch { return; }
  try { await ensureSupportScript('/assets/admin-auth.js'); } catch {}
  try { await ensureSupportScript('/assets/public-analytics.js'); } catch {}
  const { widget, pop } = nodes;
  const stateWrap = widget.querySelector('.state');
  const statusEl = pop.querySelector('#publicAccountStatus');
  const emailEl = pop.querySelector('#publicAccountEmail');
  const passwordEl = pop.querySelector('#publicAccountPassword');
  const resetTokenWrap = pop.querySelector('#resetTokenWrap');
  const newPasswordWrap = pop.querySelector('#newPasswordWrap');
  const resetTokenEl = pop.querySelector('#publicResetToken');
  const newPasswordEl = pop.querySelector('#publicNewPassword');
  const resetBtn = pop.querySelector('#publicResetBtn');

  function setStatus(message, type) {
    statusEl.textContent = message || '';
    statusEl.className = `status ${type || ''}`;
  }
  function openPop() { pop.classList.add('open'); }
  function closePop() { pop.classList.remove('open'); }
  function showResetMode(token) {
    resetTokenWrap.style.display = '';
    newPasswordWrap.style.display = '';
    resetBtn.style.display = '';
    if (token) resetTokenEl.value = token;
    openPop();
  }
  function safeNext(defaultPath) {
    if (location.pathname === '/login') {
      const next = new URL(location.href).searchParams.get('next');
      if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    }
    return defaultPath;
  }
  function renderLoggedOut() {
    stateWrap.innerHTML = `<span class="pill">Guest</span><a class="btn small ghost" href="/login">Login</a><button class="btn small ghost" type="button" id="publicAccountHelpBtn">Need help?</button><span class="meta">Customers and staff can sign in here.</span>`;
    const help = stateWrap.querySelector('#publicAccountHelpBtn');
    if (help) help.addEventListener('click', openPop);
  }
  function renderLoggedInCustomer(customer) {
    const verified = customer?.email_verification_pending ? 'Verification pending' : 'Verified';
    stateWrap.innerHTML = `<span class="pill">${escapeHtml(customer?.full_name || customer?.email || 'Customer')}</span><span class="meta">${verified}</span><a class="btn small ghost" href="/my-account">Settings</a><button class="btn small ghost" type="button" id="publicLogoutBtn">Logout</button>`;
    const logoutBtn = stateWrap.querySelector('#publicLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
      setStatus('Signing out…');
      try { await window.ClientAuth.signOut(); setStatus('Signed out.', 'success'); renderLoggedOut(); setTimeout(closePop, 500); }
      catch (err) { setStatus(err?.message || 'Could not sign out.', 'error'); }
    });
  }
  function renderLoggedInStaff(actor) {
    stateWrap.innerHTML = `<span class="pill">${escapeHtml(actor?.full_name || actor?.email || 'Staff')}</span><span class="meta">${escapeHtml(actor?.role_code || 'staff')}</span><a class="btn small ghost" href="/admin">Admin</a><a class="btn small ghost" href="/admin-account">Settings</a><button class="btn small ghost" type="button" id="publicStaffLogoutBtn">Logout</button>`;
    const logoutBtn = stateWrap.querySelector('#publicStaffLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
      setStatus('Signing out…');
      try { await window.AdminAuth.signOut(); setStatus('Signed out.', 'success'); renderLoggedOut(); setTimeout(closePop, 500); }
      catch (err) { setStatus(err?.message || 'Could not sign out.', 'error'); }
    });
  }
  async function refresh() {
    try {
      if (window.AdminAuth?.loadCurrentActor) {
        const staff = await window.AdminAuth.loadCurrentActor();
        if (staff?.authenticated && staff.actor) {
          renderLoggedInStaff(staff.actor);
          if (window.RosieAnalytics?.track) window.RosieAnalytics.track('account_widget_refresh', { authenticated: true, auth_kind: 'staff' });
          return;
        }
      }
      const result = await window.ClientAuth.loadCurrentCustomer();
      if (result?.authenticated && result.customer) renderLoggedInCustomer(result.customer);
      else renderLoggedOut();
      if (window.RosieAnalytics?.track) window.RosieAnalytics.track('account_widget_refresh', { authenticated: !!result?.authenticated, auth_kind: result?.authenticated ? 'client' : 'guest' });
    } catch {
      renderLoggedOut();
    }
  }

  pop.querySelector('#publicCloseBtn').addEventListener('click', closePop);
  pop.querySelector('#publicSignInBtn').addEventListener('click', async () => {
    setStatus('Signing in…');
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    try {
      await window.ClientAuth.signIn({ email, password });
      setStatus('Signed in successfully.', 'success');
      await refresh();
      if (location.pathname === '/login') setTimeout(() => location.replace(safeNext('/my-account')), 350);
      else setTimeout(closePop, 600);
      return;
    } catch (clientErr) {
      try {
        if (!window.AdminAuth?.signIn) throw clientErr;
        await window.AdminAuth.signIn({ email, password });
        setStatus('Staff sign-in successful.', 'success');
        await refresh();
        if (location.pathname === '/login') setTimeout(() => location.replace(safeNext('/admin')), 350);
        else setTimeout(closePop, 600);
      } catch (staffErr) {
        setStatus((staffErr && staffErr.message) || (clientErr && clientErr.message) || 'Could not sign in.', 'error');
      }
    }
  });
  pop.querySelector('#publicForgotBtn').addEventListener('click', async () => {
    setStatus('Sending password reset…');
    try {
      await window.ClientAuth.forgotPassword({ email: emailEl.value.trim() });
      setStatus('If the email exists, a reset link has been sent.', 'success');
      showResetMode('');
    } catch (err) { setStatus(err?.message || 'Could not start reset.', 'error'); }
  });
  pop.querySelector('#publicVerifyBtn').addEventListener('click', async () => {
    setStatus('Sending verification link…');
    try {
      await window.ClientAuth.resendVerification({ email: emailEl.value.trim() });
      setStatus('If the email exists, a verification link has been sent.', 'success');
    } catch (err) { setStatus(err?.message || 'Could not resend verification.', 'error'); }
  });
  resetBtn.addEventListener('click', async () => {
    setStatus('Resetting password…');
    try {
      await window.ClientAuth.resetPassword({ token: resetTokenEl.value.trim(), password: newPasswordEl.value });
      setStatus('Password reset successful. You are now signed in.', 'success');
      await refresh();
      setTimeout(closePop, 900);
    } catch (err) { setStatus(err?.message || 'Could not reset password.', 'error'); }
  });

  const params = new URLSearchParams(location.search);
  const verifyToken = params.get('verify_token');
  const resetToken = params.get('reset_token');
  if (verifyToken) {
    openPop();
    setStatus('Verifying email…');
    window.ClientAuth.verifyEmail({ token: verifyToken }).then(async () => {
      setStatus('Email verified successfully.', 'success');
      await refresh();
    }).catch((err) => setStatus(err?.message || 'Could not verify email.', 'error'));
  }
  if (resetToken) showResetMode(resetToken);

  document.addEventListener('click', (event) => {
    if (!pop.classList.contains('open')) return;
    if (pop.contains(event.target) || widget.contains(event.target)) return;
    closePop();
  });

  await refresh();
}
/* =========================
   BOOT
   ========================= */

function initChrome() {
  ensureNavLinks();
  setBrandImagesEverywhere();
  ensureMainBanner();
  ensureReviewsPanel();
  setActiveNavLink();
  initNavToggle();
  setFooter();
  initPublicAccountWidget();

  attachRotators("#homePackages");
  attachRotators("#packageCards");
  attachRotators("#pricingCards");
  attachRotators("#packagesGrid");
  attachRotators("#pricingPackages");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChrome);
} else {
  initChrome();
}
