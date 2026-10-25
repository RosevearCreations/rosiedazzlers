import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const files=[
  "service-economics-seasonal-capacity-reliability-decision-readiness-authority.yml",
  "service-economics-seasonal-capacity-reliability-decision-outcome-continuity-authority.yml",
  "service-economics-seasonal-operations-reliability-review-authority.yml",
  "service-economics-commercial-capacity-review-authority.yml",
  "staff-mobile-remediation-outcome-interpretation-follow-up-authority.yml",
  "staff-mobile-remediation-outcome-evidence-authority.yml",
  "staff-mobile-remediation-closure-readiness-authority.yml",
  "maintenance-fleet-pilot-outcome-continuity-review-authority.yml",
  "seasonal-capability-public-claim-decision-outcome-continuity-authority.yml",
  "provider-outcome-delivery-evidence-closure-authority.yml",
  "provider-outcome-review-hold-decision-readiness-authority.yml",
  "service-economics-completeness-addon-cost-readiness-authority.yml"
];
assert.equal(files.length,12);
assert.equal(new Set(files).size,12);
for(const filename of files){
  const yaml=readFileSync(new URL("../.github/workflows/"+filename,import.meta.url),"utf8");
  const header=yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
  const beforePR=header.split(/\n  pull_request:/)[0];
  const afterPR=header.split(/\n  pull_request:/)[1]||"";
  assert.match(header,/^on:\s*$/m,"Keep workflow event triggers: "+filename);
  assert.match(beforePR,/^  push:\s*$/m,"Keep push trigger: "+filename);
  for(const target of ["dev","main"]){
    assert.match(beforePR,new RegExp("\\b"+target+"\\b"),"Keep "+target+" push: "+filename);
    assert.match(afterPR,new RegExp("\\b"+target+"\\b"),"Keep "+target+" pull request: "+filename);
  }
  assert.doesNotMatch(beforePR,/(?:'build\*'|"build\*"|\bbuild\*)/,"Do not reenable redundant broad build* push: "+filename);
  assert.match(header,/workflow_dispatch:/,"Keep manual execution: "+filename);
  assert.match(yaml,/^jobs:/m,"Keep actual test jobs: "+filename);
  assert.match(yaml,/runs-on:\s*ubuntu-latest/,"Keep test runner: "+filename);
}
const wrapper=readFileSync(new URL("./current_optional_authority_triggers.sh",import.meta.url),"utf8");
assert.match(wrapper,/set -euo pipefail/,"Fail closed on any test failure");
for(const n of [633,634,635,636]){
  const re=new RegExp("node scripts/build"+n+"_optional_authority_(?:triggers|cohort_[bcd])_test\\.mjs");
  assert.match(wrapper,re,"Retain entire cohort regression chain: "+n);
}
const gate=readFileSync(new URL("../.github/workflows/development-source-gate.yml",import.meta.url),"utf8");
assert.match(gate,/bash scripts\/current_optional_authority_triggers\.sh/,"Keep fail-closed source gate entry point");
for(const check of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"]){
 assert.ok(gate.includes("name: "+check),"Keep protected "+check);
}
assert.match(gate,/source-gate-partition-a, source-gate-partition-b, source-gate-partition-c, source-gate-partition-d/);
console.log("Build 636: 12 optional event selectors scoped; protected source gate and cohorts 633-636 preserved: PASS");
