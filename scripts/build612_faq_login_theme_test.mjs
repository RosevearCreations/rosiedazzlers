import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const faq = read('faq.html');
const login = read('login.html');
const theme = read('assets/themes/standard.css');
const loginStyles = read('assets/login-standard.css');

assert.equal(faq, read('faq/index.html'), 'FAQ extension and folder routes must agree');
assert.equal(login, read('login/index.html'), 'Login extension and folder routes must agree');
assert.match(faq, /Find the right next step/);
assert.doesNotMatch(faq, /data-r2-image-keywords|data-photo-target="page:faq/,
  'FAQ static guide cards must never be filled from the historical R2 matcher');
assert.doesNotMatch(faq, /hydrateR2CardImages/);
assert.equal((faq.match(/class="faq-theme-card-photo"/g) || []).length, 4);

const paths = [...faq.matchAll(/class="faq-theme-card-photo" src="(\/assets\/themes\/standard\/images\/[^"]+)"/g)]
  .map((match) => match[1]);
assert.equal(new Set(paths).size, 4, 'FAQ cards need distinct theme-owned artwork');
for (const path of paths) {
  assert.ok(existsSync(join(new URL('../', import.meta.url).pathname, path.slice(1))), `${path} must exist`);
}
assert.match(theme, /\.faq-access-paths \.faq-theme-card-photo/);
assert.match(login, /login-standard\.css/);
assert.match(login, /<details class="login-registration">/);
assert.match(login, /const revealRegistration=/);
assert.match(login, /location\.hash==='#signupForm'/,
  'Public Create account links must expand the registration panel');
for (const formId of ['loginForm','signupForm','forgotForm','accountHelpForm','resetForm']) {
  assert.match(login, new RegExp(`id="${formId}"`), `${formId} must be preserved`);
}
for (const fieldId of ['loginEmail','loginPassword','signupName','signupEmail','signupPassword','signupVehicleNotes']) {
  assert.match(login, new RegExp(`id="${fieldId}"`), `${fieldId} must be preserved`);
}
assert.match(loginStyles, /max-width: 850px/);
assert.match(loginStyles, /max-width: 480px/);
assert.match(loginStyles, /\.login-signup-fields/);

console.log('Build 612 FAQ artwork and responsive login presentation contracts PASS');
