// Synthetic full Build 681→686 rollback fixture. This never persists gift/send data.
import {build685RollbackCanary} from './build685_manual_handoff_canary.mjs';
const source685=build685RollbackCanary();
const marker=`    begin
      perform public.record_gift_manual_delivery_handoff(
        '68500000-0000-4000-8000-000000000076'::uuid`;
const zero685='     or exists(select 1 from public.gift_issuance_manual_delivery_handoffs where case_id=v_case)';
if(source685.split(marker).length!==2||source685.split(zero685).length!==2)
  throw Error('Build 685 canary changed; verify composition before using Build 686.');
const insertion=`    -- Build 686: independently recheck gift and assign a distinct operator.
    begin
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000081'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_auditor,v_owner,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 686 non-owner operator assigned delivery';
    exception when others then
      if sqlerrm not like 'Current independent release/handoff invalid%' then raise; end if;
    end;
    begin
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000082'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),
        clock_timestamp()-interval '8 minutes');
      raise exception 'Build 686 stale provider proof accepted';
    exception when others then
      if sqlerrm not like 'Provider payment evidence stale%' then raise; end if;
    end;
    begin
      update public.staff_users set is_active=false where id=v_auditor;
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000083'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 686 inactive operator accepted';
    exception when others then
      if sqlerrm not like 'Current independent release/handoff invalid%' then raise; end if;
    end;
    begin
      update public.gift_certificates set purchase_context=
        pg_catalog.jsonb_set(purchase_context,'{gift_delivery,recipient_provider_status}',
          '"submitted"'::jsonb,true) where id=v_release_cert;
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000084'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 686 prior submitted delivery accepted';
    exception when others then
      if sqlerrm not like 'Prior delivery, queued send%' then raise; end if;
    end;
    begin
      update public.gift_issuance_review_cases set status='reviewed_hold' where id=v_case;
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000085'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 686 reopened case accepted';
    exception when others then
      if sqlerrm not like 'Current independent release/handoff invalid%' then raise; end if;
    end;
    select public.record_gift_delivery_operator_authorization(
      '68600000-0000-4000-8000-000000000086'::uuid,
      '68500000-0000-4000-8000-000000000075'::uuid,
      v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
      'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp())
      into v_result;
    if v_result->>'manual_delivery_authorized_now'<>'false' or
       v_result->>'operator_preparation_authorized'<>'true' or
       v_result->>'customer_messages_sent'<>'0' or
       v_result->>'payment_mutations'<>'0' or
       v_result->>'gift_balance_mutations'<>'0' or
       v_result->>'integration_events_dispatched'<>'0' then
      raise exception 'Build 686 operator authorization mutated customer/provider'; end if;
    begin
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000087'::uuid,
        '68500000-0000-4000-8000-000000000075'::uuid,
        v_case,v_release_cert,v_owner,v_auditor,'paid_verified',
        'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'Build 686 duplicate operator assignment accepted';
    exception when others then
      if sqlerrm not like 'Operator authorization already recorded%' then raise; end if;
    end;
    begin
      update public.gift_issuance_delivery_operator_authorizations
        set operator_staff_user_id=v_owner where certificate_id=v_release_cert;
      raise exception 'Build 686 immutable operator audit modified';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
const sql=source685.replace(marker,insertion+marker)
  .replace(zero685,zero685+'\n'+
    '     or exists(select 1 from public.gift_issuance_delivery_operator_authorizations where case_id=v_case)');
if(!sql.includes('Build 686 operator authorization mutated customer/provider')||
   !sql.includes('BUILD681_EXPECTED_ROLLBACK'))throw Error('Build 686 incomplete rollback fixture');
process.stdout.write(sql);
