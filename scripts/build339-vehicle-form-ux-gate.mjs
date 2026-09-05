import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const planner = read('booking-planner.html');
const policies = read('assets/site-policies.js');
const ux = read('assets/booking-vehicle-form-ux.js');

const fail = (message) => {
  console.error(`BUILD 339 FAIL: ${message}`);
  process.exitCode = 1;
};
const requireText = (text, needle, label) => {
  if (!text.includes(needle)) fail(`${label} missing: ${needle}`);
};

for (const id of ['veh_year','veh_make','veh_model','veh_color','veh_mileage','vehicle_size','veh_category','veh_body']) {
  requireText(planner, `id="${id}"`, `booking planner vehicle control ${id}`);
  requireText(ux, id, `vehicle UX contract ${id}`);
}

requireText(planner, '<script src="/assets/site-policies.js" defer></script>', 'planner enhancement hook');
requireText(policies, "currentPath() === '/booking-planner'", 'planner route guard');
requireText(policies, "return currentPath() === '/book';", 'public /book hook remains isolated');
requireText(policies, '/assets/booking-vehicle-form-ux.js?v=20260904build339', 'Build 339 module import');
requireText(policies, 'wireBookingVehicleFormUX();', 'Build 339 DOMContentLoaded wiring');

for (const contract of [
  'build339-vehicle-head',
  'build339-vehicle-grid',
  'build339-vehicle-field',
  'build339-vehicle-label',
  'build339-vehicle-hint',
  'build339-garage-card',
  'build339-garage-list',
  'Required to continue: year, make, model and vehicle size',
  '@media(max-width:900px)',
  '@media(max-width:640px)',
  'aria-describedby'
]) requireText(ux, contract, 'vehicle UX presentation contract');

if (/cloneNode\s*\(/.test(ux)) fail('enhancer must not clone live booking controls');
if (/outerHTML\s*=/.test(ux)) fail('enhancer must not replace live booking controls through outerHTML');
if (/\.replaceWith\s*\(/.test(ux)) fail('enhancer must not replace live booking controls');
if (/remove\s*\(\s*\)/.test(ux)) fail('enhancer must not remove booking controls');

requireText(ux, 'control.parentElement', 'in-place field enhancement');
requireText(ux, 'classList.add', 'in-place CSS class enhancement');

if (!process.exitCode) console.log('BUILD 339 PASS: vehicle form UX is structured, responsive, accessible, and preserves live planner controls.');
