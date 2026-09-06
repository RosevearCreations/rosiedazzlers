// Build 343 — page-wide live editor runtime for public RosieDazzlers content pages.
// Keeps the Build 341 server-authorized editor implementation, broadens mature-page root
// compatibility, makes the Admin edit control unmistakable, and protects shared chrome.

import { initUniversalPageEditor as initBuild341Editor } from '/assets/universal-page-editor.js?v=20260906build343-core';

const SHARED_CHROME_SELECTOR = [
  '.nav',
  'header',
  'footer',
  '[data-footer]',
  '#rosieStickyCtaBar',
  '[data-rd-quickbar="1"]',
  '.rosie-page-editor-toggle',
  '.rosie-page-editor-panel'
].join(',');

let chromeObserver = null;
let editorObserver = null;
let resizeBound = false;

export async function initUniversalPageEditor(root = document) {
  const pageRoot = resolvePageRoot(root);
  if (!pageRoot) return;

  markSharedChromeIgnored(root);
  installPageWideEditorStyles();

  const compatibilityRoot = root.querySelector?.('main') === pageRoot
    ? root
    : {
        querySelector(selector) {
          if (selector === 'main') return pageRoot;
          return root.querySelector?.(selector) || null;
        }
      };

  await initBuild341Editor(compatibilityRoot);
  watchEditorUi();
  watchEditorChrome();
}

function resolvePageRoot(root) {
  const explicitRoot = root.querySelector?.('[data-page-editor-root]');
  if (explicitRoot) return explicitRoot;

  const semanticMain = root.querySelector?.('main');
  if (semanticMain) return semanticMain;

  const mainByRole = root.querySelector?.('[role="main"]');
  if (mainByRole) return mainByRole;

  const mainById = root.querySelector?.('#main-content');
  if (mainById) return mainById;

  // Mature Rosie pages pre-date semantic <main> and use one top-level content container.
  const containers = Array.from(root.querySelectorAll?.('body > .container') || [])
    .filter((node) => !node.matches?.('[data-footer], footer') && !node.closest?.('[data-page-editor-ui]'));
  return containers[0] || null;
}

function markSharedChromeIgnored(root) {
  root.querySelectorAll?.(SHARED_CHROME_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) node.setAttribute('data-page-editor-ignore', 'true');
  });
}

function installPageWideEditorStyles() {
  if (document.getElementById('rosiePageWideEditorStyles')) return;
  const style = document.createElement('style');
  style.id = 'rosiePageWideEditorStyles';
  style.setAttribute('data-page-editor-ui', 'true');
  style.textContent = `
    .rosie-page-editor-toggle{
      z-index:2147483000 !important;
      min-width:150px !important;
      box-shadow:0 10px 30px rgba(0,0,0,.35) !important;
    }
    body.rosie-page-edit-mode [data-page-editor-editable="true"]{
      outline:2px dashed rgba(96,165,250,.95) !important;
      outline-offset:4px !important;
      cursor:pointer !important;
      transition:outline-color .15s ease,box-shadow .15s ease !important;
    }
    body.rosie-page-edit-mode img[data-page-editor-editable="true"]{
      box-shadow:0 0 0 4px rgba(59,130,246,.18) !important;
    }
    body.rosie-page-edit-mode [data-page-editor-editable="true"]:hover{
      outline-color:#f59e0b !important;
      box-shadow:0 0 0 4px rgba(245,158,11,.15) !important;
    }
    body.rosie-page-edit-mode [data-page-editor-selected="true"]{
      outline:3px solid #f59e0b !important;
      outline-offset:4px !important;
    }
  `;
  document.head.appendChild(style);
}

function watchEditorUi() {
  syncEditorToggleLabel();
  setTimeout(syncEditorToggleLabel, 80);
  setTimeout(syncEditorToggleLabel, 350);
  setTimeout(syncEditorToggleLabel, 1000);

  if (editorObserver || !document.body) return;
  editorObserver = new MutationObserver(() => {
    markSharedChromeIgnored(document);
    syncEditorToggleLabel();
  });
  editorObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

function syncEditorToggleLabel() {
  const toggle = document.querySelector('.rosie-page-editor-toggle');
  if (!(toggle instanceof HTMLButtonElement)) return;
  const editing = document.body.classList.contains('rosie-page-edit-mode');
  const expected = editing ? 'Finish editing' : 'Edit this page';
  if (toggle.textContent !== expected) toggle.textContent = expected;
  toggle.setAttribute('aria-label', editing ? 'Finish editing this page' : 'Edit text and images on this page');
  toggle.title = editing ? 'Finish page editing' : 'Edit text and images directly on this page';
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
    markSharedChromeIgnored(document);
    positionEditorToggle();
    syncEditorToggleLabel();
  });
  chromeObserver.observe(document.body, { childList: true, subtree: true });
}

function positionEditorToggle() {
  const toggle = document.querySelector('.rosie-page-editor-toggle');
  if (!(toggle instanceof HTMLElement)) return;

  const sticky = document.querySelector('#rosieStickyCtaBar, #stickyBooking, [data-rd-quickbar="1"]');
  if (!(sticky instanceof HTMLElement)) {
    toggle.style.bottom = window.innerWidth <= 640 ? '12px' : '18px';
    return;
  }

  const rect = sticky.getBoundingClientRect();
  const visibleHeight = Math.max(0, window.innerHeight - Math.max(0, rect.top));
  const gap = window.innerWidth <= 640 ? 12 : 14;
  toggle.style.bottom = `${Math.max(window.innerWidth <= 640 ? 12 : 18, Math.ceil(visibleHeight + gap))}px`;
}
