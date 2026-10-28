// Build 681→692 synthetic acceptance only: ONE BEGIN/ROLLBACK around the entire chain.
import {build691RollbackCanary} from './build691_reopen_ql245_canary.mjs';
let sql=build691RollbackCanary();
const marker='    -- QL-243: atomically persisted nonce + replay denial and append-only source audit.';
const zero="     or exists(select 1 from public.staff_users where id=v_fourth)";
const declaration="  v_fourth uuid:='69100000-0000-4000-8000-000000000030';";
const prior="v_fourth,v_fourth,'independent_aging_reassessed','still_unresolved',\n      'recipient_reported_missing','REASSESS-691-FOUND'";
for(const exact of [marker,zero,declaration,prior])if(sql.split(exact).length!==2)
  throw Error('Build 691 canary changed; cannot safely extend synthetic source proof.');
sql=sql.replace(prior,prior.replace('still_unresolved','evidence_conflicting'));
const extra=`    -- Build 692 uses a genuinely fifth distinct reviewer, not the fourth or owner.
    if exists(select 1 from public.staff_users where id=v_fifth) then
      raise exception 'Build 692 synthetic fifth reviewer occupied';end if;
    insert into public.staff_users(id,full_name,email,role_code,is_active)
      values(v_fifth,'Rollback Fifth Reviewer','build692-fifth@example.invalid','detailer',true);
    begin
      perform public.record_gift_delivery_reopened_discrepancy_watch(
        '69200000-0000-4000-8000-000000000101'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69100000-0000-4000-8000-000000000004'::uuid,
        v_owner,v_fourth,'owner_discrepancy_watch_opened','discrepancy_review_requested',
        'internal_exception_note','DISCREP-692-WRONG',repeat('a',64),clock_timestamp());
      raise exception 'Build 692 allowed fourth reviewer to act as fifth';
    exception when others then
      if sqlerrm not like 'Only owner can assign fifth distinct independent discrepancy reviewer%' then raise;end if;
    end;
    select public.record_gift_delivery_reopened_discrepancy_watch(
      '69200000-0000-4000-8000-000000000102'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69100000-0000-4000-8000-000000000004'::uuid,
      v_owner,v_fifth,'owner_discrepancy_watch_opened','discrepancy_review_requested',
      'internal_exception_note','DISCREP-692-OWNER',repeat('b',64),
      clock_timestamp()+interval '1 millisecond') into v_result;
    if v_result->>'manual_hold'<>'true' or v_result->>'gift_resends'<>'0' then
      raise exception 'Build 692 opened a send instead of manual hold';end if;
    begin
      perform public.record_gift_delivery_reopened_discrepancy_watch(
        '69200000-0000-4000-8000-000000000103'::uuid,v_case,v_release_cert,
        '68700000-0000-4000-8000-000000000099'::uuid,
        '69100000-0000-4000-8000-000000000004'::uuid,
        v_fourth,v_fourth,'independent_discrepancy_reassessed','documentary_gap',
        'recipient_reported_missing','DISCREP-692-FOURTH',repeat('c',64),clock_timestamp());
      raise exception 'Build 692 fourth reviewer bypassed fifth review';
    exception when others then
      if sqlerrm not like 'Only assigned fifth reviewer may reassess unresolved discrepancy%' then raise;end if;
    end;
    select public.record_gift_delivery_reopened_discrepancy_watch(
      '69200000-0000-4000-8000-000000000104'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69100000-0000-4000-8000-000000000004'::uuid,
      v_fifth,v_fifth,'independent_discrepancy_reassessed','still_disputed',
      'recipient_reported_missing','DISCREP-692-FIFTH',repeat('c',64),
      clock_timestamp()+interval '2 milliseconds') into v_result;
    select public.record_gift_delivery_reopened_discrepancy_watch(
      '69200000-0000-4000-8000-000000000105'::uuid,v_case,v_release_cert,
      '68700000-0000-4000-8000-000000000099'::uuid,
      '69100000-0000-4000-8000-000000000004'::uuid,
      v_owner,v_fifth,'owner_no_resend_hold_ack','continued_manual_hold',
      'internal_exception_note','DISCREP-692-HOLD',repeat('d',64),
      clock_timestamp()+interval '3 milliseconds') into v_result;
    if v_result->>'gift_resends'<>'0' or v_result->>'provider_requests'<>'0' then
      raise exception 'Build 692 manual watch attempted provider action';end if;
    begin
      update public.gift_issuance_delivery_reopened_discrepancy_watch
        set decision_code='documentary_gap'
        where id='69200000-0000-4000-8000-000000000104'::uuid;
      raise exception 'Build 692 discrepancy ledger is mutable';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise;end if;
    end;
    select public.record_rosevear_integration_v1_original_receipt_intake(
      '69200000-0000-4000-8000-000000000106'::uuid,v_owner,
      'QL246-692-PENDING','health','np-verified-not-claimed',null,
      repeat('e',64),clock_timestamp()) into v_result;
    if v_result->>'connection_state'<>'DISCONNECTED' or
       v_result->>'authenticated_gateway_requests'<>'0' or
       v_result->>'review_state'<>'UNVERIFIED_ORIGINAL' then
      raise exception 'Build 692 falsely verified original QL246 receipt';end if;
    begin
      perform public.record_rosevear_integration_v1_original_receipt_intake(
        '69200000-0000-4000-8000-000000000107'::uuid,v_owner,
        'QL246-692-UNSAFE','health','live-production-secret',null,
        repeat('e',64),clock_timestamp());
      raise exception 'Build 692 accepted a non-np or secret-looking original receipt';
    exception when others then
      if sqlerrm not like 'Owner source-reference intake requires nonsecret exact metadata%' then raise;end if;
    end;
    if (select count(*) from public.gift_issuance_delivery_reopened_discrepancy_watch
          where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 or
       (select count(*) from public.rosevear_integration_v1_original_receipt_intake
          where evidence_reference='QL246-692-PENDING')<>1 then
      raise exception 'Build 692 discrepancy or source receipt count drift';end if;
`;
sql=sql.replace(declaration,declaration+"\n  v_fifth uuid:='69200000-0000-4000-8000-000000000030';")
  .replace(marker,extra+marker)
  .replace(zero,zero+
    '\n     or exists(select 1 from public.gift_issuance_delivery_reopened_discrepancy_watch where case_id=v_case)'+
    "\n     or exists(select 1 from public.rosevear_integration_v1_original_receipt_intake where evidence_reference='QL246-692-PENDING')"+
    '\n     or exists(select 1 from public.staff_users where id=v_fifth)');
if(!sql.includes('BUILD681_EXPECTED_ROLLBACK')||!sql.includes('Build 692 falsely verified original QL246 receipt'))
  throw Error('Build 692 rollback chain incomplete');
export function build692RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
