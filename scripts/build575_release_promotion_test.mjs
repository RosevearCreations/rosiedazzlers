import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const path = new URL("../.github/workflows/guarded-production-auto-promotion.yml", import.meta.url);
const workflow = readFileSync(path, "utf8");
assert.match(workflow, /workflow_run:[\s\S]*Current Source Gate[\s\S]*Cloudflare Development Acceptance/);
assert.match(workflow, /pull_request_target:/);
assert.match(workflow, /schedule:/);
assert.match(workflow, /ROSIEDAZZLERS_RELEASE_TOKEN \|\| secrets.GITHUB_TOKEN/);
assert.match(workflow, /Verify exact Production deployment/);
assert.match(workflow, /Validate Production business acceptance source contract/);
assert.match(workflow, /enablePullRequestAutoMerge/);
assert.match(workflow, /HAS_RELEASE_TOKEN/);
assert.ok(!workflow.includes("force:true"));
assert.ok(!workflow.includes("git push"));
const lines=workflow.split("\n");
const start=lines.findIndex(line=>line.trim()==="script: |");
assert.ok(start>0,"GitHub script block exists");
const source=[];
for(let i=start+1;i<lines.length;i++){
 const line=lines[i];
 if(line && !line.startsWith("            ")) break;
 source.push(line.slice(12));
}
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const execute=new AsyncFunction("github","context","core","process",source.join("\n"));
const sha={dev:"d".repeat(40),main:"m".repeat(40),old:"o".repeat(40)};
function check(name,id=1,conclusion="success"){
 return {name,id,status:"completed",conclusion};
}
const goodDev=[check("Cloudflare Pages"),check("Verify Development deployment"),check("source checks")];
const goodMain=[check("Cloudflare Pages"),check("Verify exact Production deployment"),
 check("Validate Production business acceptance source contract")];
async function scenario(settings={}){
 const calls={merges:[],native:[],messages:[],summary:[]};
 const allChecks={...{[sha.dev]:goodDev,[sha.main]:goodMain},...(settings.checks||{})};
 const pr={number:400,head:{sha:settings.stale?sha.old:sha.dev,ref:"dev",repo:{full_name:"RosevearCreations/rosiedazzlers"}},draft:false};
 const current={...pr,state:"open",mergeable:true,
  mergeable_state:settings.state||"blocked",node_id:"PR_test"};
 let branchReads=0;
 const github={
   rest:{
     repos:{getBranch:async ({branch})=>{
       branchReads++;
       const ref=(settings.race && branchReads>2 && branch==="main")?sha.old:sha[branch];
       return {data:{commit:{sha:ref}}};
     }},
     pulls:{
       list:()=>{},get:async()=>({data:current}),
       merge:async args=>{calls.merges.push(args);return {data:{merged:true}};}
     },
     checks:{listForRef:async ({ref,page=1,per_page=100})=>({
       data:{check_runs:(allChecks[ref]||[]).slice((page-1)*per_page,page*per_page)}
     })}
   },
   paginate:async(fn,args)=>fn===github.rest.pulls.list?[pr]:(allChecks[args.ref]||[]),
   graphql:async (_mutation,args)=>{calls.native.push(args);return {enablePullRequestAutoMerge:{}};}
 };
 const core={
   notice:message=>calls.messages.push(String(message)),
   summary:{addRaw:s=>{calls.summary.push(s);return core.summary;},write:async()=>{}}
 };
 await execute(github,{repo:{owner:"RosevearCreations",repo:"rosiedazzlers"},eventName:"workflow_run"},core,
    {env:{HAS_RELEASE_TOKEN:settings.token?"true":"false"}});
 return calls;
}
const blocked=await scenario();
assert.equal(blocked.native.length,1,"blocked PR should request GitHub-native auto-merge");
assert.equal(blocked.merges.length,0,"no direct GITHUB_TOKEN merge");
const cleanNoToken=await scenario({state:"clean"});
assert.equal(cleanNoToken.merges.length,0);
assert.ok(cleanNoToken.messages.some(m=>m.includes("ROSIEDAZZLERS_RELEASE_TOKEN")));
const cleanToken=await scenario({state:"clean",token:true});
assert.equal(cleanToken.merges.length,1);
assert.equal(cleanToken.merges[0].sha,sha.dev);
assert.equal((await scenario({checks:{[sha.main]:[check("Cloudflare Pages")]}})).native.length,0);
assert.equal((await scenario({checks:{[sha.dev]:[check("source checks")]}})).native.length,0);
assert.equal((await scenario({stale:true})).native.length,0);
assert.equal((await scenario({race:true})).native.length,0);
const oldFail=await scenario({checks:{[sha.dev]:[
 check("Cloudflare Pages"),check("Verify Development deployment"),
 check("source checks",10,"failure"),check("source checks",11,"success")
]}});
assert.equal(oldFail.native.length,1,"latest successful same-context check is authoritative");
const latestFailure=await scenario({checks:{[sha.dev]:[
 check("Cloudflare Pages"),check("Verify Development deployment"),
 check("source checks",10,"success"),check("source checks",11,"failure")
]}});
assert.equal(latestFailure.native.length,0,"latest failing check must HOLD");

const many=[...Array.from({length:205},(_,i)=>check("advisory-"+i,i+1)),...goodDev];
const paged=await scenario({checks:{[sha.dev]:many}});
assert.equal(paged.native.length,1,"checks over multiple pages must preserve exact Development proof");
assert.ok(workflow.includes("github.rest.checks.listForRef"));
assert.ok(!workflow.includes("github.paginate(github.rest.checks.listForRef"));
console.log("Build 575 guarded production promotion: event, SHA, prior GREEN, credential, race and replay tests PASS");
