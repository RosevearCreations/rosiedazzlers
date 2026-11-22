// Read-only original Production observations; never infer business or host acceptance.
export function assessProduction918({checks=[],http={},sha='' }={}){
 const validSha=/^[a-f0-9]{40}$/.test(sha);
 const completed=checks.filter(x=>x.status==='completed'&&x.conclusion==='success');
 const has=name=>completed.some(x=>x.name===name);
 const exactCount=completed.filter(x=>x.name==='Verify exact Production deployment').length;
 const blockers=[];
 if(!validSha)blockers.push('IMMUTABLE_MAIN_SHA_MISSING');
 if(!has('Cloudflare Pages'))blockers.push('CLOUDFLARE_MAIN_DEPLOYMENT_UNVERIFIED');
 if(!has('source checks'))blockers.push('EXACT_SOURCE_GATE_NOT_GREEN');
 if(!has('Production release health and operator alert'))blockers.push('CURRENT_RELEASE_HEALTH_NOT_GREEN');
 if(exactCount<10)blockers.push('TEN_EXACT_PRODUCTION_VERIFIERS_REQUIRED');
 if(http.admin!==200)blockers.push('ADMIN_TELEMETRY_PAGE_NOT_SERVING');
 if(![401,403].includes(http.privateEndpoint))blockers.push('PRIVATE_ADMIN_ENDPOINT_MUST_DENY_ANONYMOUS');
 if(http.sourceScope!==400)blockers.push('ORIGINAL_SOURCE_MUST_REJECT_MISSING_CHALLENGE');
 return {schema:'rosie.production-watch-observation.v918',sha,softwareProduction:blockers.length===0?'OBSERVED_GREEN':'OBSERVATION_HOLD',checksObserved:checks.length,
  exactProductionVerifierPasses:exactCount,publicHttp:http,blockers,
  sevenAppConnected:false,masterReceiverAckVerified:false,originalWindowsHostRecoveryVerified:false,
  originalSourceMetricsVerified:false,authorizesAction:false};
}
