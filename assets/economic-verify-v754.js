const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_receipt_verify_v754';
const status=message=>{el('status754').textContent=message;};
const output=data=>{el('result754').textContent=JSON.stringify(data,null,2);};
const date=new Date();el('period754').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;

async function checkConfiguration(){
  try{
    const res=await fetch(endpoint,{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
    const body=await res.json();
    if(!res.ok||!body.ok)throw Error(body.error||'Sign in with manage_staff access to review receipt configuration.');
    const flags=body.configuration||{},ready=Object.values(flags).length===4&&Object.values(flags).every(Boolean);
    el('configuration754').textContent=ready?
      'Four public-key configuration fields are present; actual key independence and signature validity will be checked per request. Business closure remains HOLD.':
      'HOLD — Owner and independent source-witness public keys and IDs are not all configured on the server. Real signatures cannot yet be authenticated.';
  }catch(error){el('configuration754').textContent=`HOLD — ${error.message}`;}
}

el('form754').addEventListener('submit',async event=>{
  event.preventDefault();const button=el('verify754');
  let evidence;
  try{evidence={period:el('period754').value,booking_id:el('booking754').value.trim(),
    owner_receipt:JSON.parse(el('owner754').value),source_attestation:JSON.parse(el('source754').value)};}
  catch{status('HOLD — Both receipts must be valid JSON objects.');return;}
  button.disabled=true;status('Rechecking the economic source and verifying independent signatures…');
  try{
    const res=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const body=await res.json();output(body);
    status(`${body.closure_gate||'HOLD'} — ${body.detail||body.error||'No closure recorded.'}`);
  }catch(error){status(`HOLD — Verification unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
checkConfiguration();
