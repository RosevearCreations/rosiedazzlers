import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const files = [
  "booking-quote-experiment-outcome-interpretation-authority.yml",
  "booking-quote-experiment-follow-up-decision-authority.yml",
  "booking-quote-follow-up-evidence-freshness-review-authority.yml",
  "fleet-maintenance-commercial-decision-closure-authority.yml",
  "local-search-provider-snapshot-continuity-descriptive-review-authority.yml",
  "local-search-provider-window-attribution-closure-authority.yml",
  "booking-quote-experiment-approval-measurement-lock-authority.yml",
  "booking-quote-experiment-follow-up-outcome-continuity-authority.yml",
  "booking-quote-experiment-readiness-authority.yml",
  "booking-quote-follow-up-evidence-integrity-review-authority.yml",
  "local-search-provider-attribution-evidence-quality-authority.yml",
  "local-search-provider-evidence-refresh-authority.yml",
  "local-search-measurement-conversion-attribution-authority.yml",
  "maintenance-fleet-continuation-evidence-freshness-review-authority.yml",
  "maintenance-fleet-continuation-evidence-integrity-review-authority.yml",
  "maintenance-fleet-continuation-outcome-continuity-authority.yml",
  "maintenance-fleet-pilot-continuation-decision-authority.yml",
  "controlled-environment-routing-outcome-evidence-continuity-authority.yml",
  "controlled-environment-routing-outcome-freshness-capacity-review-authority.yml",
  "controlled-environment-routing-capacity-evidence-integrity-review-authority.yml",
  "fleet-maintenance-commercial-activation-readiness-authority.yml"
];
assert.equal(new Set(files).size,21,"Workflow inventory must be exact");
for(const name of files){
  const yaml=readFileSync(new URL("../.github/workflows/"+name,import.meta.url),"utf8");
  const header=yaml.split(/\n(?:permissions|jobs):/)[0];
  const beforePR=header.split(/\n  pull_request:/)[0];
  const pr=header.split(/\n  pull_request:/)[1]||"";
  assert.match(header,/^on:\s*$/m,"Keep event triggers");
  assert.match(beforePR,/^  push:/m,"Keep protected push checks: "+name);
  assert.match(beforePR,/\bdev\b/,"Keep dev push: "+name);
  assert.match(beforePR,/\bmain\b/,"Keep main push: "+name);
  assert.doesNotMatch(beforePR,/(?:'build\*'|"build\*"|\bbuild\*)/,"Do not re-enable redundant broad feature push: "+name);
  assert.match(pr,/\bdev\b/,"Keep PR to dev: "+name);
  assert.match(pr,/\bmain\b/,"Keep PR to main: "+name);
  assert.match(header,/workflow_dispatch:/,"Keep manual verification: "+name);
  assert.match(yaml,/^jobs:/m,"Never remove jobs: "+name);
  assert.match(yaml,/runs-on:\s*ubuntu-latest/,"Keep runner tests: "+name);
}
const gate=readFileSync(new URL("../.github/workflows/development-source-gate.yml",import.meta.url),"utf8");
for(const name of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"]){
  assert.ok(gate.includes("name: "+name),"Must not weaken required "+name);
}
assert.match(gate,/bash scripts\/current_optional_authority_triggers\.sh/);
const wrapper=readFileSync(new URL("./current_optional_authority_triggers.sh",import.meta.url),"utf8");
assert.match(wrapper,/set -euo pipefail/);
assert.match(wrapper,/node scripts\/build633_optional_authority_triggers_test\.mjs/);
assert.match(gate,/source-gate-partition-a, source-gate-partition-b, source-gate-partition-c, source-gate-partition-d/);
console.log("Build 633: 21 optional authority workflow triggers narrowed; all required source gates preserved: PASS");
