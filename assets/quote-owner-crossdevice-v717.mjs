const checks=['acceptDesktop714','acceptMobile714','acceptRoles714','acceptEvidence714','acceptNoSend714'];
export function acceptedDeviceReceipt717(receipt,kind){
  if(!receipt||receipt.app!=='Rosie Dazzlers'||![715,716,717].includes(receipt.build)||
    receipt.receipt_kind!=='owner_self_attested_local_visual_review'||
    receipt.feedback_disposition!=='accepted'||receipt.server_acceptance_recorded!==false||
    !receipt.owner_name?.trim()||!receipt.device_findings_note?.trim()||
    !checks.every(key=>receipt.checked?.[key]===true)||!Number.isFinite(Date.parse(receipt.generated_at))||
    !['desktop','mobile'].includes(kind))return null;
  return {kind,owner_name:receipt.owner_name.trim(),generated_at:receipt.generated_at,
    note:String(receipt.device_findings_note).slice(0,300)};
}
export function crossDeviceReceipt717(originalHash,original,desktop,mobile,remedy,now=new Date()){
  if(!/^[a-f0-9]{64}$/.test(originalHash)||!original||
    !Number.isFinite(Date.parse(original.generated_at))||
    !desktop?.hash||!mobile?.hash||desktop.hash===mobile.hash||
    !/^[a-f0-9]{64}$/.test(desktop.hash)||!/^[a-f0-9]{64}$/.test(mobile.hash)||
    remedy?.trim().length<20||remedy.trim().length>300)return null;
  const a=acceptedDeviceReceipt717(desktop.receipt,'desktop'),
    b=acceptedDeviceReceipt717(mobile.receipt,'mobile');
  if(!a||!b||a.owner_name!==b.owner_name||
    Date.parse(a.generated_at)<=Date.parse(original.generated_at)||
    Date.parse(b.generated_at)<=Date.parse(original.generated_at)||
    [a,b].some(d=>Date.parse(d.generated_at)>now.getTime()+300000||
      now.getTime()-Date.parse(d.generated_at)>30*86400000))return null;
  return {app:'Rosie Dazzlers',build:717,receipt_kind:'owner_cross_device_local_remediation_review',
    generated_at:now.toISOString(),owner_name:a.owner_name,
    original_unresolved_feedback_sha256:originalHash,original_feedback_build:original.build,
    source_receipts:[{device:'desktop',sha256:desktop.hash,observed_at:a.generated_at,note:a.note},
      {device:'mobile',sha256:mobile.hash,observed_at:b.generated_at,note:b.note}],
    actual_remediation_note:remedy.trim(),all_5_checks_claimed_on_both_devices:true,
    receipts_independently_witnessed:false,server_acceptance_recorded:false,
    devices_technically_verified_by_server:false,customer_contacted:false,
    grants_consent:false,closes_audit:false};
}
