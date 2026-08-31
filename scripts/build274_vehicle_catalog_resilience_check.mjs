import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourcePath = path.join(root, 'functions/api/_lib/vehicle-catalog.js');
const makesEndpointPath = path.join(root, 'functions/api/vehicle_makes.js');
const modelsEndpointPath = path.join(root, 'functions/api/vehicle_models.js');

const source = await fs.readFile(sourcePath, 'utf8');
const makesEndpoint = await fs.readFile(makesEndpointPath, 'utf8');
const modelsEndpoint = await fs.readFile(modelsEndpointPath, 'utf8');

assert.match(source, /https:\/\/vpic\.nhtsa\.dot\.gov\/api\/vehicles/);
assert.match(source, /fallbackVehicleMakes/);
assert.match(source, /fetchVpicJson/);
assert.doesNotMatch(source, /await\s+res\.text\(\)/, 'raw vPIC HTML must never be surfaced as a booking error');
assert.match(makesEndpoint, /degraded:\s*true/);
assert.match(makesEndpoint, /fallbackVehicleMakes/);
assert.match(modelsEndpoint, /models:\s*\[\]/);
assert.match(modelsEndpoint, /degraded:\s*true/);

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rosie-vpic-'));
const modulePath = path.join(tmp, 'vehicle-catalog.mjs');
await fs.copyFile(sourcePath, modulePath);
const mod = await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response(
    '<HTML><HEAD><TITLE>Access Denied</TITLE></HEAD><BODY>Access Denied</BODY></HTML>',
    { status: 403, headers: { 'Content-Type': 'text/html' } }
  );

  const deniedMakes = await mod.fetchVehicleMakes();
  assert.ok(Array.isArray(deniedMakes) && deniedMakes.length >= 30, '403 must return a useful fallback make list');
  assert.ok(deniedMakes.some((row) => row.make === 'Toyota'));
  const deniedModels = await mod.fetchVehicleModelsForMakeYear({ make: 'Toyota', year: 2024 });
  assert.deepEqual(deniedModels, [], '403 model lookup must fail open to manual entry');

  globalThis.fetch = async () => { throw new TypeError('simulated network failure'); };
  const offlineMakes = await mod.fetchVehicleMakes();
  assert.ok(offlineMakes.length >= 30, 'network failure must retain fallback makes');
  const offlineModels = await mod.fetchVehicleModelsForMakeYear({ make: 'Honda', year: 2024 });
  assert.deepEqual(offlineModels, [], 'network failure must retain manual model entry');
} finally {
  globalThis.fetch = originalFetch;
  await fs.rm(tmp, { recursive: true, force: true });
}

console.log('Build 274 vehicle-catalog resilience check: PASS');
console.log(' - official HTTPS vPIC authority retained');
console.log(' - vPIC HTTP/edge failures cannot abort vehicle-make bootstrap');
console.log(' - network failures retain common make suggestions');
console.log(' - model lookup failures return an empty suggestion list for manual entry');
console.log(' - raw external Access Denied HTML is never propagated');
