import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trendSnapshot820,workloadSignals820} from '../assets/build820-followup-trends.mjs';
import {COMPARISON_MODES_821,compareSnapshots821,workloadExplanations821,readableReport821} from '../assets/build821-followup-comparisons.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-08T20:00:00Z');
const waiting=(id,requested_at)=>({id,status:'awaiting_staff',requested_at,booking_id:'PRIVATE-BOOKING',request_text:'Private customer request',private_note:'Private supervisor note'});
const rows=[
  waiting('a','2026-11-08T12:00:00Z'),
  waiting('b','2026-11-07T12:00:00Z'),
  waiting('c','2026-11-07T11:00:00Z'),
  waiting('d','2026-11-04T20:00:00Z'),
  waiting('e','2026-10-26T20:00:00Z'),
  waiting('f','2026-11-09T20:00:00Z'),
];
const snapshot=trendSnapshot820(rows,now);
assert.deepEqual(COMPARISON_MODES_821.map(m=>m.key),['adjacent','recent_older','known_unknown']);
const adjacent=compareSnapshots821(snapshot,'adjacent');
assert.equal(adjacent.ok,true);
assert.equal(adjacent.left.total,1);assert.equal(adjacent.right.total,2);assert.equal(adjacent.difference,-1);
assert.match(adjacent.guidance,/equal-duration|not a true historical growth rate/i);
const unequal=compareSnapshots821(snapshot,'recent_older');
assert.equal(unequal.ok,true);assert.equal(unequal.left.total,4);assert.equal(unequal.right.total,1);
assert.equal(unequal.difference,null);assert.match(unequal.guidance,/unequal/i);
const unknown=compareSnapshots821(snapshot,'known_unknown');
assert.equal(unknown.ok,true);assert.equal(unknown.left.total,5);assert.equal(unknown.right.total,1);assert.equal(unknown.difference,null);
assert.match(unknown.guidance,/source review/i);
assert.equal(compareSnapshots821(snapshot,'unsupported').ok,false);
assert.equal(compareSnapshots821(null,'adjacent').ok,false);
const corrupted={...snapshot,cohorts:{...snapshot.cohorts,latest:{...snapshot.cohorts.latest,total:99}}};
assert.equal(compareSnapshots821(corrupted,'adjacent').ok,false,'contradictory counts must fail closed');
const missing={...snapshot,cohorts:{...snapshot.cohorts,previous:null}};
assert.equal(compareSnapshots821(missing,'adjacent').ok,false);
const tooMany={...snapshot,cohorts:{...snapshot.cohorts,latest:{...snapshot.cohorts.latest,total:150,waiting:150},previous:{...snapshot.cohorts.previous,total:1,waiting:1}}};
assert.equal(compareSnapshots821(tooMany,'adjacent').ok,false,'combined totals cannot exceed 150');
assert.equal(compareSnapshots821(trendSnapshot820([],now),'adjacent').difference,0);

const partial=workloadSignals820(rows,{now,ownershipReady:false,escalationReady:false});
const details=workloadExplanations821(partial);
assert.equal(details.length,6);
assert.equal(details.find(x=>x.key==='older48h').count,2);
assert.equal(details.find(x=>x.key==='unowned').count,null);
assert.equal(details.find(x=>x.key==='openEscalations').count,null);
assert.match(details.find(x=>x.key==='older48h').explanation,/not an SLA breach/);
assert.match(details.find(x=>x.key==='reviewPast').explanation,/not a customer promise/);
const verified=workloadSignals820(rows,{now,ownershipReady:true,owners:[{followup_id:'a'}],escalationReady:true,escalations:[]});
assert.equal(workloadExplanations821(verified).find(x=>x.key==='unowned').count,5);
const report=readableReport821(adjacent,partial);
assert.match(report,/Read-only comparison/);
assert.match(report,/source unavailable/);
assert.match(report,/Observed request count difference \(first minus second\): -1/);
assert.doesNotMatch(readableReport821(unequal,partial),/Observed request count difference/);
assert.match(readableReport821(unequal,partial),/No count difference is calculated/);
assert.match(readableReport821({ok:false},partial),/No verified comparison/);
for(const privateValue of ['PRIVATE-BOOKING','Private customer request','Private supervisor note','2026-11-08T12:00:00Z','booking_id'])assert.ok(!report.includes(privateValue));
assert.doesNotMatch(read('../assets/build821-followup-comparisons.mjs'),/fetch\(|localStorage|sessionStorage|download\(|clipboard|private_note|booking_id|request_text|customer_feedback/i);

const html=read('../admin-today.html');assert.equal(html,read('../admin-today/index.html'));
assert.match(html,/admin-worksite-followups-v814\.mjs\?v=build82[123]/);
assert.match(html,/worksite-issues-v811\.css\?v=build82[123]/);
assert.match(html,/Build 82[123] · (?:Accessible comparison and review guidance|Saved comparisons and source-verified exception review|Internal review drafts, preset renaming and source freshness)/);
const app=read('../assets/admin-worksite-followups-v814.mjs');
for(const token of ['ensureComparisonSurface821','renderComparisonSurface821','build821ComparisonMode','build821ComparisonRows','build821ComparisonStatus','build821ThresholdList','build821ReadableReport','compareSnapshots821','workloadExplanations821','readableReport821'])assert.ok(app.includes(token),`Missing UI integration: ${token}`);
assert.match(app,/role="region" aria-label="Accessible follow-up cohort comparison" tabindex="0"/);
assert.match(app,/role="status" aria-live="polite" tabindex="-1"/);
assert.match(app,/\$\('build821ComparisonMode'\)\.addEventListener\('change',\(\)=>\{(?:clearPresetSelection822\(\);)?render\(\);/);
assert.match(app,/report\.textContent=readableReport821\(comparison,signals\)/,'plain report must be inert text');
assert.doesNotMatch(app,/createObjectURL|\.download\s*=|\.writeText\s*\(/);
const css=read('../assets/worksite-issues-v811.css');
assert.match(css,/\.build821-comparison-scroll:focus-visible/);
assert.match(css,/@media\(max-width:600px\)\{\.build821-comparison/);
assert.match(read('./current_booking_wizard_regression.sh'),/build821_followup_comparison_accessibility_test.mjs/);
console.log('Build 821 PASS: cohort comparison controls, fail-closed totals, truthful workload thresholds and accessible aggregate-only report.');
