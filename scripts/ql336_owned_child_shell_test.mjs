import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequest,SHELL_ID,FIRST_CHILD,PATHS} from '../functions/api/_lib/ql336-owned-shell.mjs';

test('QL-336 Rosie is the first child, never a source-shell grant',async()=>{
  assert.notEqual(SHELL_ID,FIRST_CHILD);
  for(const path of PATHS){
    const result=await onRequest({request:new Request(`https://preview.example/${path.slice(1)}`)});
    assert.equal(result.status,503);
    const body=await result.json();
    assert.equal(body.shell_id,SHELL_ID);
    assert.equal(body.authenticated,false);
    assert.equal(body.child_data_included,false);
    assert.equal(body.provider_operations_enabled,false);
    assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  }
});
test('Child scope, writes and unregistered paths are rejected before credentials or providers',async()=>{
  const url='https://preview.example/api/integration/v1/shell/health';
  const make=async(url,init)=>onRequest({request:new Request(url,init)});
  assert.equal((await make(url,{method:'POST'})).status,405);
  assert.equal((await make(url+'?child=rosie-dazzlers')).status,404);
  assert.equal((await make(url,{headers:{'X-Rosevear-Tenant':'rosie-dazzlers'}})).status,403);
  assert.equal((await make(url,{headers:{'X-Rosevear-Shell-Envelope':'forged'}})).status,503);
  assert.equal((await make('https://preview.example/api/customers')).status,404);
});
test('additive Supabase schema enforces four private FORCE-RLS tables and no legacy mutation',()=>{
  const sql=readFileSync('supabase/migrations/20261105040001_ql336_owned_child_shell_hold.sql','utf8');
  for(const table of ['rosie_shell_children_ql336','rosie_shell_memberships_ql336',
    'rosie_shell_resource_claims_ql336','rosie_shell_provider_handles_ql336']){
    assert.ok(sql.includes(`public.${table}`));
    assert.ok(sql.includes(`'${table}'`));
  }
  assert.match(sql,/FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON TABLE/);
  assert.doesNotMatch(sql,/CREATE POLICY|GRANT SELECT|GRANT INSERT/i);
  assert.doesNotMatch(sql,/ALTER TABLE public\.(bookings|customers|orders|payments)\b/i);
  assert.doesNotMatch(sql,/INSERT INTO public\.rosie_shell_children_ql336/i);
});
