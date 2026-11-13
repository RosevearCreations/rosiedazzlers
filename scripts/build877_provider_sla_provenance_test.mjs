import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assessOriginalResendEnrollment,compareRemoteSigningSecret}
 from '../functions/api/_lib/roadside-provider-enrollment-v877.js';
import {auditOriginalEscalationSla,summarizeOriginalEscalationSla}
 from '../functions/api/_lib/roadside-sla-audit-v877.js';
import {issueOwnerClosureProvenance}
 from '../functions/api/_lib/roadside-provenance-issuer-v877.js';
const files=['functions/api/_lib/roadside-provider-enrollment-v877.js',
 'functions/api/admin/roadside_provider_enrollment_v877.js',
 'functions/api/_lib/roadside-sla-audit-v877.js',
 'functions/api/admin/roadside_sla_audit_v877.js',
 'functions/api/_lib/roadside-provenance-issuer-v877.js',
 'functions/api/admin/roadside_provenance_renew_v877.js',
 'functions/api/_lib/roadside-artifact-verify-v876.js',
 'functions/api/admin/roadside_closure_export_v874.js',
 'assets/admin-booking-v877.js'];
const read=f=>readFileSync(f,'utf8');
for(const f of files)execFileSync('node',['--check',f],{stdio:'pipe'});
const html=read('admin-booking.html');
assert.equal(html,read('admin-booking/index.html'),'Canonical and mirror booking UI must match');
for(const key of ['rd877Enrollment','rd877EnrollmentStatus','rd877Sla','rd877SlaStatus',
 'rd877Artifact','rd877Renew','rd877ProvenanceStatus',
 '/assets/admin-booking-v877.js'])assert(html.includes(key));
const enrollment=read('functions/api/admin/roadside_provider_enrollment_v877.js');
for(const key of ['allowLegacyAdminFallback:false','access.auth_mode!==\'session\'',
 'https://api.resend.com','/webhooks','compareRemoteSigningSecret'])
 assert(enrollment.includes(key));
assert(!enrollment.includes('method:\'POST\''));
const configured={provider:'resend_svix',apiKeyPresent:true,signingSecretPresent:true};
const remote={object:'webhook',id:'00000000-0000-4000-8000-000000000877',
 endpoint:'https://rosiedazzlers.ca/api/roadside_native_resend_v875',status:'enabled',
 events:['email.delivered','email.bounced','email.failed']};
const ok=assessOriginalResendEnrollment({configured,remote});
assert.equal(ok.enrollment_verified,true);
assert.equal(ok.signing_key_binding_verified,false,'Webhook registration alone never proves signing key');
for(const patch of [{endpoint:'https://other.example.com/receiver'},
 {status:'disabled'},{events:['email.delivered']},{id:'wrong'}])
 assert.equal(assessOriginalResendEnrollment({configured,remote:{...remote,...patch}}).enrollment_verified,false);
assert.equal(assessOriginalResendEnrollment({configured,remote,hasMore:true}).enrollment_verified,false);
assert.equal(assessOriginalResendEnrollment({configured:{...configured,apiKeyPresent:false},remote}).enrollment_verified,false);
assert.equal(await compareRemoteSigningSecret('whsec_'+ 'a'.repeat(39),'whsec_'+ 'a'.repeat(39)),true);
assert.equal(await compareRemoteSigningSecret('whsec_'+ 'a'.repeat(39),'whsec_'+ 'b'.repeat(39)),false);
const now=Date.parse('2026-11-13T15:00:00.000Z');
const critical={severity:'CRITICAL',owner_alert:true,reason:'refund drift'};
const opened=new Date(now-61*60000).toISOString();
const early=new Date(now-20*60000).toISOString();
const overdue=auditOriginalEscalationSla({policy:critical,cases:[{state:'open',opened_at:opened}],nowMs:now});
assert.equal(overdue.state,'SLA_BREACHED');
assert.equal(overdue.breached,true);
assert.equal(overdue.original_case_opened_at,opened);
assert.equal(auditOriginalEscalationSla({policy:critical,cases:[{state:'reviewed_hold',opened_at:early}],nowMs:now}).state,'SLA_WITHIN_POLICY');
assert.equal(auditOriginalEscalationSla({policy:critical,cases:[],nowMs:now}).state,'SLA_UNANCHORED_HOLD');
assert.equal(auditOriginalEscalationSla({policy:{severity:'NONE',owner_alert:false},cases:[],nowMs:now}).state,'NO_CURRENT_ALERT');
assert.equal(auditOriginalEscalationSla({policy:critical,cases:[{state:'closed_verified',opened_at:opened}],nowMs:now}).state,'SLA_UNANCHORED_HOLD');
assert.equal(summarizeOriginalEscalationSla([overdue],{partial:true}).manual_owner_attention,true);
const sla=read('functions/api/admin/roadside_sla_audit_v877.js');
assert(sla.includes('refundReadback(env,bookingId)'));
assert(sla.includes('auditOriginalEscalationSla({policy,cases,nowMs:now})'));
assert(sla.includes('allowLegacyAdminFallback:false'));
const issuer=read('functions/api/admin/roadside_provenance_renew_v877.js');
assert(issuer.indexOf('verifyOriginalArtifact(')<issuer.indexOf('issueOwnerClosureProvenance('));
assert(issuer.includes('ROSIE_CLOSURE_ISSUER_ED25519_PRIVATE_JWK'));
assert(issuer.includes('ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK'));
assert(issuer.includes('source?.historical_artifact_revalidated!==true'));
assert(read('functions/api/admin/roadside_closure_export_v874.js')
 .includes('provider_event_id,provider_message_id,event_type'));
const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const privateJwk=await webcrypto.subtle.exportKey('jwk',pair.privateKey);
const publicJwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);
const draftId='00000000-0000-4000-8000-000000000801',closureId='00000000-0000-4000-8000-000000000805';
const digest=createHash('sha256').update('original source-bound artifact').digest('hex');
const proof=await issueOwnerClosureProvenance({privateJwk,publicJwk,draftId,closureId,
 artifactDigest:digest,nowIso:'2026-11-13T15:00:00.000Z'});
assert.equal(proof.ok,true,JSON.stringify(proof));
assert.equal(proof.owner_key_signature_verified,true);
assert.equal(proof.payload.external_independent_witness,false);
const signature=Buffer.from(proof.signature_ed25519.replace(/-/g,'+').replace(/_/g,'/'),'base64');
assert.equal(await webcrypto.subtle.verify('Ed25519',pair.publicKey,
 signature,new TextEncoder().encode(JSON.stringify(proof.payload))),true);
assert.equal(await webcrypto.subtle.verify('Ed25519',pair.publicKey,
 signature,new TextEncoder().encode(JSON.stringify({...proof.payload,closure_id:draftId}))),false);
const stranger=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const strangerPublic=await webcrypto.subtle.exportKey('jwk',stranger.publicKey);
assert.equal((await issueOwnerClosureProvenance({privateJwk,publicJwk:strangerPublic,
 draftId,closureId,artifactDigest:digest})).ok,false);
assert.equal((await issueOwnerClosureProvenance({privateJwk,publicJwk,
 draftId,closureId,artifactDigest:'invalid'})).ok,false);
console.log('Rosie 877: original provider registration, anchored owner SLA, signed independent-key issuer renewal PASS');
