import assert from 'node:assert/strict';
import { recommendService } from '../assets/service-recommendation.js';

const packages = [
  {
    code: 'wash', name: 'Wash', service_level: 'maintenance', customer_goal: 'Quick exterior refresh',
    best_for: 'Maintained exterior', recommendation_tags: ['quick', 'exterior', 'maintenance'],
    prices_cad: { small: 80, mid: 100, oversize: 120 }
  },
  {
    code: 'basic', name: 'Basic', service_level: 'refresh', customer_goal: 'Quick interior reset',
    best_for: 'Daily driver interior', recommendation_tags: ['interior', 'quick', 'refresh', 'maintenance'],
    prices_cad: { small: 110, mid: 130, oversize: 160 }
  },
  {
    code: 'complete', name: 'Complete', service_level: 'full detail', customer_goal: 'Interior and exterior reset',
    best_for: 'Best all around inside and outside reset', recommendation_tags: ['best all around', 'inside and outside', 'family vehicle'],
    prices_cad: { small: 300, mid: 350, oversize: 400 }, photo_estimate_recommended: true
  },
  {
    code: 'interior', name: 'Interior', service_level: 'deep interior', customer_goal: 'Deep interior clean',
    best_for: 'Interior recovery with shampoo, pet hair, salt or odour', recommendation_tags: ['interior', 'deep clean', 'pet hair', 'odour'],
    prices_cad: { small: 190, mid: 220, oversize: 245 }, photo_estimate_recommended: true
  },
  {
    code: 'exterior', name: 'Exterior', service_level: 'exterior detail', customer_goal: 'Exterior gloss and prep',
    best_for: 'Full exterior detail for paint prep and protection', recommendation_tags: ['exterior', 'paint prep', 'gloss', 'sealant', 'clay'],
    prices_cad: { small: 190, mid: 220, oversize: 245 }, photo_estimate_recommended: true
  }
];

// 1. Empty or malformed catalogues fail closed with no fabricated recommendation.
assert.equal(recommendService({ packages: [] }), null);
assert.equal(recommendService({ packages: null }), null);

// 2. A maintained exterior goal chooses the light exterior option rather than the highest-priced package.
{
  const result = recommendService({ packages, goal: 'quick_exterior', condition: 'light', vehicleSize: 'small' });
  assert.equal(result.packageCode, 'wash');
}

// 3. A maintained interior goal chooses the quick interior option.
{
  const result = recommendService({ packages, goal: 'quick_interior', condition: 'light', vehicleSize: 'mid' });
  assert.equal(result.packageCode, 'basic');
}

// 4. Deep interior need selects the catalogue row whose metadata describes recovery work.
{
  const result = recommendService({ packages, goal: 'deep_interior', condition: 'heavy', vehicleSize: 'oversize' });
  assert.equal(result.packageCode, 'interior');
  assert.match(result.reason, /heavier \/ recovery/i);
}

// 5. Mixed inside-and-out need selects the all-around package.
{
  const result = recommendService({ packages, goal: 'full_reset', condition: 'heavy', vehicleSize: 'mid' });
  assert.equal(result.packageCode, 'complete');
  assert.match(result.reason, /Photos or booking notes/i);
}

// 6. Exterior finish/protection need selects the exterior-detail metadata match.
assert.equal(
  recommendService({ packages, goal: 'exterior_finish', condition: 'moderate', vehicleSize: 'small' }).packageCode,
  'exterior'
);

// 7. Unknown goal/condition inputs normalize safely instead of crashing or inventing a package code.
{
  const result = recommendService({ packages, goal: 'something-new', condition: 'unknown', vehicleSize: 'bus' });
  assert.ok(packages.some((row) => row.code === result.packageCode));
  assert.equal(result.goal, 'unsure');
  assert.equal(result.condition, 'moderate');
  assert.equal(result.vehicleSize, '');
}

// 8. Recommendations are deterministic for identical inputs.
{
  const input = { packages, goal: 'full_reset', condition: 'moderate', vehicleSize: 'mid' };
  assert.deepEqual(recommendService(input), recommendService(input));
}

// 9. Ranking never mutates the supplied catalogue rows.
{
  const copy = JSON.stringify(packages);
  recommendService({ packages, goal: 'deep_interior', condition: 'heavy', vehicleSize: 'small' });
  assert.equal(JSON.stringify(packages), copy);
}

// 10. Equal semantic scores use the applicable lower price as the tie-breaker, preventing price-driven upsell.
{
  const equalFit = [
    { code: 'higher', name: 'Higher', customer_goal: 'Quick exterior refresh', recommendation_tags: ['quick', 'exterior'], prices_cad: { small: 150 } },
    { code: 'lower', name: 'Lower', customer_goal: 'Quick exterior refresh', recommendation_tags: ['quick', 'exterior'], prices_cad: { small: 90 } }
  ];
  const result = recommendService({ packages: equalFit, goal: 'quick_exterior', condition: 'moderate', vehicleSize: 'small' });
  assert.equal(result.packageCode, 'lower');
}

// 11. Returned package codes always originate from the supplied catalogue.
for (const goal of ['quick_exterior', 'quick_interior', 'deep_interior', 'full_reset', 'exterior_finish', 'unsure']) {
  const result = recommendService({ packages, goal, condition: 'moderate', vehicleSize: 'mid' });
  assert.ok(packages.some((row) => row.code === result.packageCode));
}

console.log('Build 366 intelligent service recommendation regression cases: PASS');
