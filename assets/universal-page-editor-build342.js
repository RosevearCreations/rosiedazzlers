// Build 342 — runtime compatibility adapter for the universal public-page editor.
// Some established public pages use body > .container instead of a semantic <main>.
// This adapter preserves the Build 341 editor/security implementation while supplying
// the correct editable content root and keeping the editor toggle clear of the sticky CTA.

import { initUniversalPageEditor as initBuild341Editor } from '/assets/universal-page-editor.js?v=20260906build341';

let chromeObserver = null;
let resizeBound = false;

export async function initUniversalPageEditor(root = document) {
  const pageRoot = resolvePageRoot(root);
  if (!pageRoot) return;

  const compatibilityRoot = root.querySelector?.('main')
    ? root
    : {
        querySelector(selector) {
          if (selector === 'main') return pageRoot;
          return root.querySelector?.(selector) || null;
        }
      };

  await initBuild341Editor(compatibilityRoot);
  watchEditorChrome();
}

function resolvePageRoot(root) {
  const semanticMain = root.querySelector?.('main');
  if (semanticMain) return semanticMain;

  const explicitRoot = root.querySelector?.('[data-page-editor-root]');
  if (explicitRoot) return explicitRoot;

  // Build 342 compatibility authority: many mature Rosie public pages use this shell.
  const container = root.querySelector?.('body > .container');
  if (container) return container;

  return null;
}

function watchEditorChrome() {
  positionEditorToggle();
  setTimeout(positionEditorToggle, 100);
  setTimeout(positionEditorToggle, 600);
  setTimeout(positionEditorToggle, 1400);

  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener('resize', positionEditorToggle, { passive: true });
  }

  if (chromeObserver || !document.body) return;
  chromeObserver = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.addedNodes?.length || mutation.removedNodes?.length)) return;
    positionEditorToggle();
  });
  chromeObserver.observe(document.body, { childList: true });
}

function positionEditorToggle() {
  const toggle = document.querySelector('.rosie-page-editor-toggle');
  if (!(toggle instanceof HTMLElement)) return;

  const sticky = document.querySelector('#rosieStickyCtaBar');
  if (!(sticky instanceof HTMLElement)) {
    toggle.style.bottom = window.innerWidth <= 640 ? '12px' : '18px';
    return;
  }

  const rect = sticky.getBoundingClientRect();
  const visibleHeight = Math.max(0, window.innerHeight - Math.max(0, rect.top));
  const gap = window.innerWidth <= 640 ? 12 : 14;
  toggle.style.bottom = `${Math.max(window.innerWidth <= 640 ? 12 : 18, Math.ceil(visibleHeight + gap))}px`;
}
