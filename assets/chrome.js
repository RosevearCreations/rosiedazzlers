// /assets/chrome.js
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
   Hover rotation (packages)
   ========================= */

const PACKAGES_BASE = "https://assets.rosiedazzlers.ca/packages/";

// Your ACTUAL filenames (case + spaces matter)
const HOVER_FILES = [
  "Exterior Detail.png",
  "Interior Detail.png",
  "CarSizeChart.PNG",
];

let _resolvedHoverUrls = null;

function preload(url, timeoutMs = 2200) {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(url); };
    img.onerror = () => { clearTimeout(t); resolve(null); };
    img.src = url;
  });
}

async function getHoverUrls() {
  if (_resolvedHoverUrls) return _resolvedHoverUrls;

  // encodeURI is required because filenames contain spaces
  const urls = [...new Set(HOVER_FILES.map((f) => encodeURI(`${PACKAGES_BASE}${f}`)))];
  const results = await Promise.all(urls.map((u) => preload(u)));
  _resolvedHoverUrls = results.filter(Boolean);
  return _resolvedHoverUrls;
}

function attachRotatorToContainer(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const attachToCard = (card) => {
    if (!card || card.dataset.hoverInit === "1") return;

    const img = card.querySelector("img");
    if (!img) return;

    card.dataset.hoverInit = "1";

    let timer = null;
    let playlist = [];
    let idx = 0;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      if (playlist.length) img.src = playlist[0];
    };

    card.addEventListener("mouseenter", async () => {
      const baseSrc = img.currentSrc || img.src;

      // Override any inline onerror that hides the image
      img.onerror = () => {
        img.style.display = "";
        img.src = baseSrc;
      };

      const hoverUrls = await getHoverUrls();

      playlist = [baseSrc, ...hoverUrls].filter((u, i, arr) => arr.indexOf(u) === i);
      idx = 0;

      if (playlist.length <= 1) return;

      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        idx = (idx + 1) % playlist.length;
        img.src = playlist[idx];
      }, 1300);
    });

    card.addEventListener("mouseleave", stop);
  };

  container.querySelectorAll(".card").forEach(attachToCard);

  const mo = new MutationObserver(() => {
    container.querySelectorAll(".card").forEach(attachToCard);
  });
  mo.observe(container, { childList: true, subtree: true });
}

function initPackageHoverRotation() {
  attachRotatorToContainer("#packageCards");  // services page
  attachRotatorToContainer("#pricingCards");  // pricing page
  // attachRotatorToContainer("#homePackages"); // optional
}

/* ========================= */

function applyChrome() {
  setActiveNavLink();
  initNavToggle();
  setFooter();
  initPackageHoverRotation();
}

applyChrome();
window.addEventListener("popstate", applyChrome);
