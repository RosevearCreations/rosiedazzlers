/** Rosie Dazzlers cross-surface theme contract.
 * Current deployment has exactly one approved theme: Standard.
 * A future theme cannot activate before its registry entry is explicitly approved.
 * No backend writes, cookies, localStorage or automatic preference persistence.
 */
export const DEFAULT_THEME = "standard";
const THEME_ID = /^[a-z][a-z0-9-]{0,39}$/;
const SHEET_PATH = /^\/assets\/themes\/[a-z][a-z0-9-]{0,39}\.css$/;
function validTheme(id, entry) {
  return THEME_ID.test(id) &&
    entry && typeof entry === "object" &&
    typeof entry.label === "string" && entry.label.length <= 80 &&
    SHEET_PATH.test(entry.stylesheet || "") &&
    (entry.status === "baseline" || entry.status === "approved");
}
export function validatedThemeRegistry(raw) {
  const themes = {};
  for (const [id, entry] of Object.entries(raw?.themes || {})) {
    if (validTheme(id, entry)) themes[id] = {
      label: entry.label, stylesheet: entry.stylesheet, status: entry.status
    };
  }
  if (!themes.standard || themes.standard.stylesheet !== "/assets/themes/standard.css" ||
      themes.standard.status !== "baseline") {
    themes.standard = { label: "Standard", stylesheet: "/assets/themes/standard.css", status: "baseline" };
  }
  return { defaultTheme: DEFAULT_THEME, themes };
}
export async function readThemeRegistry(fetcher = fetch) {
  try {
    const response = await fetcher("/data/theme_registry.json", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw Error("Theme registry unavailable");
    return validatedThemeRegistry(await response.json());
  } catch {
    return validatedThemeRegistry({});
  }
}
export function initThemeRuntime(doc = document) {
  const root = doc.documentElement;
  if (!root) return null;
  if (!root.dataset.rosieTheme) root.dataset.rosieTheme = DEFAULT_THEME;
  let inflight = false;
  const manager = {
    get active() { return root.dataset.rosieTheme || DEFAULT_THEME; },
    async available() { return readThemeRegistry(); },
    async previewTheme(themeId) {
      if (inflight || !THEME_ID.test(String(themeId || ""))) return false;
      const registry = await readThemeRegistry();
      const entry = registry.themes[themeId];
      if (!entry || (entry.status !== "approved" && themeId !== DEFAULT_THEME)) return false;
      if (themeId === DEFAULT_THEME) {
        doc.getElementById("rosie-future-theme-sheet")?.remove();
        root.dataset.rosieTheme = DEFAULT_THEME;
        return true;
      }
      // Only explicitly approved same-origin stylesheets may be previewed.
      inflight = true;
      try {
        const link = doc.createElement("link");
        link.rel = "stylesheet";
        link.id = "rosie-future-theme-sheet";
        link.href = entry.stylesheet;
        await new Promise((resolve, reject) => {
          link.addEventListener("load", resolve, { once: true });
          link.addEventListener("error", reject, { once: true });
          doc.head.append(link);
        });
        root.dataset.rosieTheme = themeId;
        return true;
      } catch {
        doc.getElementById("rosie-future-theme-sheet")?.remove();
        root.dataset.rosieTheme = DEFAULT_THEME;
        return false;
      } finally {
        inflight = false;
      }
    }
  };
  // In-memory preview only: user or owner preferences require a future approved design.
  return manager;
}
