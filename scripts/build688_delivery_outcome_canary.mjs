// 681→688 synthetic acceptance: execute in one transaction then ROLLBACK.
import {build687RollbackCanary} from './build687_one_time_dispatch_canary.mjs';
const source=build687RollbackCanary();
const marker=`    begin
      perform public.reconcile_gift_one_time_dispatch(
        '68700000-0000-4000-8000-000000000099'::uuid,
        v_auditor,'provider_accepted'`;
const zero=`     or exists(select 1 from public.gift_issuance_one_time_dispatch_receipts where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)`;
if(source.split(marker).length!==2||source.split(zero).length!==2)
  throw Error('Build 687 fixture changed; verify exact insertion markers.');
const inserts=`    -- Build 688 keeps the one-time provider receipt immutable and records offline evidence only.
    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000001'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_auditor,'owner_provider_outcome_triage','accepted_pending_recipient',
        'provider_receipt','PROVIDER-688A',repeat('a',64),clock_timestamp());
      raise exception 'Build 688 non-owner triage accepted';
    exception when others then
      if sqlerrm not like 'Exact gift, one-time receipt or signed independent owner mismatch%' then raise; end if;
    end;
    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000002'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,'owner_recipient_confirmation','recipient_explicitly_confirmed',
        'recipient_direct_reply','RECIPIENT-688A',repeat('a',64),clock_timestamp());
      raise exception 'Build 688 confirmation without provider triage accepted';
    exception when others then
      if sqlerrm not like 'Recipient confirmation requires explicit independent%' then raise; end if;
    end;
    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000003'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,'owner_provider_outcome_triage','rejected_no_resend',
        'provider_receipt','PROVIDER-688A',repeat('a',64),clock_timestamp());
      raise exception 'Build 688 mismatched provider outcome triage accepted';
    exception when others then
      if sqlerrm not like 'Triage decision must match%' then raise; end if;
    end;
    select public.record_gift_delivery_outcome_review(
      '68800000-0000-4000-8000-000000000004'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_owner,'owner_provider_outcome_triage','accepted_pending_recipient',
      'provider_receipt','PROVIDER-688A',repeat('a',64),clock_timestamp()) into v_result;
    if v_result->>'customer_messages_sent'<>'0' or
       v_result->>'provider_dispatches'<>'0' or
       v_result->>'automatic_resend_permitted'<>'false' then
      raise exception 'Build 688 triage changed an external side effect'; end if;
    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000005'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,'owner_recipient_confirmation','recipient_explicitly_confirmed',
        'provider_receipt','PROVIDER-688A',repeat('b',64),clock_timestamp());
      raise exception 'Build 688 provider receipt counted as recipient confirmation';
    exception when others then
      if sqlerrm not like 'Recipient confirmation requires explicit independent%' then raise; end if;
    end;
    select public.record_gift_delivery_outcome_review(
      '68800000-0000-4000-8000-000000000006'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_owner,'owner_recipient_confirmation','recipient_explicitly_confirmed',
      'recipient_direct_reply','RECIPIENT-688A',repeat('b',64),clock_timestamp()) into v_result;
    select public.record_gift_delivery_outcome_review(
      '68800000-0000-4000-8000-000000000007'::uuid,
      v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
      v_owner,'owner_no_resend_escalation','evidence_conflict',
      'internal_exception_note','OWNER-688-NOTE',repeat('c',64),clock_timestamp()) into v_result;
    begin
      perform public.record_gift_delivery_outcome_review(
        '68800000-0000-4000-8000-000000000008'::uuid,
        v_case,v_release_cert,'68700000-0000-4000-8000-000000000099'::uuid,
        v_owner,'owner_provider_outcome_triage','accepted_pending_recipient',
        'provider_receipt','PROVIDER-688B',repeat('d',64),clock_timestamp());
      raise exception 'Build 688 duplicated provider triage';
    exception when others then
      if sqlerrm not like 'This evidence decision was already recorded%' then raise; end if;
    end;
    begin
      update public.gift_issuance_delivery_outcome_reviews set decision_code='evidence_conflict'
        where id='68800000-0000-4000-8000-000000000004'::uuid;
      raise exception 'Build 688 audit row altered';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
    if (select count(*) from public.gift_issuance_delivery_outcome_reviews
      where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>3 or
      (select status from public.gift_issuance_one_time_dispatch_attempts
        where id='68700000-0000-4000-8000-000000000099'::uuid)<>'provider_accepted' or
      (select max_attempts from public.notification_events
        where id='68700000-0000-4000-8000-000000000100'::uuid)<>1 then
      raise exception 'Build 688 immutable evidence or no-resend boundary drifted'; end if;
`;
const sql=source.replace(marker,inserts+marker).replace(zero,
  zero+`\n     or exists(select 1 from public.gift_issuance_delivery_outcome_reviews where case_id=v_case)`);
if(!sql.includes('Build 688 duplicated provider triage')||!sql.includes('BUILD681_EXPECTED_ROLLBACK'))
  throw Error('Build 688 fixture incomplete.');
export function build688RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.stdout.write(sql);
