import assert from 'node:assert/strict';
import test from 'node:test';
import { garageSelection893 } from '../assets/booking-vehicle-selector.js';

const id = '00112233-4455-4677-8899-aabbccddeeff';
const signedInGarage = [{ id }, { id: 'not-a-uuid' }, { name: 'missing identifier' }];

test('only a valid saved vehicle in the authenticated dashboard may be selected', () => {
  assert.equal(garageSelection893(signedInGarage, '0'), id);
  for (const input of ['', '-1', '0.0', '01', '1e0', 'Infinity', '1', '2', '3', '9999999999999999999999', '__proto__']) {
    assert.equal(garageSelection893(signedInGarage, input), null, input);
  }
});
test('missing dashboard, invalid ids and tampered indices fail closed', () => {
  for (const rows of [null, undefined, {}, [], [{id:'abc'}], [{id:123}], [{id:'  '+id+'  '}]]) {
    assert.equal(garageSelection893(rows, '0'), null);
  }
  assert.equal(garageSelection893(signedInGarage, 0), null);
});
test('booking vehicle selector never treats the client cookie as an ownership proof', async () => {
  const { readFile } = await import('node:fs/promises');
  const text = await readFile(new URL('../assets/booking-vehicle-selector.js', import.meta.url),'utf8');
  assert.match(text, /credentials: "include"/);
  assert.match(text, /cache: "no-store"/);
  assert.match(text, /clearSelectorCookie\(\);\s*const vehicles = await vehiclesPromise/);
  assert.match(text, /garageSelection893\(vehicles, rawIndex\)/);
  assert.match(text, /checkout endpoint must independently verify/);
  assert.doesNotMatch(text, /localStorage|sessionStorage/);
});
