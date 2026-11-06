/** Download an unsigned owner-renewal template only. No remote I/O. */
const button=document.getElementById('download784');
button?.addEventListener('click',()=>{
  const template={schema:'rosie.comms.source-test-authorization.v1',
    status:'DRAFT_UNSIGNED_DOES_NOT_AUTHORIZE_A_TEST',source:'rosiedazzlers',
    tenant:'rosie-dazzlers',audience:'rosevear-comms-hub:nonproduction',
    environment:'TEST',methods:['GET'],paths:[
      '/api/integration/v1/shell/health',
      '/api/integration/v1/shell/capabilities'],maxRequests:9,
    requiredPositiveGetReceipts:2,requiredDenialReceipts:7,
    requiredIndependentRoles:['original-source-get-signer','private-broker-signer',
      'ree-source-owner','jack-master-owner'],
    maximumOwnerWindowMinutes:15,maximumGetLifetimeSeconds:90,
    sourceKeyPin:'REQUIRES_INDEPENDENT_OUT_OF_BAND_PIN',
    brokerKeyPin:'REQUIRES_INDEPENDENT_OUT_OF_BAND_PIN',
    issuedAt:'TO_BE_SET_BY_ORIGINAL_AUTHORIZED_OPERATOR',
    expiresAt:'TO_BE_SET_BY_ORIGINAL_AUTHORIZED_OPERATOR',
    sourceOwnerDecision:'NOT_SIGNED',masterOwnerDecision:'NOT_SIGNED',
    originalDeviceEnrollmentVerified:false,sourceEnrollmentVerified:false,
    brokerReceiptVerified:false,connected:false,connection:'DISCONNECTED / HOLD'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(template,null,2)+'\n'],
    {type:'application/json'}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download='rosie-build784-unsigned-test-renewal.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  const status=document.getElementById('status784');
  if(status)status.textContent='Unsigned template downloaded · original owner approval, source GET signatures and broker receipts remain NOT VERIFIED / HOLD.';
});
