// Composes the verified Build 682 synthetic fixture with Build 683.
// Every inserted synthetic gift, staff and audit row rolls back before return.
import {readFileSync} from 'node:fs';

// Recompose the existing B682 fixture from its literal insertion. The managed
// environment forbids child-process execution, and no production writes occur.
const source681=readFileSync(new URL('../supabase/migrations/20261027150001_build681_hold_continuity_rollback_canary.sql',import.meta.url),'utf8');
const builder682=readFileSync(new URL('./build682_hold_followup_canary.mjs',import.meta.url),'utf8');
const prior=builder682.match(/const insertion=`([\s\S]*?)`;\nconst rollbackMarker=/);
const rollbackMarker="    raise exception 'BUILD681_EXPECTED_ROLLBACK';";
const baseZeroMarker='     or exists(select 1 from public.gift_issuance_hold_continuity_events where case_id=v_case)';
if(!prior||source681.split(rollbackMarker).length!==2||
   source681.split(baseZeroMarker).length!==2||!prior[1].includes('owner_followup_closed'))
  throw Error('Verified Build 682 full-chain rollback source changed: no canary may run.');
const source682=source681.replace(rollbackMarker,prior[1]+rollbackMarker)
  .replace(baseZeroMarker,baseZeroMarker+
    '\n     or exists(select 1 from public.gift_issuance_hold_followup_events where case_id=v_case)');
const insertion=`    -- Build 683: fresh HOLD renewal, separate paid evidence reassessment and owner acknowledgment.
    -- Synthesize a newly aged B682 closure from the already-verified source.
    -- The new row is entirely transaction-local and reuses the same paid receipt.
    insert into public.gift_issuance_hold_followup_events
      (id,case_id,closeout_event_id,continuity_event_id,event_kind,reason,
       actor_staff_user_id,auditor_staff_user_id,reference_event_id,evidence_age_minutes,
       provider_checked_at,provider_evidence_sha256,certificate_count,receipt_last_seen_at)
    select '68300000-0000-4000-8000-000000000080'::uuid,case_id,closeout_event_id,
      continuity_event_id,event_kind,reason,actor_staff_user_id,auditor_staff_user_id,
      reference_event_id,180,clock_timestamp()-interval '3 hours',
      provider_evidence_sha256,certificate_count,receipt_last_seen_at
      from public.gift_issuance_hold_followup_events
      where id='68200000-0000-4000-8000-000000000056'::uuid;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000054'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
      'owner_renewal_requested','followup_proof_aged',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      then raise exception 'Build 683 owner renewal did not retain HOLD'; end if;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000054'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
      'owner_renewal_requested','followup_proof_aged',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 683 replay failed'; end if;
    begin
      perform public.record_gift_hold_renewal_event(
        '68300000-0000-4000-8000-000000000060'::uuid,v_case,
        '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
        'independent_recurrence_reassessed','followup_proof_aged',
        '68300000-0000-4000-8000-000000000054'::uuid,
        'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 683 owner self-review was accepted';
    exception when others then
      if sqlerrm not like 'Separate assigned auditor must reassess%' then raise; end if;
    end;
    begin
      perform public.record_gift_hold_renewal_event(
        '68300000-0000-4000-8000-000000000061'::uuid,v_case,
        '68300000-0000-4000-8000-000000000080'::uuid,v_auditor,v_auditor,
        'independent_recurrence_reassessed','followup_proof_aged',
        '68300000-0000-4000-8000-000000000054'::uuid,
        'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),
        clock_timestamp()-interval '8 minutes');
      raise exception 'Build 683 stale proof was accepted';
    exception when others then
      if sqlerrm not like 'Gift recurrence, source or paid evidence changed%' then raise; end if;
    end;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000055'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_auditor,v_auditor,
      'independent_recurrence_reassessed','followup_proof_aged',
      '68300000-0000-4000-8000-000000000054'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'integration_events_dispatched'<>'0' or v_result->>'customer_messages_sent'<>'0'
      then raise exception 'Build 683 reassessment mutated external systems'; end if;
    -- A recurrence arriving between audit and owner acknowledgment invalidates
    -- the prior handoff; the nested subtransaction rolls the probe back.
    begin
      insert into public.gift_issuance_review_followup_events
        (id,case_id,event_kind,actor_staff_user_id,case_version,reference_event_id,
         reason_code,due_at_snapshot)
      values('68300000-0000-4000-8000-000000000069'::uuid,v_case,
        'recurrence_opened',v_owner,4,v_followup,'evidence_changed',
        clock_timestamp()+interval '12 hours');
      perform public.record_gift_hold_renewal_event(
        '68300000-0000-4000-8000-000000000068'::uuid,v_case,
        '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
        'owner_hold_continuity_acknowledged','followup_proof_aged',
        '68300000-0000-4000-8000-000000000055'::uuid,
        'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 683 newly reopened recurrence was improperly acknowledged';
    exception when others then
      if sqlerrm not like 'Gift recurrence, source or paid evidence changed%' then raise; end if;
    end;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000056'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
      'owner_hold_continuity_acknowledged','followup_proof_aged',
      '68300000-0000-4000-8000-000000000055'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      or v_result->>'payment_mutations'<>'0' or v_result->>'gift_balance_mutations'<>'0'
      or v_result->>'customer_messages_sent'<>'0'
      then raise exception 'Build 683 unsafe owner continuity'; end if;
    -- New recurrence after the Build 682 owner closure: reassess HOLD, never release.
    insert into public.gift_issuance_review_followup_events
      (id,case_id,event_kind,actor_staff_user_id,case_version,reference_event_id,
       reason_code,due_at_snapshot)
    values('68300000-0000-4000-8000-000000000070'::uuid,v_case,
      'recurrence_opened',v_owner,4,v_followup,'evidence_changed',
      clock_timestamp()+interval '12 hours');
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000071'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
      'owner_renewal_requested','recurrence_reopened',null,
      null,null,null,null,null,null,null) into v_result;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000072'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_auditor,v_auditor,
      'independent_recurrence_reassessed','recurrence_reopened',
      '68300000-0000-4000-8000-000000000071'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'recurrence_hold'<>'true' then
      raise exception 'Build 683 recurrence was not retained on HOLD'; end if;
    select public.record_gift_hold_renewal_event(
      '68300000-0000-4000-8000-000000000073'::uuid,v_case,
      '68300000-0000-4000-8000-000000000080'::uuid,v_owner,v_auditor,
      'owner_hold_continuity_acknowledged','recurrence_reopened',
      '68300000-0000-4000-8000-000000000072'::uuid,
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'recurrence_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      then raise exception 'Build 683 recurrence acknowledgement released a gift'; end if;
    begin
      update public.gift_issuance_hold_renewal_events
        set reason='source_superseded' where id='68300000-0000-4000-8000-000000000073'::uuid;
      raise exception 'Build 683 immutable evidence was changed';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
const zeroMarker='     or exists(select 1 from public.gift_issuance_hold_followup_events where case_id=v_case)';
if(source682.split(rollbackMarker).length!==2||source682.split(zeroMarker).length!==2)
  throw Error('Build 682 fixture changed: reject unverified rollback composition.');
const composed=source682.replace(rollbackMarker,insertion+rollbackMarker)
  .replace(zeroMarker,zeroMarker+
    '\n     or exists(select 1 from public.gift_issuance_hold_renewal_events where case_id=v_case)');
if(!composed.includes('recurrence_reopened')||!composed.includes('BUILD681_EXPECTED_ROLLBACK'))
  throw Error('Build 683 full-chain fixture incomplete.');
process.stdout.write(composed);
