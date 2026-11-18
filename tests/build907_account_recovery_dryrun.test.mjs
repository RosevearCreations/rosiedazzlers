import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {issueCustomerAuthToken} from '../functions/api/_lib/customer-auth-tokens.js';
import {onRequestPost as resetPassword} from '../functions/api/client/auth_reset_password.js';
import {onRequestPost as forgotPassword} from '../functions/api/client/auth_forgot_password.js';
import {onRequestPost as accountHelp} from '../functions/api/client/auth_account_help.js';
const original=globalThis.fetch;
const jr=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
const id='adeb7fb4-a763-4a12-a7b7-59ed38f438b2',requestId='0127b5c4-0c84-4ca1-a8d9-25511d62f94f';
const env={SUPABASE_URL:'https://account-mock.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'mock-only-secret',
 CUSTOMER_SESSION_SECRET:'mock-only-long-session-secret'};
const profile={id,email:'client@example.test',full_name:'Test Customer',is_active:true,email_verified_at:null};
const req=(path,payload,origin='https://rosiedazzlers.ca')=>new Request('https://rosiedazzlers.ca'+path,{
 method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(payload)});
test('Transactional reset dry-run: issue token -> consume exactly once -> reset password -> revoke sessions -> new HttpOnly session',async()=>{
 let saved=null,claimed=false,resetCount=0,revokeCount=0,newSessions=0,rawToken=null;
 try{
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url),method=opts.method||'GET';
   if(u.includes('/customer_auth_tokens?customer_profile_id=')&&method==='PATCH')return jr([]);
   if(u.endsWith('/rest/v1/customer_auth_tokens')&&method==='POST'){
    const rows=JSON.parse(opts.body);saved={...rows[0],id:requestId};return jr([saved]);
   }
   if(u.includes('/customer_auth_tokens?purpose=')&&method==='PATCH'){
    const digest=new URL(u).searchParams.get('token_hash');
    const match=digest===('eq.'+saved.token_hash)&&!claimed&&new Date(saved.expires_at)>new Date();
    if(match){claimed=true;return jr([{...saved,used_at:new Date().toISOString()}]);}
    return jr([]);
   }
   if(u.includes('/customer_profiles?select=')&&method==='GET')return jr([profile]);
   if(u.includes('/customer_profiles?id=')&&method==='PATCH'){
    const patch=JSON.parse(opts.body);assert.match(patch.password_hash,/^(?:sha256:|\$2)/);
    assert.equal(patch.email_verified_at!=null,true);resetCount++;return jr([{...profile,...patch}]);
   }
   if(u.includes('/customer_auth_sessions?customer_profile_id=')&&method==='PATCH'){
    revokeCount++;return jr([{id:'old-session'}]);
   }
   if(u.endsWith('/rest/v1/customer_auth_sessions')&&method==='POST'){
    newSessions++;return jr([{id:'new-session'}]);
   }
   throw Error('Unexpected mock request '+method+' '+u);
  };
  const issued=await issueCustomerAuthToken({env,customerProfileId:id,purpose:'password_reset',expiresMinutes:90,
   payload:{email:profile.email}});
  rawToken=issued.rawToken;
  assert.equal(rawToken.length,64);assert.notEqual(saved.token_hash,rawToken);
  const response=await resetPassword({env,request:req('/api/client/auth_reset_password',{
   token:rawToken,password:'Security907!Reset'})});
  const data=await response.json();
  assert.equal(response.status,200);assert.equal(data.ok,true);
  assert.equal(resetCount,1);assert.equal(revokeCount,1);assert.equal(newSessions,1);
  assert.match(response.headers.get('set-cookie')||'',/rd_client_session=/);
  const replay=await resetPassword({env,request:req('/api/client/auth_reset_password',{
   token:rawToken,password:'Security907!Reset'})});
  assert.equal(replay.status,400);assert.equal(resetCount,1);
  // This test uses mocks: NO original email was sent, no actual customer account altered.
 }finally{globalThis.fetch=original;rawToken=null;}
});
test('Expired/invalid reset and cross-origin requests never mutate credentials',async()=>{
 let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;throw Error('Should not reach backend');};
  const denied=await resetPassword({env,request:req('/api/client/auth_reset_password',{
    token:'bad',password:'Security907!Reset'},'https://untrusted.example')});
  assert.equal(denied.status,403);assert.equal(calls,0);
  const weak=await resetPassword({env,request:req('/api/client/auth_reset_password',{
    token:'something',password:'short'})});
  assert.equal(weak.status,400);assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});
