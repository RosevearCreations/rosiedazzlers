// Build 289 — accessible, user-initiated My Account recovery.
// This adapter never retries writes or polls in the background.
(function accountResilienceV289() {
  const normalizedPath = String(location.pathname || '/').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
  if (normalizedPath !== '/my-account') return;

  const notice = document.getElementById('accountNotice');
  if (!notice) return;

  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.setAttribute('aria-atomic', 'true');
  notice.setAttribute('tabindex', '-1');
  document.documentElement.dataset.build289AccountResilience = 'ready';

  if (!document.querySelector('link[data-build289-account-accessibility]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/account-accessibility-v289.css';
    link.dataset.build289AccountAccessibility = 'true';
    document.head.appendChild(link);
  }

  const recovery = document.createElement('section');
  recovery.className = 'account-recovery-v289';
  recovery.hidden = true;
  recovery.setAttribute('aria-labelledby', 'accountRecoveryTitle289');
  recovery.innerHTML = `
    <h2 id="accountRecoveryTitle289">Account access</h2>
    <p id="accountRecoveryCopy289">Sign in to load your Rosie Dazzlers account.</p>
    <form id="accountRecoverySignIn289" class="form" autocomplete="on">
      <div class="form-grid two-col">
        <label>Email<input id="accountRecoveryEmail289" name="email" type="email" autocomplete="email" required /></label>
        <label>Password<input id="accountRecoveryPassword289" name="password" type="password" autocomplete="current-password" required /></label>
      </div>
      <div class="actions">
        <button id="accountRecoverySignInBtn289" class="btn primary" type="submit">Sign in</button>
        <button id="accountRecoveryRetry289" class="btn ghost" type="button">Retry account load</button>
      </div>
    </form>
    <div id="accountRecoveryStatus289" class="account-recovery-v289-status" role="status" aria-live="polite" aria-atomic="true"></div>`;
  notice.insertAdjacentElement('afterend', recovery);

  const form = recovery.querySelector('#accountRecoverySignIn289');
  const signInButton = recovery.querySelector('#accountRecoverySignInBtn289');
  const retryButton = recovery.querySelector('#accountRecoveryRetry289');
  const copy = recovery.querySelector('#accountRecoveryCopy289');
  const status = recovery.querySelector('#accountRecoveryStatus289');

  function show(mode) {
    recovery.hidden = false;
    const signedOut = mode === 'signed-out';
    form.querySelectorAll('label').forEach((label) => { label.hidden = !signedOut; });
    signInButton.hidden = !signedOut;
    retryButton.hidden = signedOut;
    copy.textContent = signedOut
      ? 'Your account session is not active. Sign in here to continue.'
      : 'We could not reach your account data. Check your connection, then retry when you are ready.';
  }

  function hide() {
    recovery.hidden = true;
    status.textContent = '';
  }

  function classifyNotice() {
    const text = String(notice.textContent || '').trim().toLowerCase();
    if (!text) return;
    if (text.includes('account loaded') || text.includes('account ready')) return hide();
    if (text.includes('unauthorized') || text.includes('sign in') || text.includes('not authenticated')) return show('signed-out');
    if (text.includes('could not load') || text.includes('failed') || text.includes('unavailable') || text.includes('network')) return show('retry');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.ClientAuth || typeof window.ClientAuth.signIn !== 'function') {
      status.textContent = 'Sign-in service is unavailable on this page. Please retry the page load.';
      return;
    }
    signInButton.disabled = true;
    status.textContent = 'Signing in…';
    try {
      await window.ClientAuth.signIn({
        email: recovery.querySelector('#accountRecoveryEmail289').value.trim(),
        password: recovery.querySelector('#accountRecoveryPassword289').value
      });
      status.textContent = 'Signed in. Reloading your account…';
      location.reload();
    } catch (error) {
      status.textContent = error && error.message ? error.message : 'Sign-in failed.';
      signInButton.disabled = false;
    }
  });

  retryButton.addEventListener('click', () => {
    status.textContent = 'Retrying account load…';
    location.reload();
  });

  new MutationObserver(classifyNotice).observe(notice, { childList: true, characterData: true, subtree: true });
  classifyNotice();
})();
