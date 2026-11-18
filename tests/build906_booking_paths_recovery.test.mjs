import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recommendSmart906,smartHandoff906} from '../assets/book-smart-v906.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog={packages:[
 {code:'premium_wash',name:'Premium Wash',prices_cad:{small:85,mid:105,oversize:125},deposit_cad:50},
 {code:'basic_detail',name:'Basic Detail',prices_cad:{small:229,mid:269,oversize:309},deposit_cad:50},
 {code:'interior_detail',name:'Interior Detail',prices_cad:{small:195,mid:220,oversize:245},deposit_cad:100},
 {code:'exterior_detail',name:'Exterior Detail',prices_cad:{small:180,mid:225,oversize:265},deposit_cad:100},
 {code:'complete_detail',name:'Complete Detail',prices_cad:{small:319,mid:369,oversize:419},deposit_cad:100}],
 addons:[{code:'pet_removal',name:'Pet Hair Removal',category:'interior',prices_cad:{small:45,mid:55,oversize:65}},
 {code:'salt_clean',name:'Winter Salt Stain Cleaning',quote_required:true,prices_cad:{small:50,mid:70,oversize:90}},
 {code:'coating',name:'Ceramic Coating',quote_required:true,prices_cad:{small:499,mid:599,oversize:699}},
 {code:'engine',name:'Engine Wash',requires_package_codes_any:['premium_wash']}]};
test('smart wizard recommends a real catalogue item, with no unrequested extras',()=>{
 const x=recommendSmart906({goal:'interior',condition:'heavy',size:'mid',concerns:['pets','salt'],catalog});
 assert.equal(x.ok,true);assert.equal(x.package_code,'interior_detail');assert.equal(x.price_cad,220);
 assert.equal(x.extra_auto_selected,false);assert.equal(x.photo_review_recommended,true);
 assert.ok(x.suggested_extras.some(a=>a.code==='pet_removal'));
 assert.ok(x.suggested_extras.some(a=>a.code==='salt_clean'&&a.quote_required));
 const link=smartHandoff906(x,[]);
 assert.match(link,/^\/booking-planner\?/);assert.doesNotMatch(link,/addons=/);
 const selected=smartHandoff906(x,['pet_removal','invalid','pet_removal']);
 assert.match(selected,/addons=pet_removal/);assert.doesNotMatch(selected,/invalid/);
});
test('invalid or missing live catalogue, goal and vehicle fail closed without proposed checkout',()=>{
 assert.equal(recommendSmart906({goal:'interior',condition:'light',size:'small',catalog:null}).ok,false);
 assert.equal(recommendSmart906({goal:'invalid',condition:'light',size:'small',catalog}).ok,false);
 assert.equal(recommendSmart906({goal:'complete',condition:'moderate',size:'tiny',catalog}).ok,false);
 assert.equal(smartHandoff906({ok:false}),null);
});
test('front-door booking has two distinct functional links and matches route copy',()=>{
 const a=read('book/index.html'),b=read('book.html');
 assert.equal(a,b);
 for(const marker of ['id="guidedPath888" href="/book-smart"','id="manualPath888" href="/book-custom"',
  'Smart Wizard — help me choose','Manual / Custom — choose every service'])assert.ok(a.includes(marker));
 const smart=read('book-smart/index.html');
 for(const marker of ['id="smartForm906"','id="suggestedExtras"','id="continue"','/api/pricing_catalog_public',
  'book-smart-v906.mjs','nothing is added'])assert.ok(smart.toLowerCase().includes(marker.toLowerCase()));
 assert.doesNotMatch(smart,/\/api\/checkout|checkout\.stripe\.com|paypal\.com/);
});
test('manual cards display all extras, but only approved standalone items can enter checkout',()=>{
 const manual=read('book-custom/index.html'),js=read('assets/ala-carte-booking-v889.js');
 assert.match(manual,/Manual \/ Custom Detailing Booking/);
 assert.match(manual,/standaloneServices889/);assert.match(manual,/special_notes/);
 assert.match(js,/const all=Array\.isArray\(catalog\?\.addons\)/);
 assert.match(js,/const selectable=approved&&permitted\.has\(item\.code\)/);
 assert.match(js,/item\.quote_required===true/);
 assert.match(js,/\/contact\?source=manual_custom/);
 assert.match(js,/booking_mode:'ala_carte'/);
 assert.match(js,/if\(dateIsCold\(date\)/);
 assert.match(js,/\/api\/checkout/);
});
test('optional account creation is explicit and never starts payment or changes booking',()=>{
 const planner=read('booking-planner.html'),js=read('assets/booking-account-v906.mjs');
 assert.match(planner,/id="bookingAccountForm906"/);
 assert.match(planner,/photo_estimate_files/);
 assert.match(planner,/booking-account-v906.mjs/);
 assert.match(js,/auth_signup/);assert.match(js,/auth_me/);
 assert.match(js,/notification_opt_in:false/);assert.match(js,/Account created and signed in/);
 assert.doesNotMatch(js,/\/api\/checkout|\/api\/bookings|localStorage|sessionStorage/);
});
test('forgot-password and forgotten-account endpoints are wired and no accounts exposed',()=>{
 const login=read('login.html'),route=read('login/index.html');
 assert.equal(login,route);
 for(const marker of ['id="forgotForm"','id="accountHelpForm"','id="resetForm"',
 'href="#password-help"','href="#account-help"','/api/client/auth_forgot_password','/api/client/auth_account_help',
 '/api/client/auth_reset_password'])assert.ok(login.includes(marker),marker);
 const reset=read('functions/api/client/auth_forgot_password.js');
 assert.match(reset,/sendCustomerAuthEmail/);
 assert.match(reset,/markCustomerAuthTokenUsed/);
 assert.match(reset,/CUSTOMER_PASSWORD_RESET_PROVIDER_UNAVAILABLE/);
 assert.match(reset,/If that email exists/);
 assert.doesNotMatch(reset,/rawToken.*console\./);
 const help=read('functions/api/client/auth_account_help.js');
 assert.match(help,/customer_account_recovery_requests/);
 const queue=read('admin-customers.html');
 assert.match(queue,/Forgot sign-in email requests/);
 assert.match(read('functions/api/admin/customer_account_help_action.js'),/reviewed/);
});