test('Forgot-password unknown account is enumeration-safe and never delivers or creates a token',async()=>{
 let writes=0;
 try{
  globalThis.fetch=async(url,opts={})=>{
   if(opts.method==='POST'||opts.method==='PATCH')writes++;
   if(String(url).includes('/customer_profiles?select='))return jr([]);
   throw Error('Unknown fetch');
  };
  const response=await forgotPassword({env,request:req('/api/client/auth_forgot_password',{email:'not-a-user@example.test'})});
  assert.equal(response.status,200);
  assert.equal((await response.json()).message,'If that email exists, a reset link has been sent.');
  assert.equal(writes,0);
 }finally{globalThis.fetch=original;}
});
test('Forgot-password known account with unavailable provider retires undelivered token and preserves generic response',async()=>{
 let tokenId=null,retired=false;
 try{
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url),method=opts.method||'GET';
   if(u.includes('/customer_profiles?select='))return jr([profile]);
   if(u.includes('/customer_auth_tokens?select=id&'))return jr([]);
   if(u.includes('/customer_auth_tokens?customer_profile_id=')&&method==='PATCH')return jr([]);
   if(u.endsWith('/customer_auth_tokens')&&method==='POST'){
    tokenId=requestId;return jr([{id:tokenId,...JSON.parse(opts.body)[0]}]);
   }
   if(u.includes('/customer_auth_tokens?id=')&&method==='PATCH'){retired=true;return jr({});}
   // Missing notification-provider setup must fail closed, not pretend delivery.
   if(u.includes('/rest/v1/'))return jr([],200);
   return jr({error:'mail provider unavailable'},503);
  };
  const response=await forgotPassword({env,request:req('/api/client/auth_forgot_password',{email:profile.email})});
  assert.equal(response.status,200);
  const body=await response.json();assert.equal(body.ok,true);
  assert.equal(body.message,'If that email exists, a reset link has been sent.');
  assert.equal(retired,true);
 }finally{globalThis.fetch=original;}
});
test('Forgotten-account request enters original private staff queue, never returns an account match',async()=>{
 const calls=[];
 try{
  globalThis.fetch=async(url,opts={})=>{
   const u=String(url);calls.push({u,method:opts.method||'GET',body:opts.body||''});
   if(u.includes('customer_account_recovery_requests?select=id&'))return jr([]);
   if(u.endsWith('/rest/v1/customer_account_recovery_requests'))return jr({},201);
   throw Error('Unexpected mocked endpoint '+u);
  };
  const response=await accountHelp({env,request:req('/api/client/auth_account_help',{
   website:'',full_name:'Test Customer',phone:'519-555-0123',email_hint:'maybe@example.test',
   message:'I cannot remember which email was used.'})});
  const body=await response.json();
  assert.equal(response.status,200);assert.equal(body.ok,true);
  assert.equal(JSON.stringify(body).includes('maybe@example.test'),false);
  assert.equal(calls.filter(x=>x.method==='POST').length,1);
  assert.equal(JSON.parse(calls.find(x=>x.method==='POST').body)[0].status,'queued');
  const cross=await accountHelp({env,request:req('/api/client/auth_account_help',{
   full_name:'Test Customer',phone:'519-555-0123'},'https://untrusted.example')});
  assert.equal(cross.status,403);
 }finally{globalThis.fetch=original;}
});
test('Account recovery UI and staff queue are wired to original implementation, not a mock success display',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 for(const p of ['login.html','login/index.html']){
  const x=read(p);
  for(const s of ['id="forgotForm"','id="accountHelpForm"','id="resetForm"',
   '/api/client/auth_forgot_password','/api/client/auth_account_help','/api/client/auth_reset_password'])
   assert.ok(x.includes(s),p+':'+s);
 }
 const admin=read('admin-customers.html');
 assert.match(admin,/Forgot sign-in email requests/);
 const action=read('functions/api/admin/customer_account_help_action.js');
 assert.match(action,/canManageCustomerSecurity/);
 const originalToken=read('functions/api/_lib/customer-auth-tokens.js');
 for(const x of ['sha256Hex(rawToken)','used_at=is.null','expires_at=gt.'])assert.ok(originalToken.includes(x));
 const originalReset=read('functions/api/client/auth_reset_password.js');
 for(const x of ['revokeAllCustomerSessions','createCustomerSession','Same-origin password reset'])
  assert.ok(originalReset.includes(x));
});
