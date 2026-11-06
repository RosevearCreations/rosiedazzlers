/** Build 781: source-owned, read-only integration readiness facts.
 * This is NOT a remote connectivity probe, approval registry, or signed receipt.
 */
const SHA=/^[a-f0-9]{40}$/i;
export const QL781_GATES=Object.freeze([
  {id:'original-source-proof',state:'HOLD',responsible:'original_source_issuer',
    next:'Independently authenticate original Proof-B and pin its genuine public signer.'},
  {id:'source-child-isolation',state:'HOLD',responsible:'rosie_source_owner',
    next:'Review original data backup, tenant-child separation and source shell migration before enabling its signer.'},
  {id:'independent-broker-trust',state:'HOLD',responsible:'ai_data_platform_broker',
    next:'Verify isolated workload, manifest, managed broker/source key handles and atomic nonce stores.'},
  {id:'independent-receiver-state',state:'HOLD',responsible:'comms_hub_original_issuer',
    next:'Independently verify the original QL-344 receiver-OFF evidence and original issuer provenance.'},
  {id:'separate-test-consent',state:'HOLD',responsible:'original_owner_and_source_owner',
    next:'Ree and Jack separately review and sign exactly scoped, expiring TEST decisions via the private ceremony.'},
  {id:'original-signed-test-receipts',state:'HOLD',responsible:'independent_gateway_witness',
    next:'Only after private authorization verify two signed GET receipts and all seven original denials.'}
]);
export function connectionStatus781({revision,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Finite server time required');
  return {ok:true,build:781,read_only:true,
    schema:'rosie.comms.ql781.source-connection-status.v1',
    observed_at:new Date(now).toISOString(),
    production_source_revision_reference:SHA.test(revision||'')?revision:null,
    source_app_id:'rosiedazzlers',shell_id:'rosiedazzlers',first_child:'rosie-dazzlers',
    contract:'rosevear.shell.nonproduction.v1',
    requested_environment:'nonproduction',connection_state:'DISCONNECTED / HOLD',
    source_shell_routes:[
      {path:'/api/integration/v1/shell/health',method:'GET',expected_http_status:503},
      {path:'/api/integration/v1/shell/capabilities',method:'GET',expected_http_status:503}
    ],
    legacy_v1_routes_are_separate:true,local_interface_check_possible:true,
    original_source_proof_b_verified:false,
    signed_original_source_test_receipts_verified:false,
    original_master_test_receipts_verified:false,
    independently_verified_receiver_running:false,
    independent_owner_and_source_owner_test_approval:false,
    current_shell_signed_gets:0,actual_remote_handshakes:0,
    source_customer_data_transferred:false,
    eligible_to_start_test:false,private_receiver_activation_allowed:false,
    provider_calls_enabled:false,customer_contact_enabled:false,
    production_writes:false,source_writes:false,
    network_requests_by_status_check:0,
    outstanding_gates:QL781_GATES.map(x=>({...x})),
    next_authorized_step:'Privately reconcile original issuer evidence and separately sign the future scoped owner TEST request; no network action now.'};
}
