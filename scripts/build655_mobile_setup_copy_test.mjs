import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const contact = read('contact/index.html');
const faq = read('faq/index.html');
const api = read('functions/api/public_faqs.js');
const seed = JSON.parse(read('data/site_faqs.json'));
const policies = JSON.parse(read('data/site_policies.json'));

const question = 'Do we need a driveway or to supply water and power?';
const answer = 'Please provide a safe, private or otherwise permitted work area. Rosie brings standard detailing water and power. Tell us about unusual building access, parking, runoff or local water-use restrictions before the appointment so we can review the setup.';

assert.equal(contact, read('contact.html'), 'Contact page copies must match');
assert.equal(faq, read('faq.html'), 'FAQ page copies must match');
assert.match(contact, /Rosie brings standard detailing water and power; please tell us/);
assert.doesNotMatch(contact, /Customer provides power \+ water/);

const structuredFaq = JSON.parse(faq.match(/<script type="application\/ld\+json"[^>]*="faqpage">([^<]+)<\/script>/)?.[1] || '{}');
const structuredItem = structuredFaq.mainEntity?.find((item) => item.name === question);
assert.equal(structuredItem?.acceptedAnswer?.text, answer, 'FAQ JSON-LD must match visible answer');
assert.ok(faq.includes(`<span>${question}</span>`));
assert.ok(faq.includes(`<p>${answer}</p>`));
const inlineSeed = JSON.parse(faq.match(/window\.ROSIE_STATIC_FAQS\s*=\s*(\[[^;]+\]);/)?.[1] || '[]');
assert.equal(inlineSeed.find((item) => item.question === question)?.answer, answer, 'Inline fallback must match visible FAQ');
assert.equal(seed.items.find((item) => item.question === question)?.answer, answer, 'Static seed must match FAQ');
assert.match(api, new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.equal(seed.items.find((item) => item.question === 'How far ahead can customers book?')?.cta_href, '/book#booking');
assert.ok(inlineSeed.every((item) => item.cta_href !== '/pricing#booking-planner'));
assert.doesNotMatch(faq, /customer-provided water|customer-provided power/);

assert.match(read('assets/site.js'), /Safe work area required · Rosie brings standard detailing water and power/);
assert.match(read('assets/chrome.js'), /Safe work area required · Rosie brings standard detailing water and power/);
assert.match(read('assets/site-policies.js'), /Rosie brings standard detailing water and power/);
assert.match(policies.policies.water_power, /Rosie brings standard detailing water and power/);
assert.match(read('functions/api/admin/_lib/pricing-catalog.js'), /Rosie supplies standard detailing water and power/);
assert.equal(JSON.parse(read('data/rosie_services_pricing_and_packages.json')).booking_rules.public_requirements.join('|'),
  JSON.parse(read('functions/api/data/rosie_services_pricing_and_packages.json')).booking_rules.public_requirements.join('|'),
  'Bundled pricing rules copies must match');

// Contractual text and production owner-managed policies are deliberately NOT
// rewritten without owner approval.
assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
assert.match(read('functions/api/public_faqs.js'), /public_faq_entries/);
console.log('Build 655 mobile setup truth, fallback parity, and owner policy hold: PASS');
