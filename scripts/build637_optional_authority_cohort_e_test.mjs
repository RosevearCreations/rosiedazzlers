import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const files=[
  "staff-mobile-friction-remediation-priorities-authority.yml",
  "staff-mobile-remediation-verification-authority.yml",
  "staff-support-mobile-efficiency-learning-authority.yml",
  "staff-workflow-support-exception-learning-authority.yml",
  "service-economics-capacity-pricing-review-authority.yml",
  "seasonal-capability-public-claim-activation-decision-authority.yml",
  "reliability-cost-resilience-operational-guardrails-authority.yml"
];
assert.equal(files.length,7);
assert.equal(new Set(files).size,7);
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
for(const name of files){
  const yaml=read("../.github/workflows/"+name);
  const header=yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
  const beforePR=header.split(/\n  pull_request:/)[0];
  const pr=header.split(/\n  pull_request:/)[1]||"";
  assert.match(header,/^on:\s*$/m);
  assert.match(beforePR,/^  push:\s*$/m,"Keep protected push authority: "+name);
  assert.match(beforePR,/\bdev\b/,"Keep dev push: "+name);
  assert.match(beforePR,/\bmain\b/,"Keep main push: "+name);
  assert.doesNotMatch(beforePR,/(?:'build\*'|"build\*"|\bbuild\*)/,"No redundant broad feature push: "+name);
  assert.match(pr,/\bdev\b/,"Keep dev PR: "+name);
  assert.match(pr,/\bmain\b/,"Keep main PR: "+name);
  assert.match(header,/workflow_dispatch:/,"Keep manual verification: "+name);
  assert.match(yaml,/^jobs:/m,"Keep all job definitions: "+name);
  assert.match(yaml,/runs-on:\s*ubuntu-latest/,"Keep real test runner: "+name);
}
const wrapper=read("./current_optional_authority_triggers.sh");
assert.match(wrapper,/set -euo pipefail/,"Required regression wrapper must fail closed");
for(const test of [
 "build633_optional_authority_triggers_test.mjs",
 "build634_optional_authority_cohort_b_test.mjs",
 "build635_optional_authority_cohort_c_test.mjs",
 "build636_optional_authority_cohort_d_test.mjs",
 "build637_optional_authority_cohort_e_test.mjs"
])assert.ok(wrapper.includes("node scripts/"+test),"Preserve all earlier tests and "+test);
const gate=read("../.github/workflows/development-source-gate.yml");
assert.match(gate,/bash scripts\/current_optional_authority_triggers\.sh/);
for(const label of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"]){
 assert.ok(gate.includes("name: "+label),"Never remove required "+label);
}
assert.match(gate,/source-gate-partition-a, source-gate-partition-b, source-gate-partition-c, source-gate-partition-d/);
console.log("Build 637 — cohort E seven optional authority triggers narrowed, all source checks preserved: PASS");
