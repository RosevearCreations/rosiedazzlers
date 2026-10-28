// Build 681→693 synthetic SQL acceptance. Execute inside a single BEGIN/ROLLBACK only.
import {build692RollbackCanary} from './build692_discrepancy_ql246_canary.mjs';
let sql=build692RollbackCanary();
const marker='    -- QL-243: atomically persisted nonce + replay denial and append-only source audit.';
const declaration="  v_fifth uuid:='69200000-0000-4000-8000-000000000030';";
const zero='     or exists(select 1 from public.staff_users where id=v_fifth)';
for(const exact of [marker,declaration,zero])if(sql.split(exact).length!==2)
  throw Error('Build 692 source chain changed; cannot extend sixth-witness rollback test.');
const extra=`    -- Sixth reviewer is distinct from the owner, original operator and reviewers 1-5.
    if exists(select 1 from public.staff_users where id=v_sixth) then
      raise exception 'Build 693 synthetic sixth witness occupied';end if;
    insert into public.staff_users(id,full_name,email,role_code,is_active)
      values(v_sixth,'Rollback Sixth Witness','build693-sixth@example.invalid','detailer',true);
    begin
      perform public.record_gift_delivery_fifth_recurrence_closure_watch(
        '69300000-0000-4000-8000-000000000101'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69200000-0000-4000-8000-000000000104'::uuid,
        v_owner,v_fifth,'owner_fifth_recurrence_watch_opened','recurrence_watch_requested',
        'internal_exception_note','FIFTH-693-WRONG',repeat('a',64),clock_timestamp());
      raise exception 'Build 693 reused fifth reviewer as sixth';
    exception when others then
      if sqlerrm not like 'Owner must assign distinct sixth witness after fifth HOLD%' then raise;end if;
    end;
    select public.record_gift_delivery_fifth_recurrence_closure_watch(
      '69300000-0000-4000-8000-000000000102'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69200000-0000-4000-8000-000000000104'::uuid,
      v_owner,v_sixth,'owner_fifth_recurrence_watch_opened','recurrence_watch_requested',
      'internal_exception_note','FIFTH-693-OWNER',repeat('b',64),
      clock_timestamp()+interval '1 millisecond') into v_result;
    if v_result->>'manual_hold'<>'true' or v_result->>'gift_resends'<>'0' then
      raise exception 'Build 693 falsely reopened delivery';end if;
    begin
      perform public.record_gift_delivery_fifth_recurrence_closure_watch(
        '69300000-0000-4000-8000-000000000103'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69200000-0000-4000-8000-000000000104'::uuid,
        v_fifth,v_fifth,'independent_closure_risk_checked','original_evidence_missing',
        'recipient_reported_missing','FIFTH-693-FIFTH',repeat('c',64),clock_timestamp());
      raise exception 'Build 693 fifth reviewer bypassed sixth independent witness';
    exception when others then
      if sqlerrm not like 'Only assigned sixth witness may record unresolved closure risk%' then raise;end if;
    end;
    select public.record_gift_delivery_fifth_recurrence_closure_watch(
      '69300000-0000-4000-8000-000000000104'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69200000-0000-4000-8000-000000000104'::uuid,
      v_sixth,v_sixth,'independent_closure_risk_checked','new_discrepancy_detected',
      'recipient_reported_missing','FIFTH-693-SIXTH',repeat('c',64),
      clock_timestamp()+interval '2 milliseconds') into v_result;
    select public.record_gift_delivery_fifth_recurrence_closure_watch(
      '69300000-0000-4000-8000-000000000105'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69200000-0000-4000-8000-000000000104'::uuid,
      v_owner,v_sixth,'owner_continued_hold_ack','continued_manual_hold',
      'internal_exception_note','FIFTH-693-HOLD',repeat('d',64),
      clock_timestamp()+interval '3 milliseconds') into v_result;
    if v_result->>'gift_resends'<>'0' or v_result->>'provider_requests'<>'0' or
       v_result->>'connection_state'<>'DISCONNECTED' then
      raise exception 'Build 693 altered original no-resend or gateway state';end if;
    begin
      update public.gift_issuance_delivery_fifth_recurrence_closure_watch
        set decision_code='original_evidence_missing'
        where id='69300000-0000-4000-8000-000000000104'::uuid;
      raise exception 'Build 693 recurrence ledger is mutable';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise;end if;
    end;
    if (select count(*) from public.gift_issuance_delivery_fifth_recurrence_closure_watch
          where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 then
      raise exception 'Build 693 fifth recurrence ledger count drift';end if;
`;
sql=sql.replace(declaration,declaration+"\n  v_sixth uuid:='69300000-0000-4000-8000-000000000030';")
  .replace(marker,extra+marker)
  .replace(zero,zero+
    '\n     or exists(select 1 from public.gift_issuance_delivery_fifth_recurrence_closure_watch where case_id=v_case)'+
    '\n     or exists(select 1 from public.staff_users where id=v_sixth)');
if(!sql.includes('BUILD681_EXPECTED_ROLLBACK')||!sql.includes('Build 693 fifth recurrence ledger count drift'))
  throw Error('Build 693 rollback progression incomplete');
export function build693RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
