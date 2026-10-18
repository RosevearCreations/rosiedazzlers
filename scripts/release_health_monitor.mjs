#!/usr/bin/env node
/**
 * Rosie Dazzlers Production release-health monitor.
 * Read-only GitHub/Cloudflare checks; may create/update ONE GitHub operator issue.
 * No deploy, branch mutation, provider log exposure or production data mutation.
 */
const CF_API="https://api.cloudflare.com/client/v4";
const ISSUE_TITLE="[Release Health] Production deployment needs attention";
const REQUIRED=["Cloudflare Pages","Verify exact Production deployment","Validate Production business acceptance source contract"];
const SHA=/^[0-9a-f]{40}$/i;
export function newestCheck(checks,name) {
  return checks.filter(c=>c&&c.name===name).sort((a,b)=>(b.id||0)-(a.id||0))[0]||null;
}
export function releaseHealth({mainSha,mainUpdated,project,deployments,checks,now=Date.now(),graceMinutes=30}) {
  const base={mainSha,productionSha:null,deploymentId:null,deploymentStatus:"missing",
    required:{},state:"UNAVAILABLE",reason:"Unknown",alert:false,graceMinutes};
  if(!SHA.test(mainSha||"")) return {...base,reason:"GitHub main SHA is unavailable"};
  if(!project || project.source?.type!=="github" ||
     (project.production_branch||project.source?.config?.production_branch)!=="main")
    return {...base,reason:"Cloudflare GitHub project or Production branch is not configured as main"};
  if(!Array.isArray(deployments)||!Array.isArray(checks))
    return {...base,reason:"Cloudflare deployments or GitHub checks unavailable"};
  const production=deployments
    .filter(d=>d && d.environment==="production" &&
      d.deployment_trigger?.metadata?.branch==="main")
    .sort((a,b)=>Date.parse(b.created_on||0)-Date.parse(a.created_on||0));
  const latest=production[0]||null;
  const deployedSha=latest?.deployment_trigger?.metadata?.commit_hash||null;
  const status=latest?.latest_stage?.status||"missing";
  const required=Object.fromEntries(REQUIRED.map(name=>{
    const c=newestCheck(checks,name);
    return [name,c?.status==="completed"?(c.conclusion||"unknown"):(c?.status||"missing")];
  }));
  const out={...base,productionSha:deployedSha,deploymentId:latest?.id||null,
    deploymentStatus:status,required};
  const age=Math.max(0,now-Date.parse(mainUpdated||""));
  const oldEnough=Number.isFinite(age)&&age>=graceMinutes*60_000;
  const failedChecks=Object.values(required).some(v=>["failure","timed_out","cancelled","action_required"].includes(v));
  if(failedChecks) return {...out,state:"FAILED",reason:"Required Production check failed",alert:true};
  if(["failure","failed","canceled","cancelled"].includes(status))
    return {...out,state:"FAILED",reason:"Latest Cloudflare Production deployment failed",alert:true};
  if(!latest) return {...out,state:oldEnough?"STALLED":"PENDING",
    reason:"No Cloudflare Production deployment found",alert:oldEnough};
  if(deployedSha!==mainSha)
    return {...out,state:oldEnough?"DRIFT":"PENDING",
      reason:"Latest Cloudflare Production SHA does not match GitHub main",alert:oldEnough};
  if(status!=="success") return {...out,state:oldEnough?"STALLED":"PENDING",
    reason:"Latest Cloudflare Production deployment has not succeeded",alert:oldEnough};
  if(!Object.values(required).every(x=>x==="success"))
    return {...out,state:oldEnough?"STALLED":"PENDING",
      reason:"Exact-main Production source/runtime/business acceptance is incomplete",alert:oldEnough};
  return {...out,state:"GREEN",reason:"Exact main, Cloudflare Production and business checks agree",alert:false};
}
export function recoveryGuidance(h) {
  const steps={
    FAILED:["Inspect the failed Cloudflare deployment or exact-SHA acceptance job; capture its run ID.","Compare failure scope against the last independently accepted Production SHA.","Propose the smallest reversible fix; obtain explicit owner approval before rollback or redeployment."],
    DRIFT:["Compare GitHub main against latest Cloudflare Production SHA and Pages project configuration.","Check the deployment queue and source connection without mutating production.","Request owner authorization before any manual deployment or branch operation."],
    STALLED:["Inspect pending Cloudflare deployment, build logs and required acceptance checks.","Check GitHub Actions capacity/permissions and Cloudflare provider status.","Escalate to owner for a manual intervention decision; never assume a retry succeeded."],
    UNAVAILABLE:["Verify read-only Cloudflare credentials, account/project access and GitHub permissions.","Restore visibility through an authorized secrets/configuration change outside this monitor.","Do not mark GREEN until independent exact-SHA proof is available."],
    PENDING:["Within the deployment grace period, observe the next scheduled run.","Do not intervene before checking current deployment progress."],
    GREEN:["No recovery action needed; retain exact-SHA evidence and close resolved incident."]
  };
  return steps[h.state]||steps.UNAVAILABLE;
}
export function ownerAcknowledged(comments,sha,owner) {
  if(!SHA.test(sha||"")||!owner||!Array.isArray(comments)) return false;
  return comments.some(c=>c?.user?.login?.toLowerCase()===owner.toLowerCase() &&
    String(c.body||"").trim()===("/ack-release-incident "+sha));
}
export function incidentDashboard(h,{acknowledged=false}={}) {
  return dashboard(h)+"\\n## Build 577 — incident recovery and owner escalation\\n"+
    "Owner acknowledgement: **"+(acknowledged?"ACKNOWLEDGED":"REQUIRED")+"** (not recovery approval).\\n"+
    "To acknowledge this exact incident, the repository owner comments "+
    "\\`/ack-release-incident "+String(h.mainSha||"unavailable")+"\\` on this GitHub issue.\\n"+
    "Acknowledgement does NOT trigger rollback, retry, redeployment, or issue closure.\\n"+
    "Recovery guidance (manual decisions only):\\n"+
    recoveryGuidance(h).map((step,i)=>(i+1)+". "+step).join("\\n")+"\\n"+
    "After separately approved remediation, rerun exact-main Cloudflare and business acceptance.\\n";
}
export function dashboard(h) {
  const sanitize=s=>String(s??"unavailable").replace(/[|<>\r\n]/g," ").slice(0,200);
  const lines=[
    "## Rosie Dazzlers — Production release health",
    "",
    "| Signal | Observed state |",
    "|---|---|",
    "| Release state | **"+sanitize(h.state)+"** |",
    "| GitHub main | \`"+sanitize(h.mainSha)+"\` |",
    "| Cloudflare latest Production SHA | \`"+sanitize(h.productionSha)+"\` |",
    "| Cloudflare deployment | \`"+sanitize(h.deploymentId)+"\` |",
    "| Cloudflare status | "+sanitize(h.deploymentStatus)+" |",
    ...Object.entries(h.required||{}).map(([k,v])=>"| "+sanitize(k)+" | "+sanitize(v)+" |"),
    "| Operator diagnosis | "+sanitize(h.reason)+" |",
    "| Attention required | "+(h.alert?"YES":"No")+" |",
    "",
    "Production is GREEN **only** on exact-SHA Cloudflare and business acceptance.",
    "A new main commit receives a "+sanitize(h.graceMinutes)+"-minute deployment/CI grace period.",
    "Source: GitHub REST check-runs + Cloudflare Pages API (read-only)."
  ];
  return lines.join("\n")+"\n";
}
async function getJSON(url,token) {
  const res=await fetch(url,{headers:{"Authorization":"Bearer "+token,
    "Accept":"application/vnd.github+json","User-Agent":"rosiedazzlers-release-health"},
    signal:AbortSignal.timeout(20000)});
  if(!res.ok) throw Error("API request returned HTTP "+res.status);
  const data=await res.json();
  if(url.startsWith(CF_API)&&data.success!==true) throw Error("Cloudflare API rejected read-only request");
  return url.startsWith(CF_API)?data.result:data;
}
async function githubChecks(owner,repo,sha,token) {
  const all=[];
  for(let page=1;page<=20;page++){
    const response=await getJSON("https://api.github.com/repos/"+owner+"/"+repo+"/commits/"+sha+
      "/check-runs?per_page=100&page="+page,token);
    if(!Array.isArray(response.check_runs)) throw Error("Malformed GitHub checks page");
    all.push(...response.check_runs);
    if(response.check_runs.length<100) return all;
  }
  throw Error("Too many GitHub checks; refuse partial evidence");
}
async function syncIssue(owner,repo,token,health,body){
  const root="https://api.github.com/repos/"+owner+"/"+repo;
  const issues=await getJSON(root+"/issues?state=open&per_page=100",token);
  const current=issues.find(i=>!i.pull_request&&i.title===ISSUE_TITLE);
  async function mutate(path,method,payload){
    const response=await fetch(root+path,{method,
      headers:{"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json",
        "Content-Type":"application/json","User-Agent":"rosiedazzlers-release-health"},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw Error("GitHub alert update returned HTTP "+response.status);
  }
  if(health.alert){
    // Deduped, with only source-owned operational metadata (no secrets).
    if(!current) await mutate("/issues","POST",{title:ISSUE_TITLE,body});
    else if(current.body!==body) await mutate("/issues/"+current.number,"PATCH",{body});
  }else if(health.state==="GREEN"&&current){
    await mutate("/issues/"+current.number,"PATCH",{state:"closed",state_reason:"completed",
      body:body+"\n\nResolved on exact-SHA Production GREEN."});
  }
}
export async function run(){
  const env=process.env;
  const repo=env.GITHUB_REPOSITORY||"RosevearCreations/rosiedazzlers";
  const [owner,name]=repo.split("/");
  if(!owner||!name||!env.GITHUB_TOKEN) throw Error("GitHub repository or token unavailable");
  const branch=await getJSON("https://api.github.com/repos/"+owner+"/"+name+"/branches/main",env.GITHUB_TOKEN);
  const mainSha=branch?.commit?.sha;
  const commit=await getJSON("https://api.github.com/repos/"+owner+"/"+name+"/commits/"+mainSha,env.GITHUB_TOKEN);
  const mainUpdated=commit?.commit?.committer?.date;
  let health;
  if(!env.CLOUDFLARE_API_TOKEN||!env.CLOUDFLARE_ACCOUNT_ID){
    health={mainSha,productionSha:null,deploymentId:null,deploymentStatus:"unavailable",
      required:{},state:"UNAVAILABLE",reason:"Cloudflare read-only credentials are missing",
      alert:true,graceMinutes:30};
  }else{
    try{
      const path=CF_API+"/accounts/"+encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)+
        "/pages/projects/rosiedazzlers";
      const [project,deployments,checks]=await Promise.all([
        getJSON(path,env.CLOUDFLARE_API_TOKEN),
        getJSON(path+"/deployments?per_page=25",env.CLOUDFLARE_API_TOKEN),
        githubChecks(owner,name,mainSha,env.GITHUB_TOKEN)
      ]);
      health=releaseHealth({mainSha,mainUpdated,project,deployments,checks});
    }catch(error){
      health={mainSha,productionSha:null,deploymentId:null,deploymentStatus:"unavailable",
        required:{},state:"UNAVAILABLE",reason:"Read-only provider evidence unavailable ("+
          String(error.message).slice(0,110)+")",alert:true,graceMinutes:30};
    }
  }
  let acknowledged=false;
  if(health.alert && SHA.test(health.mainSha||"")){
    const root="https://api.github.com/repos/"+owner+"/"+name;
    const open=await getJSON(root+"/issues?state=open&per_page=100",env.GITHUB_TOKEN);
    const issue=open.find(i=>!i.pull_request&&i.title===ISSUE_TITLE);
    if(issue){
      const comments=[];
      for(let page=1;page<=10;page++){
        const batch=await getJSON(root+"/issues/"+issue.number+"/comments?per_page=100&page="+page,env.GITHUB_TOKEN);
        if(!Array.isArray(batch)) throw Error("Owner acknowledgement comments unavailable");
        comments.push(...batch);
        if(batch.length<100) break;
        if(page===10) throw Error("Owner acknowledgement evidence exceeded bounded pages");
      }
      acknowledged=ownerAcknowledged(comments,health.mainSha,owner);
    }
  }
  const body=incidentDashboard(health,{acknowledged});
  console.log("RELEASE HEALTH: "+health.state+" — "+health.reason);
  if(env.GITHUB_STEP_SUMMARY){
    const fs=await import("node:fs/promises");
    await fs.appendFile(env.GITHUB_STEP_SUMMARY,body);
  }
  await syncIssue(owner,name,env.GITHUB_TOKEN,health,body);
  if(health.state==="UNAVAILABLE") process.exitCode=1; // Fail visibly, no false GREEN.
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  run().catch(error=>{console.error("Release health monitor failed: "+error.message);process.exitCode=1});
}
