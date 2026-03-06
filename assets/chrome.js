// /assets/chrome.js
const SOCIALS = [
  ["TikTok", "https://www.tiktok.com/@rosiedazzler"],
  ["Instagram", "https://www.instagram.com/rosiedazzlers/"],
  ["Facebook", "https://www.facebook.com/rosiedazzlers"],
  ["YouTube", "https://www.youtube.com/@rosiedazzlers"],
  ["Twitch", "https://www.twitch.tv/rosiedazzlers"],
  ["X", "https://x.com/RosieDazzlers"],
  ["LinkedIn", "https://www.linkedin.com/in/rosiedazzlers/"]
];

function setActiveNavLink() {
  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const links = document.querySelectorAll(".nav-links a");
  links.forEach(a => {
    const href = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
    const active = (href === "/" && path === "/") || (href !== "/" && path.startsWith(href));
    a.classList.toggle("active", active);
  });
}

function initNavToggle() {
  const btn = document.querySelector("#navToggle") || document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("#navLinks") || document.querySelector("[data-nav-links]") || document.querySelector(".nav-links");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    links.classList.toggle("open");
    btn.setAttribute("aria-expanded", links.classList.contains("open") ? "true" : "false");
  });

  // close menu after click on mobile
  links.querySelectorAll("a").forEach(a => {
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
          ${SOCIALS.map(([name,url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`).join("")}
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

function applyChrome() {
  setActiveNavLink();
  initNavToggle();
  setFooter();
}

// Run automatically
applyChrome();

// Re-apply after SPA-ish changes (safe noop for static)
window.addEventListener("popstate", applyChrome);
