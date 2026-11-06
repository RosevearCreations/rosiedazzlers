/** Build 785 — offline unsigned register, not a live TEST dispatch. */
const cases=[
  'allowed_health_get','allowed_capabilities_get','missing_authentication',
  'invalid_credential','expired_credential','wrong_tenant','wrong_audience',
  'replayed_nonce','untrusted_source_signer'];
document.getElementById('download785')?.addEventListener('click',()=>{
  const packet={schema:'rosie.comms.first-broker-test-witness-register.v1',
    source:'rosiedazzlers',tenant:'rosie-dazzlers',
    audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
    status:'UNSIGNED_READINESS_ONLY_NOT_AUTHORIZATION_OR_ORIGINAL_RECEIPT',
    originalIssuerIndependentlyVerified:false,
    sourceSignerOriginalCustodyVerified:false,
    sourceOwnerSignedCurrentTestDecisionVerified:false,
    masterOwnerSignedCurrentTestDecisionVerified:false,
    authenticatedPrivateBrokerOperatorVerified:false,
    originalDeviceEnrollmentVerified:false,
    sourceEnrollmentVerified:false,
    originalBrokerReceiptsVerified:0,
    connected:false,connection:'DISCONNECTED / HOLD',
    slots:cases.map((slot,index)=>({index:index+1,case:slot,
      originalSignedReceipt:'NOT_RECEIVED',
      independentWitnessVerification:'NOT_PERFORMED'}))};
  const objectUrl=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)+'\n'],
    {type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=objectUrl;
  anchor.download='rosie-build785-unsigned-nine-receipt-register.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  const status=document.getElementById('status785');
  if(status)status.textContent='Unsigned nine-slot template downloaded. Original source custody, separate owner consent and all genuine broker receipts remain NOT VERIFIED / HOLD.';
});
