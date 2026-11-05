import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Reviewed optional cohort from Build 633. These are not the protected
// release source gate, exact-SHA acceptance or release health workflows.
const workflows=[
  'booking-quote-experiment-outcome-interpretation-authority.yml',
  'booking-quote-experiment-follow-up-decision-authority.yml',
  'booking-quote-follow-up-evidence-freshness-review-authority.yml',
  'fleet-maintenance-commercial-decision-closure-authority.yml',
  'local-search-provider-snapshot-continuity-descriptive-review-authority.yml',
  'local-search-provider-window-attribution-closure-authority.yml',
  'booking-quote-experiment-approval-measurement-lock-authority.yml',
  'booking-quote-experiment-follow-up-outcome-continuity-authority.yml',
  'booking-quote-experiment-readiness-authority.yml',
  'booking-quote-follow-up-evidence-integrity-review-authority.yml',
  'local-search-provider-attribution-evidence-quality-authority.yml',
  'local-search-provider-evidence-refresh-authority.yml',
  'local-search-measurement-conversion-attribution-authority.yml',
  'maintenance-fleet-continuation-evidence-freshness-review-authority.yml',
  'maintenance-fleet-continuation-evidence-integrity-review-authority.yml',
  'maintenance-fleet-continuation-outcome-continuity-authority.yml',
  'maintenance-fleet-pilot-continuation-decision-authority.yml',
  'controlled-environment-routing-outcome-evidence-continuity-authority.yml',
  'controlled-environment-routing-outcome-freshness-capacity-review-authority.yml',
  'controlled-environment-routing-capacity-evidence-integrity-review-authority.yml',
  'fleet-maintenance-commercial-activation-readiness-authority.yml',
];
assert.equal(workflows.length,21);
assert.equal(new Set(workflows).size,21);
const domain=name=>name.includes('booking')?'booking':
  name.includes('fleet')||name.includes('maintenance')?'fleet':
  name.includes('local-search')?'local-search':
  name.includes('controlled-environment')?'routing':null;
const expected={
  booking:["'**/*booking*'","'**/*quote*'","'**/*pricing*'"],
  fleet:["'**/*fleet*'","'**/*maintenance*'","'**/*service-economics*'"],
  'local-search':["'**/*local-search*'","'**/*provider*'"],
  routing:["'**/*routing*'","'**/*capacity*'","'**/*controlled-environment*'"]
};
for(const name of workflows){
  const content=readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');
  const group=domain(name);
  assert.ok(group,'Unknown optional domain '+name);
  assert.match(content,/^on:\s*$/m,name+' retains event contract');
  assert.match(content,/^  workflow_dispatch:\s*$/m,name+' manual recheck retained');
  assert.match(content,/^jobs:\s*$/m,name+' original job retained');
  assert.match(content,/runs-on:\s*ubuntu-latest/,name+' runner retained');
  for(const [start,end] of [['push','pull_request'],['pull_request','workflow_dispatch']]){
    const section=content.split(new RegExp('^  '+start+':\\s*$','m'))[1]
      ?.split(new RegExp('^  '+end+':\\s*$','m'))[0];
    assert.ok(section,name+' '+start+' trigger retained');
    assert.match(section,/\bdev\b/,name+' protected dev');
    assert.match(section,/\bmain\b/,name+' protected main');
    assert.match(section,/^    paths:\s*$/m,name+' path scope mandatory');
    assert.ok(section.includes("'.github/workflows/"+name+"'"),name+' self-change check');
    for(const path of expected[group])assert.ok(section.includes(path),name+' '+path);
    assert.ok(section.includes("'functions/api/_lib/staff-auth.js'"),name+' shared auth');
    assert.ok(section.includes("'functions/_middleware.js'"),name+' shared middleware');
    assert.ok(section.includes("'scripts/release_check.py'"),name+' release source');
    if(group==='booking')assert.ok(section.includes("'!scripts/current_booking_wizard_regression.sh'"),
      name+' excludes shared all-build regression entrypoint');
    assert.doesNotMatch(section,/['"]?\*\*\/\*\*?['"]?\s*$/m,name+' must not use broad all-files selector');
  }
}
console.log('Build 776 CI PASS: 21 optional domain authorities path-scoped on push/PR; protected branches, manual dispatch and jobs retained.');
