import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const contact = read('contact/index.html');
const faq = read('faq/index.html');
const js = read('assets/build654-contact-faq.js');
const css = read('assets/build654-contact-faq.css');

assert.equal(contact, read('contact.html'), 'Both contact paths must render identical content');
assert.equal(faq, read('faq.html'), 'Both FAQ paths must render identical content');
for (const page of [contact, faq]) {
  assert.match(page, /\/assets\/build654-contact-faq\.css/);
  assert.match(page, /\/assets\/build654-contact-faq\.js/);
}

assert.match(contact, /<form id="contactPrepForm" class="contact-prep-form">/);
assert.match(contact, /id="contactPrepDraft"[^>]*href="mailto:info@rosiedazzlers\.ca/);
assert.match(contact, /id="contactPrepTown"[^>]*maxlength="70"/);
assert.match(contact, /id="contactPrepMessage"[^>]*maxlength="800"/);
assert.match(contact, /id="contactPrepSummary"[^>]*aria-live="polite"/);
assert.match(contact, /type="reset">Clear details/);
assert.match(contact, /nothing is sent or stored on this website/);
assert.match(js, /encodeURIComponent\('Rosie Dazzlers — ' \+ selectedTopic\)/);
assert.match(js, /form\.addEventListener\('reset'/);
assert.match(js, /form\.addEventListener\('submit', function \(event\) \{ event\.preventDefault\(\); \}\)/);
assert.doesNotMatch(contact, /id="contactPrepForm"[^>]*action=/);

assert.match(faq, /id="faqResultsStatus"[^>]*aria-live="polite"/);
assert.match(faq, /id="faqClearSearch"[^>]*type="button" hidden/);
assert.match(faq, /id="faqEmptyState" hidden aria-live="polite"/);
assert.match(faq, /id="faqResetEmpty"[^>]*type="button"/);
assert.match(faq, /href="\/book#booking">See live availability/);
assert.match(js, /status\.textContent = query/);
assert.match(js, /section\.hidden = !Array\.from/);
assert.match(js, /clear\.addEventListener\('click', reset\)/);
assert.match(js, /resetEmpty\.addEventListener\('click', reset\)/);
assert.match(js, /fetch\('\/api\/public_faqs', \{ cache: 'no-store' \}\)/);
assert.doesNotMatch(js, /fetch\(['"]\/api\/(contact|quote|lead|membership)/);
assert.match(css, /@media\(max-width:700px\)/);
assert.match(css, /@media\(max-width:380px\)/);
assert.match(css, /focus-visible/);
console.log('Build 654 contact draft, FAQ filtering, route parity and privacy: PASS');
