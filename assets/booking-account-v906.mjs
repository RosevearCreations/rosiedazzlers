// Rosie 906: optional, explicit client account creation inside the canonical
// booking planner. Does not mutate booking, service catalog, hold or checkout.
const form=document.getElementById('bookingAccountForm906');
const message=document.getElementById('bookingAccountStatus906');
const create=document.getElementById('bookingCreateAccount906');
const check=document.getElementById('bookingCheckAccount906');
const name=document.getElementById('customer_name'),email=document.getElementById('customer_email'),phone=document.getElementById('customer_phone');
const password=document.getElementById('bookingNewPassword906'),confirm=document.getElementById('bookingNewConfirm906');
async function request(url,opts={}){
 const res=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});
 const data=await res.json().catch(()=>({}));
 return {res,data};
}
const report=x=>{message.textContent=String(x);};
async function current(){
 try{
  const {res,data}=await request('/api/client/auth_me');
  if(res.ok&&data?.authenticated===true&&data?.customer?.id){
   report('Signed in as '+(data.customer.email||'a Rosie customer')+'. Continue your booking without creating a duplicate account.');
   create.disabled=true;password.value='';confirm.value='';return true;
  }
  report('Not signed in. Creating an account is optional; you may still complete your booking without one.');
  create.disabled=false;return false;
 }catch{report('Could not verify account status. Checkout remains available; no account was created.');return false;}
}
check?.addEventListener('click',current);
form?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(create.disabled)return;
 const full_name=String(name?.value||'').trim(),userEmail=String(email?.value||'').trim();
 if(!full_name||!userEmail||!email.checkValidity()){report('Enter a valid name and email in the booking contact fields above.');return;}
 if(password.value!==confirm.value){report('Passwords must match.');return;}
 if(password.value.length<8){report('Choose a password with at least eight characters.');return;}
 create.disabled=true;report('Creating your account using the details entered above…');
 try{
  const {res,data}=await request('/api/client/auth_signup',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({
    full_name,email:userEmail,phone:String(phone?.value||'').trim(),password:password.value,
    notification_opt_in:false,notification_channel:'none',detailer_chat_opt_in:false})});
  if(!res.ok||data.ok!==true)throw Error(data.error||'Could not create account.');
  password.value='';confirm.value='';
  report('Account created and signed in. Your booking and payment choices remain unchanged.');
  create.disabled=true;
 }catch(err){
  report((err.message||'Account creation unavailable.')+' You may sign in from the separate login link or continue checkout without creating an account.');
  create.disabled=false;
 }
});
if(form)current();
