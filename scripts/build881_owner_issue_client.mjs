// Rosie 881 — GitHub owner issue operations; only redacted aggregate/opaque digests.
// Paginate bounded original issue inventory rather than treating >100 issues as empty.
export const repo881='RosevearCreations/rosiedazzlers';
export async function github881(path,method='GET',body=null){
 const token=process.env.GITHUB_TOKEN||'';
 if(token.length<20||process.env.GITHUB_REPOSITORY!==repo881)
  throw Error('Exact repository-scoped GitHub issue-write authority missing');
 const response=await fetch('https://api.github.com/repos/'+repo881+path,{
  method,redirect:'error',headers:{Authorization:'Bearer '+token,
   Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const json=await response.json().catch(()=>null);
 if(!response.ok)throw Error('GitHub owner issue authority failed (HTTP '+response.status+')');
 return json;
}
export async function originalIssue881(title,createBody=null){
 const matches=[];
 let complete=false;
 for(let page=1;page<=20;page++){
  const rows=await github881('/issues?state=all&per_page=100&page='+page);
  if(!Array.isArray(rows))throw Error('GitHub owner issue listing unavailable');
  matches.push(...rows.filter(x=>!x.pull_request&&x.title===title));
  if(rows.length<100){complete=true;break;}
 }
 if(!complete)throw Error('Owner issue inventory exceeds bounded audit; do not duplicate');
 if(matches.length>1)throw Error('Duplicate owner issue anchors; manual reconciliation required');
 if(matches.length===1)return matches[0];
 if(!createBody)throw Error('Owner issue anchor missing');
 return github881('/issues','POST',{title,body:createBody});
}
