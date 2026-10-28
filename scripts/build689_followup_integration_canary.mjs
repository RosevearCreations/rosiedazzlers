// Full 681→689 synthetic SQL fixture, always execute inside BEGIN/ROLLBACK.
import {build688RollbackCanary} from './build688_delivery_outcome_canary.mjs';
const source=build688RollbackCanary();
const marker=`    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000008'::uuid`;
const zero=`     or exists(select 1 from public.gift_issuance_delivery_outcome_reviews where case_id=v_case)`;
if(source.split(marker).length!==2||source.split(zero).length!==2)
  throw Error('Build 688 full rollback fixture changed, stopping.');
const insert=`    -- Build 689: independent reviewer must not be original operator or original owner.
    begin
      perform public.record_gift_delivery_followup_review(
        '68900000-0000-4000-8000-000000000001'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,v_auditor,'owner_followup_assignment','review_assigned',
        'internal_exception_note','ASSIGN-689-A',repeat('d',64),clock_timestamp());
      raise exception 'Build 689 original delivery operator was assigned for independent review';
    exception when others then
      if sqlerrm not like 'Owner must assign a different active independent reviewer%' then raise; end if;
    end;
    select public.record_gift_delivery_followup_review(
      '68900000-0000-4000-8000-000000000002'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_owner,v_rechecker,'owner_followup_assignment','review_assigned',
      'internal_exception_note','ASSIGN-689-B',repeat('d',64),clock_timestamp()) into v_result;
    if v_result->>'provider_dispatches'<>'0' or
       v_result->>'automatic_resend_permitted'<>'false' then
       raise exception 'Build 689 assignment allowed a resend'; end if;
    begin
      perform public.record_gift_delivery_followup_review(
        '68900000-0000-4000-8000-000000000003'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,v_rechecker,'independent_recipient_recheck','recipient_evidence_supported',
        'recipient_direct_reply','REVIEW-689-A',repeat('e',64),clock_timestamp());
      raise exception 'Build 689 owner self-review accepted';
    exception when others then
      if sqlerrm not like 'Assigned independent reviewer and matching recipient evidence required%' then raise; end if;
    end;
    begin
      perform public.record_gift_delivery_followup_review(
        '68900000-0000-4000-8000-000000000004'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_rechecker,v_rechecker,'independent_recipient_recheck','recipient_evidence_supported',
        'provider_dashboard_reference','REVIEW-689-B',repeat('e',64),clock_timestamp());
      raise exception 'Build 689 provider receipt counted as recipient proof';
    exception when others then
      if sqlerrm not like 'Assigned independent reviewer and matching recipient evidence required%' then raise; end if;
    end;
    select public.record_gift_delivery_followup_review(
      '68900000-0000-4000-8000-000000000005'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_rechecker,v_rechecker,'independent_recipient_recheck','recipient_evidence_supported',
      'recipient_direct_reply','REPLY-689-GIFT',repeat('e',64),clock_timestamp()) into v_result;
    select public.record_gift_delivery_followup_review(
      '68900000-0000-4000-8000-000000000006'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_owner,v_rechecker,'owner_no_resend_closeout','confirmed_no_resend_closed',
      'internal_exception_note','CLOSE-689-GIFT',repeat('f',64),clock_timestamp()) into v_result;
    if v_result->>'customer_messages_sent'<>'0' or
       v_result->>'payment_mutations'<>'0' or
       v_result->>'original_attempt_consumed'<>'true' then
       raise exception 'Build 689 owner closure changed gift or provider';end if;
    begin
      perform public.record_gift_delivery_followup_review(
        '68900000-0000-4000-8000-000000000007'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,v_rechecker,'owner_no_resend_closeout','confirmed_no_resend_closed',
        'internal_exception_note','CLOSE-689-RETRY',repeat('f',64),clock_timestamp());
      raise exception 'Build 689 duplicate closure accepted';
    exception when others then
      if sqlerrm not like 'Independent follow-up already recorded%' then raise; end if;
    end;
    begin
      update public.gift_issuance_delivery_followup_reviews
        set decision_code='conflicting_evidence' where
        id='68900000-0000-4000-8000-000000000005'::uuid;
      raise exception 'Build 689 independent audit altered';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
    -- QL-243: atomically persisted nonce + replay denial and append-only source audit.
    select public.record_rosevear_integration_v1_probe(
      '68900000-0000-4000-8000-000000000010'::uuid,
      '/api/integration/v1/health','GET','ok','np-rosie-689',repeat('a',64),true) into v_result;
    if v_result->>'decision'<>'accepted' or v_result->>'connection_status'<>'HOLD'
      then raise exception 'Build 689 nonproduction health probe not atomically logged';end if;
    select public.record_rosevear_integration_v1_probe(
      '68900000-0000-4000-8000-000000000011'::uuid,
      '/api/integration/v1/health','GET','ok','np-rosie-689',repeat('a',64),true) into v_result;
    if v_result->>'decision'<>'replay_denied' then
      raise exception 'Build 689 nonproduction replay was not denied';end if;
    select public.record_rosevear_integration_v1_probe(
      '68900000-0000-4000-8000-000000000012'::uuid,
      '/api/integration/v1/capabilities','OTHER','wrong_method',
      'np-rosie-689',repeat('b',64),false) into v_result;
    if v_result->>'decision'<>'denied' then
      raise exception 'Build 689 nonproduction write request not denied';end if;
    if (select count(*) from public.rosevear_integration_v1_nonce_registry
         where key_id='np-rosie-689')<>1 or
       (select count(*) from public.rosevear_integration_v1_probe_audit
         where key_id='np-rosie-689')<>3 or
       (select count(*) from public.gift_issuance_delivery_followup_reviews
         where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 then
      raise exception 'Build 689 nonproduction audit or follow-up count drift';end if;
`;
const sql=source.replace(marker,insert+marker).replace(zero,
  zero+`\n     or exists(select 1 from public.gift_issuance_delivery_followup_reviews where case_id=v_case)`+
  `\n     or exists(select 1 from public.rosevear_integration_v1_nonce_registry where key_id='np-rosie-689')`+
  `\n     or exists(select 1 from public.rosevear_integration_v1_probe_audit where key_id='np-rosie-689')`);
if(!sql.includes('Build 689 duplicate closure accepted')||!sql.includes('BUILD681_EXPECTED_ROLLBACK'))
  throw Error('Incomplete Build 689 full rollback canary');
export function build689RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
