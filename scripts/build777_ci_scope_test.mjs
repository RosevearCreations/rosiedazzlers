import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const workflows=[
  'local-acquisition-content-proof-authority.yml',
  'local-acquisition-evidence-closure-authority.yml',
  'provider-evidence-closure-authority.yml',
  'provider-evidence-closure-availability-review-authority.yml',
  'provider-evidence-reconciliation-refresh-authority.yml',
  'provider-hold-decision-traceability-closure-review-authority.yml',
  'provider-local-search-closure-evidence-continuity-review-authority.yml',
  'provider-local-search-closure-evidence-freshness-review-authority.yml',
  'provider-local-search-closure-evidence-integrity-review-authority.yml',
  'provider-local-search-evidence-continuity-authority.yml',
  'provider-local-search-manual-closure-outcome-continuity-authority.yml',
  'provider-local-search-outcome-evidence-refresh-authority.yml',
  'provider-outcome-delivery-evidence-closure-authority.yml',
  'provider-outcome-review-hold-decision-readiness-authority.yml',
  'seasonal-capability-owner-review-public-claim-decision-authority.yml',
  'seasonal-capability-public-claim-activation-decision-authority.yml',
  'seasonal-capability-public-claim-decision-outcome-continuity-authority.yml',
  'seasonal-capability-public-claim-evidence-integrity-review-authority.yml',
  'seasonal-capability-public-claim-outcome-freshness-review-authority.yml',
  'winter-booking-eligibility-customer-transparency-authority.yml',
];
assert.equal(workflows.length,20);
assert.equal(new Set(workflows).size,20);
const group=name=>name.startsWith('local-acquisition')?'local':
  name.startsWith('provider-')?'provider':
  name.startsWith('seasonal-capability')?'seasonal':'winter';
const selectors={
  local:["'**/*local-acquisition*'","'**/*local-search*'","'**/*seo*'"],
  provider:["'**/*provider*'","'**/*payment*'","'**/*delivery*'"],
  seasonal:["'**/*seasonal-capability*'","'**/*public-claim*'","'**/*winter*'"],
  winter:["'**/*winter*'","'**/*booking*'","'**/*weather*'"]
};
for(const name of workflows){
  const content=readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');
  assert.match(content,/^on:\s*$/m,name+' event boundary');
  assert.match(content,/^  workflow_dispatch:\s*$/m,name+' manual dispatch retained');
  assert.match(content,/^jobs:\s*$/m,name+' original jobs retained');
  assert.match(content,/runs-on:\s*ubuntu-latest/,name+' runner retained');
  for(const [start,end] of [['push','pull_request'],['pull_request','workflow_dispatch']]){
    const section=content.split(new RegExp('^  '+start+':\\s*$','m'))[1]
      ?.split(new RegExp('^  '+end+':\\s*$','m'))[0];
    assert.ok(section,name+' '+start+' remains');
    assert.match(section,/\bdev\b/,name+' protected dev retained');
    assert.match(section,/\bmain\b/,name+' protected main retained');
    assert.match(section,/^    paths:\s*$/m,name+' optional path scope');
    assert.ok(section.includes("'.github/workflows/"+name+"'"),name+' self-change');
    for(const selector of selectors[group(name)])
      assert.ok(section.includes(selector),name+' selector '+selector);
    for(const shared of ["'functions/api/_lib/staff-auth.js'",
      "'functions/_middleware.js'","'scripts/release_check.py'",
      "'scripts/ci-source-cache/**'","'assets/styles.css'"])
      assert.ok(section.includes(shared),name+' shared contract '+shared);
    if(group(name)==='winter')assert.ok(
      section.includes("'!scripts/current_booking_wizard_regression.sh'"),
      name+' shared all-build entrypoint excluded');
    assert.doesNotMatch(section,/['"]?\*\*\/\*\*?['"]?\s*$/m,
      name+' must not restore all-file trigger');
  }
}
// On the full GitHub checkout this also pins the four protected check names.
const gate=new URL('../.github/workflows/development-source-gate.yml',import.meta.url);
if(existsSync(gate)){
  const source=readFileSync(gate,'utf8');
  for(const name of ['source checks suite A','source checks suite B',
    'source checks suite C','source checks suite D','source checks'])
    assert.ok(source.includes('name: '+name),'Never remove '+name);
  assert.match(source,/bash scripts\/current_optional_authority_triggers\.sh/);
}
console.log('Build 777 CI PASS: 20 further optional authorities path-scoped, original jobs, dispatch and protected source check names retained.');
