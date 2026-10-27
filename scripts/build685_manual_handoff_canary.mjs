// Composed 681→685 full-fixture SQL; synthetic mutations live only inside a rollback.
import {build684RollbackCanary} from './build684_verified_release_canary.mjs';
const source684=build684RollbackCanary();
const insertBefore=`    begin
      perform public.record_gift_verified_release(
        '68400000-0000-4000-8000-000000000065'::uuid`;
const zero684='     or exists(select 1 from public.gift_issuance_verified_release_events where case_id=v_case)';
if(source684.split(insertBefore).length!==2||source684.split(zero684).length!==2)
  throw Error('Build 684 rollback fixture changed; validate before composing Build 685.');
const insertion=`    -- Build 685: validate source and record a single internal handoff, never send.
    begin
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000071'::uuid,
        '68400000-0000-4000-8000-000000000064'::uuid,
        v_case,v_release_cert,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 685 independent auditor improperly accepted';
    exception when others then
      if sqlerrm not like 'Verified owner release superseded%' then raise; end if;
    end;
    begin
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000072'::uuid,
        '68400000-0000-4000-8000-000000000064'::uuid,
        v_case,v_release_cert,v_owner,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),
        clock_timestamp()-interval '8 minutes');
      raise exception 'Build 685 stale provider proof improperly accepted';
    exception when others then
      if sqlerrm not like 'Payment verification or release fingerprint%' then raise; end if;
    end;
    begin
      update public.gift_certificates set purchase_context=
        pg_catalog.jsonb_set(purchase_context,'{gift_delivery,recipient_provider_status}',
          '"submitted"'::jsonb,true) where id=v_release_cert;
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000073'::uuid,
        '68400000-0000-4000-8000-000000000064'::uuid,
        v_case,v_release_cert,v_owner,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 685 prior send improperly accepted';
    exception when others then
      if sqlerrm not like 'Recipient delivery already attempted%' then raise; end if;
    end;
    begin
      update public.gift_issuance_review_cases set status='reviewed_hold' where id=v_case;
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000074'::uuid,
        '68400000-0000-4000-8000-000000000064'::uuid,
        v_case,v_release_cert,v_owner,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 685 reopened case improperly accepted';
    exception when others then
      if sqlerrm not like 'Verified owner release superseded%' then raise; end if;
    end;
    select public.record_gift_manual_delivery_handoff(
      '68500000-0000-4000-8000-000000000075'::uuid,
      '68400000-0000-4000-8000-000000000064'::uuid,
      v_case,v_release_cert,v_owner,'paid_verified',
      'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'manual_delivery_authorized_now'<>'false' or
       v_result->>'manual_operator_review_ready'<>'true' or
       v_result->>'customer_messages_sent'<>'0' or
       v_result->>'payment_mutations'<>'0' or
       v_result->>'gift_balance_mutations'<>'0' or
       v_result->>'integration_events_dispatched'<>'0' then
      raise exception 'Build 685 internal handoff mutated a customer/provider'; end if;
    begin
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000076'::uuid,
        '68400000-0000-4000-8000-000000000064'::uuid,
        v_case,v_release_cert,v_owner,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 685 duplicate handoff accepted';
    exception when others then
      if sqlerrm not like 'Manual handoff already recorded%' then raise; end if;
    end;
    begin
      update public.gift_issuance_manual_delivery_handoffs
        set actor_staff_user_id=v_auditor where certificate_id=v_release_cert;
      raise exception 'Build 685 handoff audit edited';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
const sql=source684.replace(insertBefore,insertion+insertBefore)
  .replace(zero684,zero684+'\n'+
    '     or exists(select 1 from public.gift_issuance_manual_delivery_handoffs where case_id=v_case)');
if(!sql.includes('Build 685 internal handoff mutated a customer/provider')||
   !sql.includes('BUILD681_EXPECTED_ROLLBACK'))throw Error('Build 685 incomplete rollback fixture');
process.stdout.write(sql);
