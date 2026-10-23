import { validateThemeDraft } from './theme-preview-contract.js';

export const ACTIVATION_SCHEMA = 'rosie-owner-theme-activation.v1';
export const PUBLIC_BASELINE = 'standard';
export const VIEWPORTS = Object.freeze(['mobile-360', 'mobile-390', 'tablet-768', 'desktop-1280']);
export const REQUIRED_SURFACES = Object.freeze(['public-home', 'public-services', 'public-booking', 'admin-dashboard', 'admin-theme-manager']);

export function validateActivationRequest(request) {
  const errors = [];
  if (request?.schema !== ACTIVATION_SCHEMA) errors.push('Activation schema is invalid.');
  if (request?.actorRole !== 'owner') errors.push('Only a verified owner may authorize an activation request.');
  if (request?.explicitAuthorization !== true) errors.push('Explicit owner authorization is required.');
  if (!request?.reviewReceipt?.theme?.review?.acknowledged || request?.reviewReceipt?.decision !== 'preview_reviewed_only') errors.push('An acknowledged owner review is required.');
  if (request?.reviewReceipt?.publicActivation !== false) errors.push('Preview receipt must be non-activating.');
  const draft = request?.reviewReceipt?.theme;
  if (!draft || validateThemeDraft(draft).length) errors.push('A valid non-public theme draft is required.');
  if (draft?.id === PUBLIC_BASELINE) errors.push('Standard cannot be activated as an alternative theme.');
  if (request?.candidateThemeId !== draft?.id || request?.candidateVersion !== draft?.version) errors.push('Versioned theme identity mismatch.');
  if (request?.sourceMainSha && !/^[a-f0-9]{40}$/.test(request.sourceMainSha)) errors.push('Main commit SHA is invalid.');
  for (const viewport of VIEWPORTS) for (const surface of REQUIRED_SURFACES) {
    if (request?.acceptance?.[viewport]?.[surface] !== true) errors.push(`Acceptance missing: ${viewport} / ${surface}.`);
  }
  if (request?.mediaAudit?.staticApproved !== true || request?.mediaAudit?.managedApproved !== true) errors.push('Static and managed media approvals must both be evidenced.');
  return errors;
}

export function createActivationRequest({ receipt, actorRole, actorName, authorized = false, acceptance = {}, mediaAudit = {} }) {
  const request = {schema:ACTIVATION_SCHEMA, action:'request-activation', actorRole, actorName,
    explicitAuthorization:authorized, candidateThemeId:receipt?.theme?.id, candidateVersion:receipt?.theme?.version,
    reviewReceipt:receipt, acceptance, mediaAudit, currentlyActivePublicTheme:PUBLIC_BASELINE,
    state:'hold-for-independent-review', requiresProtectedMainRelease:true,
    requiresExactMainProductionVerification:true, publicActivation:false};
  return {request, errors:validateActivationRequest(request)};
}

export function createRollbackPlan({ fromThemeId, toThemeId = PUBLIC_BASELINE, reason, actorRole }) {
  if (actorRole !== 'owner') throw Error('Verified owner authorization is required for rollback.');
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(String(fromThemeId||''))) throw Error('Invalid originating theme.');
  if (toThemeId !== PUBLIC_BASELINE) throw Error('Only Standard is a verified rollback target.');
  if (String(reason||'').trim().length < 10) throw Error('Rollback requires a meaningful reason.');
  return {schema:ACTIVATION_SCHEMA,action:'request-rollback',fromThemeId,toThemeId,
    reason:reason.trim(),state:'hold-for-independent-review',requiresProtectedMainRelease:true,
    requiresExactMainProductionVerification:true,publicActivation:false};
}
