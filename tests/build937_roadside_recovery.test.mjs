import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
function harness(path){
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:false,disabled:false,textContent:'',replaceChildren(){}});return nodes.get(id)};
 const ctx=vm.createContext({document:{readyState:'loading',addEventListener(){},getElementById:node},window:{confirm:()=>true,dispatchEvent(){}},CustomEvent:class{},sessionStorage:{setItem(){}},console});
 vm.runInContext(read(path),ctx);return {ctx,node,run:s=>vm.runInContext(s,ctx)};
}
test('initial interrupted transfer retains exact bytes and retry reuses original reserved asset',async()=>{
 const {ctx,node,run}=harness('assets/admin-booking-v868.js');
 node('rdPrivatePhotoConsent').checked=true;
 ctx.file={name:'fixture.jpg',type:'image/jpeg',size:1000};
 ctx.fetch=async()=>({ok:false});
 run(`state.draft={id:'draft'};authorizePrivateCapture=async()=>{};read=async()=>({media:[]});reloadDraft894=async()=>{};call=async(action)=>{if(action==='sign_upload')return {status:'pending_upload',content_type:'image/jpeg',asset_id:'asset',upload_url:'https://fixture.invalid'};throw Error('unexpected')}`);
 await run("uploadFiles([file],'photos')");
 assert.equal(run("state.retryFiles.get('asset').file"),ctx.file);
 ctx.fetch=async(_url,options)=>{assert.equal(options.body,ctx.file);return {ok:true}};
 run(`call=async(action)=>{if(action==='retry_upload')return {retry_existing:true,asset_id:'asset',content_type:'image/jpeg',upload_url:'https://fixture.invalid'};if(action==='confirm_upload'){if(!globalThis.confirmed){globalThis.confirmed=true;throw Error('pending')}return {status:'stored_private'}}throw Error('new reservation forbidden')}`);
 await run("retryPending894('asset')");
 assert.equal(run("state.retryFiles.size"),0);assert.match(node('rdIntakeStatus').textContent,/Retried file stored privately/);
});
test('media refresh keeps unsaved notes and avoids reselecting quote',async()=>{
 const {node,run}=harness('assets/admin-booking-v868.js');node('rdIntakeNotes').value='Unsaved note';
 run(`state.draft={id:'draft'};read=async()=>({drafts:[{id:'draft',notes:'old'}],media:[]});labelMedia=()=>{};listSaved=async()=>{};showDraft=()=>{throw Error('unexpected reselection')}`);
 await run("reloadDraft894('draft')");assert.equal(node('rdIntakeNotes').value,'Unsaved note');
});
test('older quote response cannot overwrite new draft or enable stale contact form',async()=>{
 const {ctx,node,run}=harness('assets/admin-booking-v869.js');
 const pending={};ctx.readFixture=id=>new Promise(resolve=>pending[id]=resolve);run("read=readFixture;storageView=()=>{}");
 const a=run("selectDraft('a')"),b=run("selectDraft('b')");
 pending.b({draft:{id:'b',customer_name:'Second',temporary_label:'B'}});await b;
 pending.a({draft:{id:'a',customer_name:'First',temporary_label:'A'}});await a;
 assert.equal(node('rdQuickName').value,'Second');assert.equal(run('readyDraft937'),'b');
});
test('older share refresh cannot expose another draft link or deposit status',async()=>{
 const {ctx,node,run}=harness('assets/admin-booking-v870.js');
 const pending={};ctx.readFixture=id=>new Promise(resolve=>pending[id]=resolve);
 run("request=async()=>readFixture(draftId)");
 const a=run("choose('a')"),b=run("choose('b')");
 pending.b({links:[],deposit:{state:'not_booked'}});await b;
 pending.a({links:[{id:'old',active:true,expires_at:'2027-01-01'}],deposit:{state:'verified_original_deposit'}});await a;
 assert.equal(run('shareId'),'');assert.match(node('rdDepositStatus870').textContent,/No canonical booking/);
});
test('exact private object verification and route parity',()=>{
 const api=read('functions/api/admin/detailing_intake_v868.js');
 assert.match(api,/actual!==a.expected_bytes/);assert.match(api,/type!==a.content_type/);
 assert.equal(read('admin-booking.html'),read('admin-booking/index.html'));
});
