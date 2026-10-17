// Build 566: read-only inventory; NEVER attest external provider readiness.
// These are configuration NAMES from Build 564, not secret values.
export const REQUIRED_PROVIDER_NAMES_566=Object.freeze([
 'DAIP_WORKER_IDENTITY_PROVIDER_URL',
 'DAIP_WORKER_IDENTITY_PROVIDER_TOKEN',
 'DAIP_CONSENT_PROVIDER_URL',
 'DAIP_CONSENT_PROVIDER_TOKEN',
 'DAIP_LEDGER_AUTHORITY_REFERENCE',
 'SUPABASE_URL',
 'SUPABASE_SERVICE_ROLE_KEY'
]);
export const EXTERNAL_EVIDENCE_566=Object.freeze([
 'trusted_worker_identity_and_registered_signature',
 'verified_current_derivative_scoped_consent',
 'approved_562_564_schema_and_recovery',
 'atomic_replay_conflict_and_server_digest',
 'exact_main_sha_cloudflare_runtime_business',
 'authenticated_human_private_media_acceptance'
]);
// Only accept a list of exact variable names; do not inspect process.env or network.
export function reconcileProviderReadiness566({declaredVariableNames=[]}={}){
 const names=Array.isArray(declaredVariableNames)?declaredVariableNames.filter(
  x=>typeof x==='string'&&REQUIRED_PROVIDER_NAMES_566.includes(x)
 ):[];
 const declared=[...new Set(names)];
 const missing=REQUIRED_PROVIDER_NAMES_566.filter(n=>!declared.includes(n));
 return Object.freeze({
   build:566,
   kind:'non_secret_inventory_only',
   missing_declaration_names:Object.freeze(missing),
   declared_names:Object.freeze(declared),
   unverified_external_evidence:Object.freeze([...EXTERNAL_EVIDENCE_566]),
   operational_status:'HOLD',
   credential_configuration_verified:false,
   provider_api_verified:false,
   sql_migration_applied:false,
   private_runtime_accepted:false,
   public_release_allowed:false,
   public_export_allowed:false,
   worker_dispatched:false,
   storage_written:false,
   payment_or_booking_changed:false
 });
}
