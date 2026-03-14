// /assets/chrome.js

/* =========================
   NAV + FOOTER (existing)
   ========================= */

const SOCIALS = [
  ["TikTok", "https://www.tiktok.com/@rosiedazzler"],
  ["Instagram", "https://www.instagram.com/rosiedazzlers/"],
  ["Facebook", "https://www.facebook.com/rosiedazzlers"],
  ["YouTube", "https://www.youtube.com/@rosiedazzlers"],
  ["Twitch", "https://www.twitch.tv/rosiedazzlers/"],
  ["X", "https://x.com/RosieDazzlers"],
  ["LinkedIn", "https://www.linkedin.com/in/rosiedazzlers/"],
];

function normalizePath(p) {
  const x = (p || "/").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

function setActiveNavLink() {
  const path = normalizePath(location.pathname);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = normalizePath(a.getAttribute("href") || "/");
    const active = (href === "/" && path === "/") || (href !== "/" && path.startsWith(href));
    a.classList.toggle("active", active);
  });
}

function initNavToggle() {
  const btn = document.querySelector("#navToggle");
  const links = document.querySelector("#navLinks");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    links.classList.toggle("open");
    btn.setAttribute("aria-expanded", links.classList.contains("open") ? "true" : "false");
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
        <div class="footer-title">Rosie Dazzlers</div>
        <div class="footer-muted">Mobile Auto Detailing</div>
        <div class="footer-muted">Norfolk & Oxford Counties, Ontario</div>

        <div class="footer-muted" style="margin-top:10px">
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
   (fixes blanks + uses your real filenames)
   ========================= */

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";

// These exist in your /packages directory (exact names)
const STATIC_HOVER_FILES = [
  "Exterior Detail.png",
  "Interior Detail.png",
  "CarSizeChart.PNG",
];

// Also use size-specific images you already have
const SIZE_ICON_BY_VALUE = {
  small: "SmallCar.png",
  mid: "MidSizedCars.png",
  oversize: "ExoticLargeSizedCars.png",
};

const loadState = new Map(); // url -> "ok" | "fail" | "pending"

function fileUrl(fileName) {
  // filenames contain spaces, so encodeURI is required
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
  // services + pricing use #size for the viewer selector
  const sel = document.querySelector("#size");
  return sel && sel.value ? sel.value : null;
}

function guessGiftCertUrl(baseSrc) {
  // If your card image is ...Something.png, try ...SomethingGiftCert.png
  // Works for items like PremiumExternalWash.png, FullInteriorDetailSmallCars.png, etc.
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

  // 1) main image (size-specific package image)
  urls.push(baseSrc);

  // 2) static hover images (Exterior / Interior / Size chart)
  for (const f of STATIC_HOVER_FILES) urls.push(fileUrl(f));

  // 3) size icon that matches the size dropdown
  const s = currentSize();
  if (s && SIZE_ICON_BY_VALUE[s]) urls.push(fileUrl(SIZE_ICON_BY_VALUE[s]));

  // 4) gift cert version of the current card image (if it exists)
  const gift = guessGiftCertUrl(baseSrc);
  if (gift) urls.push(gift);

  // de-dupe
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

      // ensure we never "blank" the card
      img.onerror = () => {
        img.style.display = "";
        img.src = base;
      };

      playlist = buildPlaylist(base);
      playlist.forEach(preload);

      if (timer) clearInterval(timer);

      // rotate ONLY to images that are confirmed loaded (no blanks)
      timer = setInterval(() => {
        if (!playlist.length) return;

        // Try up to playlist length to find next loaded image
        const currentIdx = playlist.indexOf(img.src);
        let idx = currentIdx >= 0 ? currentIdx : 0;

        for (let tries = 0; tries < playlist.length; tries++) {
          idx = (idx + 1) % playlist.length;
          const candidate = playlist[idx];

          // base is always allowed
          if (candidate === base) {
            img.src = candidate;
            return;
          }
          // only rotate to loaded hover images
          if (isOk(candidate)) {
            img.src = candidate;
            return;
          }
        }
        // none ready yet -> keep current image
      }, 1200);
    });

    card.addEventListener("mouseleave", stop);
  }

  // existing + future cards
  container.querySelectorAll(".card").forEach(attach);

  const mo = new MutationObserver(() => {
    container.querySelectorAll(".card").forEach(attach);
  });
  mo.observe(container, { childList: true, subtree: true });
}

/* =========================
   BOOT
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  initNavToggle();
  setFooter();

  // package cards on home/services/pricing
  attachRotators("#homePackages");
  attachRotators("#packagesGrid");
  attachRotators("#pricingPackages");
});
