// Build 342 — resilient universal public page-editor bootstrap.
// Historical Build 341 contract: import('/assets/universal-page-editor.js?v=20260906build341')
(async function bootRosieUniversalPageEditor(){
  try {
    const module = await import('/assets/universal-page-editor-build342.js?v=20260906build342');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => module.initUniversalPageEditor?.(document), { once: true });
    } else {
      await module.initUniversalPageEditor?.(document);
    }
  } catch (error) {
    console.warn('Optional universal page editor could not start; source page content remains active.', error);
  }
})();