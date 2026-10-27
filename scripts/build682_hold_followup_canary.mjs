// Build 682 extends the already-proven B681 synthetic full-chain fixture.
// Prints a self-contained SQL DO block; execute using the Supabase SQL tool.
// All synthetic changes are rolled back by the base fixture's deliberate exception.
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/migrations/20261027150001_build681_hold_continuity_rollback_canary.sql',import.meta.url),'utf8');
const insertion=`    -- Build 682: current owner follow-up, separate auditor, and no-dispatch closure.
    select public.record_gift_hold_followup_event(
      '68200000-0000-4000-8000-000000000054'::uuid,v_case,v_closeout,v_continuity,
      v_owner,v_auditor,'exception_followup_opened','owner_requested_followup',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      then raise exception 'Build 682 owner follow-up did not retain HOLD'; end if;
    select public.record_gift_hold_followup_event(
      '68200000-0000-4000-8000-000000000054'::uuid,v_case,v_closeout,v_continuity,
      v_owner,v_auditor,'exception_followup_opened','owner_requested_followup',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 682 replay failed'; end if;
    begin
      perform public.record_gift_hold_followup_event(
        '68200000-0000-4000-8000-000000000060'::uuid,v_case,v_closeout,v_continuity,
        v_owner,v_auditor,'independent_outcome_rechecked','owner_requested_followup',
        '68200000-0000-4000-8000-000000000054'::uuid,
        'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 682 owner self-review was accepted';
    exception when others then
      if sqlerrm not like 'A distinct independent auditor must%' then raise; end if;
    end;
    begin
      perform public.record_gift_hold_followup_event(
        '68200000-0000-4000-8000-000000000061'::uuid,v_case,v_closeout,v_continuity,
        v_auditor,v_auditor,'independent_outcome_rechecked','owner_requested_followup',
        '68200000-0000-4000-8000-000000000054'::uuid,
        'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),
        clock_timestamp()-interval '8 minutes');
      raise exception 'Build 682 stale payment proof was accepted';
    exception when others then
      if sqlerrm not like 'Source changed, recurrence reopened or paid proof is stale%' then raise; end if;
    end;
    select public.record_gift_hold_followup_event(
      '68200000-0000-4000-8000-000000000055'::uuid,v_case,v_closeout,v_continuity,
      v_auditor,v_auditor,'independent_outcome_rechecked','owner_requested_followup',
      '68200000-0000-4000-8000-000000000054'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'customer_messages_sent'<>'0' then raise exception 'Build 682 recheck sent a message'; end if;
    select public.record_gift_hold_followup_event(
      '68200000-0000-4000-8000-000000000056'::uuid,v_case,v_closeout,v_continuity,
      v_owner,v_auditor,'owner_followup_closed','owner_requested_followup',
      '68200000-0000-4000-8000-000000000055'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      or v_result->>'payment_mutations'<>'0' or v_result->>'gift_balance_mutations'<>'0'
      or v_result->>'customer_messages_sent'<>'0' then
      raise exception 'Build 682 unsafe follow-up closure'; end if;
    begin
      update public.gift_issuance_hold_followup_events
        set reason='recurrence_reopened' where id='68200000-0000-4000-8000-000000000056'::uuid;
      raise exception 'Build 682 immutable audit was mutated';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
const rollbackMarker="    raise exception 'BUILD681_EXPECTED_ROLLBACK';";
const zeroMarker='     or exists(select 1 from public.gift_issuance_hold_continuity_events where case_id=v_case)';
if(source.split(rollbackMarker).length!==2||source.split(zeroMarker).length!==2)
  throw Error('Build 681 rollback fixture changed: do not execute an unverified canary.');
const composed=source.replace(rollbackMarker,insertion+rollbackMarker)
  .replace(zeroMarker,zeroMarker+'\n     or exists(select 1 from public.gift_issuance_hold_followup_events where case_id=v_case)');
if(!composed.includes('owner_followup_closed')||!composed.includes('BUILD681_EXPECTED_ROLLBACK'))
  throw Error('Build 682 rollback fixture composition failed.');
process.stdout.write(composed);
