import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  quoteAttention704, summarizeQuoteInbox704, filterQuoteInbox704,
  bookingReview704, localFollowUp704, isUuid704
} from '../assets/quote-followup-v704.mjs';

const now = new Date('2026-10-29T16:00:00-04:00');
const rows = [
  {id:'review',customer_name:'New inquiry',status:'requested',service_label:'Detail'},
  {id:'future',status:'sent',next_follow_up_at:'2026-11-01T14:00:00Z'},
  {id:'overdue',status:'follow_up',next_follow_up_at:'2026-10-27T14:00:00Z',town:'Tillsonburg'},
  {id:'accepted',status:'accepted',accepted_amount_cents:20000},
  {id:'booked',status:'accepted',booking_id:'some-linked-id'},
  {id:'closed',status:'declined'},
  {id:'missing',status:'sent'}
];
assert.deepEqual(rows.map(row => quoteAttention704(row,now)), [
  'review','scheduled','due','ready_to_book','linked','closed','unscheduled'
]);
assert.deepEqual(summarizeQuoteInbox704(rows,now), {
  all:7,due:1,review:1,ready_to_book:1,linked:1,closed:1,scheduled:1,unscheduled:1,completed:0
});
assert.deepEqual(filterQuoteInbox704(rows,{now}).map(row=>row.id), [
  'overdue','accepted','review','missing','future','booked','closed'
]);
assert.deepEqual(filterQuoteInbox704(rows,{filter:'due',search:'till',now}).map(row=>row.id),['overdue']);
assert.equal(filterQuoteInbox704(rows,{filter:'ready_to_book',search:'new',now}).length,0);
assert.equal(bookingReview704({}).ready,false);
assert.match(bookingReview704({id:'x',status:'requested'}).message,/accepted/);
assert.match(bookingReview704({id:'x',status:'accepted',accepted_amount_cents:0}).message,/positive/);
assert.equal(bookingReview704({id:'x',status:'accepted',accepted_amount_cents:20000}).ready,true);
assert.equal(bookingReview704({id:'x',status:'accepted',accepted_amount_cents:20000,booking_id:'existing'}).ready,false);
assert.equal(localFollowUp704(new Date('2026-10-29T12:00:00'),1),'2026-10-30T09:00');
assert.equal(isUuid704('a5d187f2-4dd3-41ca-8dc4-c954ab9b053f'),true);
assert.equal(isUuid704('wrong-uuid'),false);

const root = resolve(import.meta.dirname,'..');
const read = path => readFileSync(resolve(root,path),'utf8');
const html = read('admin-quotes.html');
const script = read('assets/admin-quotes-v298.js');
assert.equal(html,read('admin-quotes/index.html'));
for(const element of ['quoteSearch704','quoteFilter704','quoteSummary704','bookingReview704','followUpTomorrow704'])
  assert.match(html,new RegExp('id="' + element + '"'));
assert.match(html,/type="module" src="\/assets\/admin-quotes-v298\.js/);
assert.match(script,/quote-followup-v704\.mjs/);
assert.match(script,/beforeDiscard\(\)/);
assert.match(script,/credentials:'include'/);
assert.match(script,/if \(rawBookingId && !isUuid704\(rawBookingId\)\)/);
assert.doesNotMatch(script,/localStorage|sessionStorage/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build704_quote_followup_test\.mjs/);
assert.match(read('admin-gift-recovery-review.html'),/Gift testing paused/);
console.log('Build 704 quote inbox PASS: priority, overdue, review, accepted/unlinked, search, save guards, Gift pause');
