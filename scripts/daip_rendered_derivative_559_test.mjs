import assert from 'node:assert/strict';
import {privateDerivativeKey,verifyPrivateDerivative} from '../assets/daip-rendered-derivative-559.js';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',d='33333333-3333-4333-8333-333333333333';
assert.equal(privateDerivativeKey(a,b,d,'mp4'),`projects/${a}/derivatives/${b}/${d}.mp4`);
for(const bad of ['../../public','MP4','exe',''])assert.equal(privateDerivativeKey(a,b,d,bad),null);
assert.equal(privateDerivativeKey(a,'../public',d,'mp4'),null);
const good=verifyPrivateDerivative({projectId:a,assetId:b,derivativeId:d,format:'mp4',rawVerified:true,head:{size:1024,httpMetadata:{contentType:'video/mp4'}}});
assert.equal(good.private_derivative_present,true);assert.equal(good.public_release_allowed,false);assert.equal(good.rendered_media_independently_verified,false);
assert.equal(good.status,'private_derivative_present_release_hold');
for(const head of [null,{size:0,httpMetadata:{contentType:'video/mp4'}},{size:4,httpMetadata:{contentType:'text/html'}}]){
 const x=verifyPrivateDerivative({projectId:a,assetId:b,derivativeId:d,format:'mp4',rawVerified:true,head});
 assert.equal(x.private_derivative_present,false);assert.equal(x.canonical_hold_closed,false);
}
const missing=verifyPrivateDerivative({projectId:a,assetId:b,derivativeId:d,format:'mp4',rawVerified:false,head:{size:4,httpMetadata:{contentType:'video/mp4'}}});
assert.equal(missing.verified_presence_only,false);
console.log('BUILD 559 PRIVATE DERIVATIVE CHECK PASS');
