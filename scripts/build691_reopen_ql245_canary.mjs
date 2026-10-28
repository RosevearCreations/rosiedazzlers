// B681→B691 complete synthetic acceptance. Must run in ONE BEGIN/ROLLBACK only.
import {build690RollbackCanary} from './build690_recurrence_readiness_canary.mjs';
const source=build690RollbackCanary();
const marker='    -- QL-243: atomically persisted nonce + replay denial and append-only source audit.';
const zero='     or exists(select 1 from public.gift_issuance_delivery_closure_recurrence where case_id=v_case)';
const declaration="  v_auditor uuid:='68100000-0000-4000-8000-000000000031';";
if(source.split(marker).length!==2||source.split(zero).length!==2||source.split(declaration).length!==2)
  throw Error('Build 690 rollback fixture changed; stop instead of silently skipping evidence.');
const insert=`    -- Build 691: fourth independent reviewer exists only in this rolled-back fixture.
    if exists(select 1 from public.staff_users where id=v_fourth) then
      raise exception 'Build 691 synthetic independent reviewer is already occupied';end if;
    insert into public.staff_users(id,full_name,email,role_code,is_active)
      values(v_fourth,'Rollback Fourth Reviewer','build691-fourth@example.invalid','detailer',true);
    begin
      perform public.record_gift_delivery_reopened_exception_review(
        '69100000-0000-4000-8000-000000000001'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69000000-0000-4000-8000-000000000004'::uuid,
        v_owner,v_old_reviewer,'owner_exception_reopened','reopen_recurrence_detected',
        'internal_exception_note','REOPEN-691-WRONG',repeat('a',64),clock_timestamp());
      raise exception 'Build 691 allowed prior third reviewer to reassess again';
    exception when others then
      if sqlerrm not like 'Owner must reopen the detected exception for a distinct fourth reviewer%' then raise;end if;
    end;
    select public.record_gift_delivery_reopened_exception_review(
      '69100000-0000-4000-8000-000000000002'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69000000-0000-4000-8000-000000000004'::uuid,
      v_owner,v_fourth,'owner_exception_reopened','reopen_recurrence_detected',
      'internal_exception_note','REOPEN-691-OWNER',repeat('b',64),clock_timestamp()) into v_result;
    if v_result->>'provider_dispatches'<>'0' or
       v_result->>'automatic_resend_permitted'<>'false' then
       raise exception 'Build 691 reopening allowed customer delivery';end if;
    begin
      perform public.record_gift_delivery_reopened_exception_review(
        '69100000-0000-4000-8000-000000000003'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69000000-0000-4000-8000-000000000004'::uuid,
        v_auditor,v_auditor,'independent_aging_reassessed','still_unresolved',
        'recipient_reported_missing','REASSESS-691-WRONG',repeat('c',64),clock_timestamp());
      raise exception 'Build 691 original delivery operator reassessed';
    exception when others then
      if sqlerrm not like 'Only fourth independent reviewer may reassess current aging evidence%' then raise;end if;
    end;
    select public.record_gift_delivery_reopened_exception_review(
      '69100000-0000-4000-8000-000000000004'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69000000-0000-4000-8000-000000000004'::uuid,
      v_fourth,v_fourth,'independent_aging_reassessed','still_unresolved',
      'recipient_reported_missing','REASSESS-691-FOUND',repeat('c',64),
      clock_timestamp()+interval '1 millisecond') into v_result;
    if v_result->>'reopened_exception_still_held'<>'true' or
       v_result->>'customer_messages_sent'<>'0' then
       raise exception 'Build 691 fourth review resolved or dispatched a gift';end if;
    select public.record_gift_delivery_reopened_exception_review(
      '69100000-0000-4000-8000-000000000005'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69000000-0000-4000-8000-000000000004'::uuid,
      v_owner,v_fourth,'owner_hold_continuity_ack','manual_hold_acknowledged',
      'internal_exception_note','HOLD-691-OWNER',repeat('d',64),
      clock_timestamp()+interval '2 milliseconds') into v_result;
    if v_result->>'reopened_exception_still_held'<>'true' then
      raise exception 'Build 691 owner HOLD ack released gift';end if;
    begin
      perform public.record_gift_delivery_reopened_exception_review(
        '69100000-0000-4000-8000-000000000006'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69000000-0000-4000-8000-000000000004'::uuid,
        v_owner,v_fourth,'owner_hold_continuity_ack','manual_hold_acknowledged',
        'internal_exception_note','HOLD-691-AGAIN',repeat('d',64),clock_timestamp());
      raise exception 'Build 691 duplicated reopened hold acknowledgment';
    exception when others then
      if sqlerrm not like 'Reopened exception action already recorded%' then raise;end if;
    end;
    begin
      update public.gift_issuance_delivery_reopened_exception_reviews
        set decision_code='new_evidence_not_confirmed'
        where id='69100000-0000-4000-8000-000000000004'::uuid;
      raise exception 'Build 691 mutable reopened exception ledger';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise;end if;
    end;
    select public.record_rosevear_integration_v1_ql245_owner_handoff(
      '69100000-0000-4000-8000-000000000007'::uuid,v_owner,null,
      'QL245-691-HOLD',repeat('e',64),clock_timestamp(),
      '{"nonce_replay":false,"stale_request":false,"wrong_business":false,
        "wrong_tenant":false,"revoked_key":false,"prohibited_write":false,
        "prohibited_dispatch":false}'::jsonb) into v_result;
    if v_result->>'connection_state'<>'DISCONNECTED' or
       v_result->>'gateway_requests_sent'<>'0' or
       v_result->>'owner_authorization'<>'NOT_GIVEN' then
      raise exception 'Build 691 QL245 unsigned handoff falsely connected';end if;
    begin
      perform public.record_rosevear_integration_v1_ql245_owner_handoff(
        '69100000-0000-4000-8000-000000000008'::uuid,v_owner,null,
        'QL245-691-FAKE',repeat('f',64),clock_timestamp(),
        '{"nonce_replay":true,"stale_request":false,"wrong_business":false,
          "wrong_tenant":false,"revoked_key":false,"prohibited_write":false,
          "prohibited_dispatch":false}'::jsonb);
      raise exception 'Build 691 permitted unverified denial as true';
    exception when others then
      if sqlerrm not like 'Only a real owner may record all-seven-unverified QL-245 HOLD intake%' then raise;end if;
    end;
    if (select count(*) from public.gift_issuance_delivery_reopened_exception_reviews
         where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 or
       (select count(*) from public.rosevear_integration_v1_ql245_owner_handoffs
         where evidence_reference='QL245-691-HOLD')<>1 then
      raise exception 'Build 691 immutable reopening or unsigned HOLD receipt count drift';end if;
`;
const sql=source.replace(declaration,declaration+
  "\n  v_fourth uuid:='69100000-0000-4000-8000-000000000030';")
  .replace(marker,insert+marker)
  .replace(zero,zero+
    '\n     or exists(select 1 from public.gift_issuance_delivery_reopened_exception_reviews where case_id=v_case)'+
    "\n     or exists(select 1 from public.rosevear_integration_v1_ql245_owner_handoffs where evidence_reference='QL245-691-HOLD')"+
    '\n     or exists(select 1 from public.staff_users where id=v_fourth)');
if(!sql.includes('BUILD681_EXPECTED_ROLLBACK')||!sql.includes('Build 691 permitted unverified denial as true'))
  throw Error('Build 691 synthetic fixture is missing rollback safety checks');
export function build691RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
