import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const workflow=readFileSync(new URL("../.github/workflows/development-source-gate.yml",import.meta.url),"utf8");
const header=workflow.split(/\n(?:permissions|concurrency):/)[0];
assert.match(header,/^name:\s*Current Source Gate\s*$/m);
assert.match(header,/^on:\s*$/m);
assert.match(header,/^  push:\n    branches:\n      - dev\n      - main\n/m);
assert.doesNotMatch(header,/^\s+- ['"]?build\*/m,"Feature branches should use PR checks instead of duplicate push checks");
assert.match(header,/^  pull_request:\n    branches:\n      - dev\n      - main\n/m,"Required PR gate must still run on both protected targets");
assert.match(header,/^  workflow_dispatch:/m,"Manual emergency verification remains available");
const gate=workflow.match(/^concurrency:\n([\s\S]*?)\n\njobs:/m)?.[1]||"";
assert.match(gate, /github\.event\.pull_request\.number \|\| github\.ref/,"Reuse same PR queue key across new commits");
assert.match(gate, /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/,
 "Cancel only superseded PR checks, never main/dev push runs");
for(const label of ["source checks suite A","source checks suite B","source checks suite C","source checks suite D","source checks"])
  assert.match(workflow,new RegExp("^\\s+name:\\s*"+label+"\\s*$","m"),"Protect check "+label);
for(const job of ["source-gate-partition-a","source-gate-partition-b","source-gate-partition-c","source-gate-partition-d"])
  assert.match(workflow,new RegExp("^  "+job+":","m"),"Protect job "+job);
const aggregate=workflow.split(/^  source-gate:\s*$/m)[1]||"";
assert.ok(aggregate.length>0,"Required aggregate must remain present");
for(const job of ["source-gate-partition-a","source-gate-partition-b","source-gate-partition-c","source-gate-partition-d"])
  assert.ok(aggregate.includes(job),"Aggregate must depend on "+job);
assert.match(aggregate,/if:\s*\$\{\{\s*always\(\)\s*\}\}/);
assert.match(workflow,/node scripts\/build631_final_review_validation_test\.mjs|bash scripts\/current_booking_wizard_regression\.sh/);
assert.match(workflow,/python3 scripts\/build404_error_recovery_weak_connection_reliability_check\.py/);
assert.match(workflow,/node scripts\/build339-vehicle-form-ux-gate\.mjs/);
assert.match(workflow,/node scripts\/build632_source_gate_dedup_test\.mjs/);
console.log("Build 632: mandatory source checks A-D + aggregate intact, PR supersession enabled, main/dev source gate retained: PASS");
