// Full 681→690 reversible SQL acceptance. Run ONLY in a single BEGIN/ROLLBACK.
import {build689RollbackCanary} from './build689_followup_integration_canary.mjs';
const source=build689RollbackCanary();
const marker='    -- QL-243: atomically persisted nonce + replay denial and append-only source audit.';
const zero='     or exists(select 1 from public.gift_issuance_delivery_followup_reviews where case_id=v_case)';
if(source.split(marker).length!==2||source.split(zero).length!==2)
  throw Error('Build 689 fixture changed; refusing abbreviated rollback acceptance.');
const insert=`    -- Build 690: owner cannot appoint the original recipient rechecker again.
    begin
      perform public.record_gift_delivery_closure_recurrence(
        '69000000-0000-4000-8000-000000000001'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        '68900000-0000-4000-8000-000000000006'::uuid,v_owner,v_rechecker,
        'owner_watch_opened','watch_requested','internal_exception_note',
        'WATCH-690-BAD',repeat('a',64),clock_timestamp());
      raise exception 'Build 690 allowed reused independent reviewer';
    exception when others then
      if sqlerrm not like 'Owner must assign a third distinct active recurrence reviewer%' then raise;end if;
    end;
    select public.record_gift_delivery_closure_recurrence(
      '69000000-0000-4000-8000-000000000002'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      '68900000-0000-4000-8000-000000000006'::uuid,v_owner,v_old_reviewer,
      'owner_watch_opened','watch_requested','internal_exception_note',
      'WATCH-690-OWNER',repeat('b',64),clock_timestamp()) into v_result;
    if v_result->>'automatic_resend_permitted'<>'false' or
       v_result->>'provider_dispatches'<>'0' then
       raise exception 'Build 690 watch violated one-time dispatch';end if;
    begin
      perform public.record_gift_delivery_closure_recurrence(
        '69000000-0000-4000-8000-000000000003'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        '68900000-0000-4000-8000-000000000006'::uuid,v_rechecker,v_rechecker,
        'independent_recurrence_audited','recurrence_detected','recipient_reported_missing',
        'RECUR-690-BAD',repeat('c',64),clock_timestamp());
      raise exception 'Build 690 allowed unassigned reviewer';
    exception when others then
      if sqlerrm not like 'Only the assigned third reviewer may recheck current recurrence evidence%' then raise;end if;
    end;
    select public.record_gift_delivery_closure_recurrence(
      '69000000-0000-4000-8000-000000000004'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      '68900000-0000-4000-8000-000000000006'::uuid,v_old_reviewer,v_old_reviewer,
      'independent_recurrence_audited','recurrence_detected','recipient_reported_missing',
      'RECUR-690-FOUND',repeat('c',64),clock_timestamp()+interval '1 millisecond') into v_result;
    if v_result->>'recurrence_requires_manual_attention'<>'true' or
       v_result->>'customer_messages_sent'<>'0' then
       raise exception 'Build 690 recurrence silently affected customer or notification';end if;
    select public.record_gift_delivery_closure_recurrence(
      '69000000-0000-4000-8000-000000000005'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      '68900000-0000-4000-8000-000000000006'::uuid,v_owner,v_old_reviewer,
      'owner_no_resend_alert_ack','acknowledged_no_resend','internal_exception_note',
      'ACK-690-OWNER',repeat('d',64),clock_timestamp()+interval '2 milliseconds') into v_result;
    if v_result->>'automatic_resend_permitted'<>'false' then
      raise exception 'Build 690 alert acknowledgment authorized resend';end if;
    begin
      perform public.record_gift_delivery_closure_recurrence(
        '69000000-0000-4000-8000-000000000006'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        '68900000-0000-4000-8000-000000000006'::uuid,v_owner,v_old_reviewer,
        'owner_no_resend_alert_ack','acknowledged_no_resend','internal_exception_note',
        'ACK-690-AGAIN',repeat('d',64),clock_timestamp());
      raise exception 'Build 690 duplicated alert acknowledgment';
    exception when others then
      if sqlerrm not like 'Closure recurrence action already recorded%' then raise;end if;
    end;
    begin
      update public.gift_issuance_delivery_closure_recurrence
        set decision_code='no_recurrence_observed' where
        id='69000000-0000-4000-8000-000000000004'::uuid;
      raise exception 'Build 690 mutable independent recurrence evidence';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise;end if;
    end;
    select public.record_rosevear_integration_v1_owner_readiness(
      '69000000-0000-4000-8000-000000000007'::uuid,v_owner,null,
      'QL243-690-HOLD',repeat('e',64),clock_timestamp(),
      '{"mode_configured":false,"origin_configured":false,"key_id_configured":false,
        "hmac_key_configured":false,"gateway_audit_verified":false,
        "witness_verified":false,"pilot_authorized":false}'::jsonb) into v_result;
    if v_result->>'connection_status'<>'HOLD' or
       v_result->>'external_gets_executed'<>'0' then
       raise exception 'Build 690 HOLD snapshot made external connection';end if;
    begin
      perform public.record_rosevear_integration_v1_owner_readiness(
        '69000000-0000-4000-8000-000000000008'::uuid,v_owner,null,
        'QL243-690-FAKE',repeat('e',64),clock_timestamp(),
        '{"mode_configured":true,"origin_configured":true,"key_id_configured":true,
          "hmac_key_configured":true,"gateway_audit_verified":true,
          "witness_verified":false,"pilot_authorized":false}'::jsonb);
      raise exception 'Build 690 allowed false gateway proof';
    exception when others then
      if sqlerrm not like 'Owner may record only a current seven-field HOLD checklist%' then raise;end if;
    end;
    if (select count(*) from public.gift_issuance_delivery_closure_recurrence
         where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 or
       (select count(*) from public.rosevear_integration_v1_owner_readiness_reviews
         where evidence_reference='QL243-690-HOLD')<>1 then
      raise exception 'Build 690 immutable watch or owner receipt count drift';end if;
`;
const sql=source.replace(marker,insert+marker).replace(zero,zero+
  '\n     or exists(select 1 from public.gift_issuance_delivery_closure_recurrence where case_id=v_case)'+
  "\n     or exists(select 1 from public.rosevear_integration_v1_owner_readiness_reviews where evidence_reference='QL243-690-HOLD')");
if(!sql.includes('BUILD681_EXPECTED_ROLLBACK')||!sql.includes('Build 690 allowed false gateway proof'))
  throw Error('Build 690 fixture source incomplete');
export function build690RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
