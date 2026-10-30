#!/usr/bin/env node
/**
 * QL-261 / QL-258: original, sanitized owner progress packet.
 * Never accepts identity, network addresses, private keys, tokens or test approval.
 */
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const QL258_FIELDS = Object.freeze([
  'privateCustodian','independentWitness','independentReviewer',
  'privateHost','signerPresence','outOfBandPin','tenantIsolation'
]);
export const QL258_ALLOWED = Object.freeze([
  'NOT_REPORTED','OWNER_REPORTS_IN_PROGRESS','OWNER_REPORTS_DONE_NOT_VERIFIED'
]);
export const QL258_RELEASE =
  'ql258-six-app-owner-custody-checklist-public-source-recheck-held-v1';

export function sanitizedRosieOwnerPacket261(progress = {}) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress) ||
      Object.keys(progress).some(key => !QL258_FIELDS.includes(key)))
    throw Error('Unknown owner progress fields rejected');
  const fields = {};
  for (const key of QL258_FIELDS) {
    if (key === 'tenantIsolation') {
      if (Object.hasOwn(progress,key) && progress[key] !== 'NOT_APPLICABLE')
        throw Error('Tenant isolation is not applicable to Rosie Dazzlers');
      fields[key] = 'NOT_APPLICABLE';
      continue;
    }
    const value = Object.hasOwn(progress,key) ? progress[key] : 'NOT_REPORTED';
    if (!QL258_ALLOWED.includes(value)) throw Error('Unsafe owner progress value rejected');
    fields[key] = value;
  }
  return {
    release:QL258_RELEASE,system:'rosiedazzlers',repository:'rosiedazzlers',
    publicGitHubSnapshot:{
      observed:'29 October 2026',
      mainSha:'69afa528d28ee1df3ad200cc5da0cf4a3c2acbf9',
      requiredPath:'docs/integration/ql246-source-proof.json',
      httpStatusAtObservedSha:404
    },
    ownerReportedUnverifiedProgress:fields,
    independentCustodyAuthenticated:false,sourceProofAccepted:false,
    ownerTestAuthorization:'NOT_GIVEN',authenticatedGatewayGets:0,
    connection:'DISCONNECTED',livePilotHolds:12,
    disposition:'OWNER_SELF_REPORT_ONLY_NOT_SECURITY_EVIDENCE_HELD'
  };
}

export function parseOwnerProgressCli261(argv) {
  if (argv.length % 2 !== 0) throw Error('Use --step field=STATUS for each progress update');
  const progress = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (argv[i] !== '--step') throw Error('Only --step field=STATUS is accepted');
    const entry = argv[i+1].split('=');
    if (entry.length !== 2 || !QL258_FIELDS.includes(entry[0]) || Object.hasOwn(progress,entry[0]))
      throw Error('Unknown or duplicated progress step rejected');
    progress[entry[0]] = entry[1];
  }
  return progress;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const packet = sanitizedRosieOwnerPacket261(parseOwnerProgressCli261(process.argv.slice(2)));
    process.stdout.write(JSON.stringify(packet,null,2)+'\n');
  } catch (error) {
    process.stderr.write('QL-261 owner packet rejected: '+error.message+'\n');
    process.exitCode = 1;
  }
}
