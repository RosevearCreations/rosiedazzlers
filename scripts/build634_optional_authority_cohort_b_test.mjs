import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const files=[
  "booking-funnel-quote-pricing-learning-authority.yml",
  "detailer-staff-workflow-refinement-authority.yml",
  "fleet-account-pipeline-authority.yml",
  "fleet-account-operations-authority.yml",
  "fleet-business-rulebook-authority.yml",
  "maintenance-retention-followup-authority.yml",
  "maintenance-plan-business-rulebook-authority.yml",
  "maintenance-plan-pilot-activation-authority.yml",
  "provider-local-search-evidence-continuity-authority.yml",
  "provider-local-search-closure-evidence-continuity-review-authority.yml",
  "provider-local-search-closure-evidence-freshness-review-authority.yml",
  "provider-local-search-closure-evidence-integrity-review-authority.yml",
  "provider-local-search-manual-closure-outcome-continuity-authority.yml",
  "provider-local-search-outcome-evidence-refresh-authority.yml",
  "provider-evidence-reconciliation-refresh-authority.yml"
];
assert.equal(files.length,15);
assert.equal(new Set(files).size,15);
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
for(const file of files) {
  const yaml=read("../.github/workflows/"+file);
  const beforePR=yaml.split(/\n  pull_request:/)[0];
  const header=yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
  assert.match(beforePR,/^  push:/m,"push event retained "+file);
  assert.match(beforePR,/\bdev\b/,"dev push retained "+file);
  assert.match(beforePR,/\bmain\b/,"main push retained "+file);
  assert.doesNotMatch(beforePR,/(?:['"]build\*['"]|\bbuild\*)/,"no redundant build* push "+file);
  assert.match(header,/  pull_request:/,"PR event retained "+file);
  assert.match(header,/workflow_dispatch:/,"manual event retained "+file);
  assert.match(yaml,/^jobs:/m,"test job body retained "+file);
  assert.match(yaml,/runs-on:\s*ubuntu-latest/,"existing runner retained "+file);
}
const wrapper=read("./current_optional_authority_triggers.sh");
assert.match(wrapper,/set -euo pipefail/);
assert.match(wrapper,/node scripts\/build633_optional_authority_triggers_test\.mjs/);
assert.match(wrapper,/node scripts\/build634_optional_authority_cohort_b_test\.mjs/);
const gate=read("../.github/workflows/development-source-gate.yml");
assert.match(gate,/bash scripts\/current_optional_authority_triggers\.sh/);
for(const check of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"])assert.ok(gate.includes("name: "+check),"Required check preserved "+check);
assert.match(gate,/needs:\s*\[source-gate-partition-a, source-gate-partition-b, source-gate-partition-c, source-gate-partition-d\]/);
console.log("Build 634 optional cohort B triggers + protected source gate: PASS");
