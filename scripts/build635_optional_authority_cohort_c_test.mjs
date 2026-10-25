import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const files=[
  "service-economics-seasonal-capacity-reliability-evidence-freshness-review-authority.yml",
  "service-economics-seasonal-capacity-reliability-integrity-review-authority.yml",
  "service-economics-seasonal-capacity-reliability-trend-continuity-authority.yml",
  "staff-mobile-closure-evidence-freshness-review-authority.yml",
  "staff-mobile-closure-evidence-integrity-review-authority.yml",
  "staff-mobile-remediation-closure-outcome-continuity-authority.yml",
  "staff-mobile-remediation-execution-evidence-readiness-authority.yml",
  "seasonal-capability-public-claim-evidence-integrity-review-authority.yml",
  "seasonal-capability-public-claim-outcome-freshness-review-authority.yml",
  "reliability-cost-recovery-evidence-continuity-authority.yml",
  "reliability-cost-resilience-trend-review-authority.yml",
  "provider-evidence-closure-availability-review-authority.yml"
];
assert.equal(files.length,12);
assert.equal(new Set(files).size,12);
for(const filename of files){
  const yaml=readFileSync(new URL("../.github/workflows/"+filename,import.meta.url),"utf8");
  const header=yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
  const push=header.split(/\n  pull_request:/)[0];
  const pr=header.split(/\n  pull_request:/)[1]||"";
  assert.match(header,/^on:\s*$/m,"Event trigger missing "+filename);
  assert.match(push,/^  push:\s*$/m,"Keep protected push checks "+filename);
  assert.match(push,/\bdev\b/,"Keep dev push "+filename);
  assert.match(push,/\bmain\b/,"Keep main push "+filename);
  assert.doesNotMatch(push,/(?:'build\*'|"build\*"|\bbuild\*)/,"No redundant broad feature push "+filename);
  assert.match(pr,/\bdev\b/,"Keep PR checks on dev "+filename);
  assert.match(pr,/\bmain\b/,"Keep PR checks on main "+filename);
  assert.match(header,/workflow_dispatch:/,"Keep manual dispatch "+filename);
  assert.match(yaml,/^jobs:/m,"Keep full CI job body "+filename);
  assert.match(yaml,/runs-on:\s*ubuntu-latest/,"Keep test runner "+filename);
}
const wrapper=readFileSync(new URL("./current_optional_authority_triggers.sh",import.meta.url),"utf8");
assert.match(wrapper,/set -euo pipefail/,"Stable wrapper must fail closed");
for(const test of ["build633_optional_authority_triggers_test.mjs",
  "build634_optional_authority_cohort_b_test.mjs",
  "build635_optional_authority_cohort_c_test.mjs"]){
  assert.ok(wrapper.includes("node scripts/"+test),"Preserve prior cohort checks and require "+test);
}
const gate=readFileSync(new URL("../.github/workflows/development-source-gate.yml",import.meta.url),"utf8");
assert.match(gate,/bash scripts\/current_optional_authority_triggers\.sh/);
for(const label of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"]){
  assert.ok(gate.includes("name: "+label),"Preserve required "+label);
}
assert.match(gate,/source-gate-partition-a, source-gate-partition-b, source-gate-partition-c, source-gate-partition-d/);
console.log("Build 635: 12 optional authority triggers narrowed, A-D aggregate and cohorts 633-635 retained: PASS");
