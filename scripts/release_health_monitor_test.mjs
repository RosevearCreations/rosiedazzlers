import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {releaseHealth,newestCheck,dashboard,recoveryGuidance,ownerAcknowledged,incidentDashboard} from "./release_health_monitor.mjs";

const a="a".repeat(40),b="b".repeat(40);
const now=Date.parse("2026-10-18T20:00:00Z");
const project={source:{type:"github"},production_branch:"main"};
const deploy=(sha,status="success",date="2026-10-18T19:45:00Z")=>({
 id:"deployment-1",created_on:date,environment:"production",latest_stage:{status},
 deployment_trigger:{metadata:{branch:"main",commit_hash:sha}}
});
const check=(name,conclusion="success",id=1)=>({name,id,status:"completed",conclusion});
const good=["Cloudflare Pages","Verify exact Production deployment","Validate Production business acceptance source contract"].map(name=>check(name));
const base={mainSha:a,mainUpdated:"2026-10-18T19:00:00Z",project,
 deployments:[deploy(a)],checks:good,now};
function expect(changes,status,alert) {
 const output=releaseHealth({...base,...changes});
 assert.equal(output.state,status);
 assert.equal(output.alert,alert);
 assert.match(dashboard(output),/GitHub main/);
 return output;
}
expect({},"GREEN",false);
expect({mainUpdated:"2026-10-18T19:50:00Z",deployments:[deploy(b)]},"PENDING",false);
expect({deployments:[deploy(b)]},"DRIFT",true);
expect({deployments:[]},"STALLED",true);
expect({deployments:[deploy(a,"deploying")]},"STALLED",true);
expect({deployments:[deploy(a,"failure")]},"FAILED",true);
expect({checks:[...good.slice(0,2),check(good[2].name,"failure",10)]},"FAILED",true);
expect({checks:[...good.slice(0,2)]},"STALLED",true);
expect({mainUpdated:"2026-10-18T19:50:00Z",checks:good.slice(0,2)},"PENDING",false);
expect({project:{...project,production_branch:"dev"}},"UNAVAILABLE",false);
expect({deployments:[deploy(a,"success"),deploy(b,"success","2026-10-18T19:55:00Z")]},"DRIFT",true);
expect({deployments:[{...deploy(a),environment:"preview"}]},"STALLED",true);
expect({mainSha:"invalid"},"UNAVAILABLE",false);
assert.equal(newestCheck([...good,check(good[0].name,"failure",3)],good[0].name).conclusion,"failure");
expect({checks:[...good,check(good[0].name,"failure",4)]},"FAILED",true);
expect({checks:[...good.slice(1),check(good[0].name,"failure",1),check(good[0].name,"success",5)]},"GREEN",false);
assert.match(recoveryGuidance({state:"FAILED"}).join(" "),/owner approval/);
assert.match(recoveryGuidance({state:"DRIFT"}).join(" "),/Cloudflare/);
assert.equal(ownerAcknowledged([{user:{login:"RosevearCreations"},body:"/ack-release-incident "+a}],a,"RosevearCreations"),true);
assert.equal(ownerAcknowledged([{user:{login:"outsider"},body:"/ack-release-incident "+a}],a,"RosevearCreations"),false);
assert.equal(ownerAcknowledged([{user:{login:"RosevearCreations"},body:"/ack-release-incident "+b}],a,"RosevearCreations"),false);
assert.match(incidentDashboard(expect({}, "GREEN", false)),/No recovery action needed/);
assert.match(incidentDashboard(expect({deployments:[deploy(a,"failure")]},"FAILED",true)),/REQUIRED/);
assert.match(incidentDashboard(expect({deployments:[deploy(a,"failure")]},"FAILED",true),{acknowledged:true}),/ACKNOWLEDGED/);
const dashboardContent=dashboard(expect({},"GREEN",false));
assert.ok(!dashboardContent.includes("Bearer "));
assert.match(dashboardContent,/Exact main, Cloudflare Production and business checks agree/);
const flow=readFileSync(new URL("../.github/workflows/release-health-monitor.yml",import.meta.url),"utf8");
assert.match(flow,/workflow_run:/);
assert.match(flow,/schedule:/);
assert.match(flow,/issues: write/);
assert.match(flow,/ref: main/);
assert.match(flow,/release_health_monitor.mjs/);
assert.match(flow,/release_health_monitor_test.mjs/);
assert.ok(!flow.includes("force:true"));
console.log("Release health monitor: exact-SHA, live drift, stale, failed, pending, newest-check, visibility and operator-alert tests PASS");

// Build 578: retain deterministic remediation decision acceptance in release-health gate.
await import('./release_incident_decision_ledger_test.mjs');

// Build 579: require persisted receipt dashboard safety regressions in source gate.
await import('./release_incident_receipt_dashboard_test.mjs');

// Build 580 privileged collector and chained audit snapshot acceptance.
await import('./release_incident_audit_snapshot_test.mjs');

// Build 581: trusted retention contract acceptance.
await import('./release_incident_trusted_retention_test.mjs');
