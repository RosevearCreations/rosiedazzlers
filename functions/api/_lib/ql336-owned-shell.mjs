/** QL-336 preparation: never confuse Rosie's existing business with a
 * provisioned, reusable auto-detailing platform shell. No trust bootstrap here. */
import {handleQl364SourceHealth} from './ql364-source-health.mjs';
export const SHELL_ID='rosiedazzlers';
export const FIRST_CHILD='rosie-dazzlers';
export const CONTRACT='rosevear.shell.nonproduction.v1';
export const PATHS=Object.freeze(['/api/integration/v1/shell/health',
  '/api/integration/v1/shell/capabilities']);

const headers={'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'};
const response=(status,code)=>new Response(JSON.stringify({status:code,contract:CONTRACT,
  shell_id:SHELL_ID,connection_state:'DISCONNECTED / HOLD',authenticated:false,
  child_data_included:false,customer_data_included:false,provider_operations_enabled:false,
  original_source_signer_verified:false}),{status,headers});

export function evaluateShellRequest(request){
  const url=new URL(request.url);
  if(request.method!=='GET')return {status:405,code:'DENY_METHOD'};
  if(!PATHS.includes(url.pathname)||url.search||url.hash)return {status:404,code:'DENY_SCOPE'};
  // Neither an unverified child selection nor a legacy business credential
  // can authorize shell-wide access. All child paths belong to the source app.
  if([...request.headers.keys()].some(k=>/^(x-rosevear-(business|tenant|child)|x-child-id)$/.test(k)))
    return {status:403,code:'DENY_CHILD_IDENTITY_AS_SHELL'};
  return {status:503,code:'HOLD_ORIGINAL_SIGNER_CHILD_ISOLATION_AND_TEST_APPROVAL'};
}
export async function onRequest({request}){
  if(request.headers.has('x-rosevear-ql362-request'))
    return handleQl364SourceHealth({request,sourceId:'rosiedazzlers',
      repository:'rosiedazzlers'});
  const gate=evaluateShellRequest(request);
  return response(gate.status,gate.code);
}
