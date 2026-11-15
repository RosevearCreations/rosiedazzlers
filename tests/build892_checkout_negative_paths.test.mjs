import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAlaCarte889} from '../functions/api/_lib/ala-carte-v889.js';

// Build 892: executable negative-path checkout guard tests, using synthetic
// catalogue data only. These tests never call checkout, Supabase or a provider.
const baseline=()=>({
  booking_rules:{ala_carte_policy:{enabled:true,owner_approved:true,version:'synthetic-test-only',deposit_cad:25,minimum_duration_slots:1}},
  addon_map:{headlights:{code:'headlights',name:'Headlight Restoration',standalone_allowed:true,quote_required:false,prices_cad:{mid:90}}}
});
const body=()=>({booking_mode:'ala_carte',vehicle_size:'mid',service_codes:['headlights'],duration_slots:1});
const reject=(catalog,selection,expected)=>{
  const result=resolveAlaCarte889(catalog,selection);
  assert.equal(result.ok,false);
  assert.equal(result.reason,expected);
  assert.equal(result.booking_created,false);
  assert.equal(result.payment_attempted,false);
};
test('sub-cent approved catalogue service never becomes a zero-cost checkout',()=>{
  const c=baseline();c.addon_map.headlights.prices_cad.mid=0.001;
  reject(c,body(),'STANDALONE_PRICE_MISSING');
});
test('sub-cent owner deposit cannot silently become a zero-cent payment',()=>{
  const c=baseline();c.booking_rules.ala_carte_policy.deposit_cad=0.001;
  reject(c,body(),'STANDALONE_DEPOSIT_NOT_APPROVED');
});
test('non-finite and nonnumeric catalogue prices fail closed',()=>{
  for(const value of [NaN,Infinity,-Infinity,'90',null,0,-1]){
    const c=baseline();c.addon_map.headlights.prices_cad.mid=value;
    assert.equal(resolveAlaCarte889(c,body()).ok,false);
  }
});
test('missing approval, quote-only and tampered browser totals never authorize a payment',()=>{
  const c=baseline();c.booking_rules.ala_carte_policy.owner_approved=false;
  reject(c,body(),'STANDALONE_OWNER_CATALOG_APPROVAL_HOLD');
  const q=baseline();q.addon_map.headlights.quote_required=true;
  reject(q,body(),'STANDALONE_ITEM_NOT_APPROVED');
  const good=resolveAlaCarte889(baseline(),{...body(),price_total_cents:1,deposit_cents:1});
  assert.equal(good.ok,true);
  assert.equal(good.subtotal_cents,9000);
  assert.equal(good.deposit_cents,2500);
  assert.equal(good.booking_created,false);
  assert.equal(good.payment_attempted,false);
});

test('duplicate, unknown and mixed service selections fail closed',()=>{
  const duplicate=body();duplicate.service_codes=['headlights','headlights'];
  reject(baseline(),duplicate,'STANDALONE_SELECTION_INVALID');
  const unknown=body();unknown.service_codes=['unlisted'];
  reject(baseline(),unknown,'STANDALONE_ITEM_NOT_APPROVED');
  reject(baseline(),{...body(),package_code:'premium'},'MIXED_PACKAGE_AND_ALA_CARTE');
  reject(baseline(),{...body(),addon_codes:['headlights']},'MIXED_PACKAGE_AND_ALA_CARTE');
});
test('unsupported vehicle size, unapproved duration and gift/promo require review',()=>{
  reject(baseline(),{...body(),vehicle_size:'unknown'},'VEHICLE_SIZE_INVALID');
  reject(baseline(),{...body(),duration_slots:0},'STANDALONE_DURATION_REVIEW_HOLD');
  reject(baseline(),{...body(),gift_code:'TEST'},'STANDALONE_GIFT_PROMO_REVIEW_HOLD');
  reject(baseline(),{...body(),promo_code:'TEST'},'STANDALONE_GIFT_PROMO_REVIEW_HOLD');
});
test('unsafe deposit cents never authorize a checkout',()=>{
  const c=baseline();c.booking_rules.ala_carte_policy.deposit_cad=Number.MAX_SAFE_INTEGER;
  reject(c,body(),'STANDALONE_DEPOSIT_NOT_APPROVED');
});

test('fractional-cent catalogue prices and deposits fail closed rather than round',()=>{
  for(const price of [90.001,90.999,0.009]){
    const c=baseline();c.addon_map.headlights.prices_cad.mid=price;
    reject(c,body(),'STANDALONE_PRICE_MISSING');
  }
  for(const deposit of [25.001,25.999,0.009]){
    const c=baseline();c.booking_rules.ala_carte_policy.deposit_cad=deposit;
    reject(c,body(),'STANDALONE_DEPOSIT_NOT_APPROVED');
  }
  const c=baseline();c.addon_map.headlights.prices_cad.mid=90.29;
  c.booking_rules.ala_carte_policy.deposit_cad=25.29;
  const accepted=resolveAlaCarte889(c,body());
  assert.equal(accepted.ok,true);
  assert.equal(accepted.subtotal_cents,9029);
  assert.equal(accepted.deposit_cents,2529);
});
