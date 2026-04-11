// assets/admin-runtime.js
//
// Shared helper for session-first admin/detailer pages.
// - keeps credentials on every request
// - optionally adds the legacy x-admin-password bridge
// - normalizes JSON and network errors
// - provides small actor/status helpers for internal screens

(function attachAdminRuntime(globalScope) {
  async function requestJson(url, options = {}) {
    const method = String(options.method || (options.body === undefined ? 'GET' : 'POST')).toUpperCase();
    const headers = {
      ...(options.headers || {})
    };

    if (options.password) {
      headers['x-admin-password'] = String(options.password || '').trim();
    }

    const init = {
      method,
      credentials: options.credentials || 'include',
      cache: options.cache || 'no-store',
      headers,
      redirect: options.redirect || 'follow'
    };

    if (options.body !== undefined) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    let response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: err && err.message ? err.message : 'Network request failed.'
      };
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok && (!data || data.ok !== false),
      status: response.status,
      data,
      response,
      error:
        (data && data.error) ||
        (!response.ok ? `Request failed (${response.status}).` : null)
    };
  }

  function actorLabel(actor) {
    if (!actor) return 'No signed-in staff session detected.';
    const name = actor.full_name || actor.assignment_label || actor.email || 'staff';
    const role = actor.role_code || 'staff';
    return `Signed in as ${name} (${role}).`;
  }

  function bridgeLabel(actor, password) {
    if (password) {
      return actor
        ? `${actorLabel(actor)} Legacy password bridge is filled and available only as fallback.`
        : 'Legacy password bridge is available as a fallback for older routes.';
    }

    return actor
      ? `${actorLabel(actor)} Legacy password bridge is optional here.`
      : 'No signed-in staff session detected. Legacy password bridge is still available as a fallback.';
  }

  function normalizeError(result, fallbackMessage) {
    if (!result) return fallbackMessage || 'Unexpected error.';
    return result.error || fallbackMessage || 'Unexpected error.';
  }

  globalScope.AdminRuntime = {
    requestJson,
    actorLabel,
    bridgeLabel,
    normalizeError
  };
})(window);
