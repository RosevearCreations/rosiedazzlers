// 681→687 synthetic SQL acceptance. Execute inside BEGIN/ROLLBACK; never contacts a provider.
import {build686RollbackCanary} from './build686_operator_authorization_canary.mjs';
const source=build686RollbackCanary();
const marker=`    begin
      perform public.record_gift_delivery_operator_authorization(
        '68600000-0000-4000-8000-000000000087'::uuid`;
const zero=`     or exists(select 1 from public.gift_issuance_delivery_operator_authorizations where case_id=v_case)`;
if(source.split(marker).length!==2||source.split(zero).length!==2)
  throw Error('Build 686 fixture changed: verify before synthetic Build 687 canary.');
const insert=`    -- Build 687 rejects improper owners and old provider proof before a one-time approval.
    begin
      perform public.record_gift_one_time_dispatch_approval(
        '68700000-0000-4000-8000-000000000091'::uuid,
        v_case,v_release_cert,'68600000-0000-4000-8000-000000000086'::uuid,
        v_auditor,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'Build 687 non-owner approved dispatch';
    exception when others then
      if sqlerrm not like 'Owner/operator authorization expired%' then raise; end if;
    end;
    begin
      perform public.record_gift_one_time_dispatch_approval(
        '68700000-0000-4000-8000-000000000092'::uuid,
        v_case,v_release_cert,'68600000-0000-4000-8000-000000000086'::uuid,
        v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp()-interval '9 minutes');
      raise exception 'Build 687 stale Stripe proof accepted';
    exception when others then
      if sqlerrm not like 'Fresh Stripe evidence%' then raise; end if;
    end;
    select public.record_gift_one_time_dispatch_approval(
      '68700000-0000-4000-8000-000000000093'::uuid,
      v_case,v_release_cert,'68600000-0000-4000-8000-000000000086'::uuid,
      v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
      repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'customer_messages_sent'<>'0' or
       v_result->>'approved_once'<>'true' then
      raise exception 'Build 687 approval performed a provider send'; end if;
    begin
      perform public.record_gift_one_time_dispatch_approval(
        '68700000-0000-4000-8000-000000000094'::uuid,
        v_case,v_release_cert,'68600000-0000-4000-8000-000000000086'::uuid,
        v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'Build 687 duplicated approval';
    exception when others then
      if sqlerrm not like 'One-time dispatch approval already exists%' then raise; end if;
    end;
    begin
      perform public.claim_gift_one_time_dispatch(
        '68700000-0000-4000-8000-000000000095'::uuid,
        '68700000-0000-4000-8000-000000000096'::uuid,
        '68700000-0000-4000-8000-000000000093'::uuid,
        v_case,v_release_cert,v_owner,'paid_verified',repeat('c',64),
        clock_timestamp(),'Test gift','Body text','<p>Body html</p>');
      raise exception 'Build 687 wrong operator consumed send slot';
    exception when others then
      if sqlerrm not like 'One-time dispatch claim blocked%' then raise; end if;
    end;
    begin
      perform public.claim_gift_one_time_dispatch(
        '68700000-0000-4000-8000-000000000097'::uuid,
        '68700000-0000-4000-8000-000000000098'::uuid,
        '68700000-0000-4000-8000-000000000093'::uuid,
        v_case,v_release_cert,v_auditor,'paid_verified',repeat('c',64),
        clock_timestamp()-interval '7 minutes','Test gift','Body text','<p>Body html</p>');
      raise exception 'Build 687 stale claim proof consumed send slot';
    exception when others then
      if sqlerrm not like 'One-time dispatch claim blocked%' then raise; end if;
    end;
    select public.claim_gift_one_time_dispatch(
      '68700000-0000-4000-8000-000000000099'::uuid,
      '68700000-0000-4000-8000-000000000100'::uuid,
      '68700000-0000-4000-8000-000000000093'::uuid,
      v_case,v_release_cert,v_auditor,'paid_verified',repeat('c',64),
      clock_timestamp(),'Your Rosie Dazzlers e-gift','One manual gift email',
      '<p>Your one-time gift</p>') into v_result;
    if v_result->>'reserved_for_exactly_one_provider_call'<>'true' or
       (select purchase_context #>> '{gift_delivery,delivery_status}'
          from public.gift_certificates where id=v_release_cert)<>'processing' or
       (select status from public.notification_events where id=
         '68700000-0000-4000-8000-000000000100'::uuid)<>'processing' then
      raise exception 'Build 687 slot not atomically claimed'; end if;
    begin
      perform public.claim_gift_one_time_dispatch(
        '68700000-0000-4000-8000-000000000101'::uuid,
        '68700000-0000-4000-8000-000000000102'::uuid,
        '68700000-0000-4000-8000-000000000093'::uuid,
        v_case,v_release_cert,v_auditor,'paid_verified',repeat('c',64),
        clock_timestamp(),'Test gift','Body text','<p>Body html</p>');
      raise exception 'Build 687 duplicate provider slot allowed';
    exception when others then
      if sqlerrm not like 'One-time send slot already consumed%' then raise; end if;
    end;
    select public.reconcile_gift_one_time_dispatch(
      '68700000-0000-4000-8000-000000000099'::uuid,
      v_auditor,'provider_accepted','email',202,'provider_687',repeat('a',64)) into v_result;
    if v_result->>'provider_accepted'<>'true' or v_result->>'inbox_delivered'<>'false' or
       (select purchase_context #>> '{gift_delivery,delivery_status}' from
         public.gift_certificates where id=v_release_cert)<>'sent' or
       (select status from public.notification_events where id=
         '68700000-0000-4000-8000-000000000100'::uuid)<>'sent' or
       (select max_attempts from public.notification_events where id=
         '68700000-0000-4000-8000-000000000100'::uuid)<>1 or
       (select provider_message_reference from public.gift_issuance_one_time_dispatch_receipts
         where attempt_id='68700000-0000-4000-8000-000000000099'::uuid)<>'provider_687' then
      raise exception 'Build 687 provider acceptance reconciliation incomplete'; end if;
    begin
      perform public.reconcile_gift_one_time_dispatch(
        '68700000-0000-4000-8000-000000000099'::uuid,
        v_auditor,'provider_accepted','email',202,'provider_687',repeat('a',64));
      raise exception 'Build 687 duplicate receipt replay allowed';
    exception when others then
      if sqlerrm not like 'Provider receipt already reconciled%' then raise; end if;
    end;
    begin
      update public.gift_issuance_one_time_dispatch_attempts
        set provider_message_reference='tampered' where
          id='68700000-0000-4000-8000-000000000099'::uuid;
      raise exception 'Build 687 immutable dispatch attempt tampered';
    exception when others then
      if sqlerrm not like 'One-time dispatch evidence is irreversible%' then raise; end if;
    end;
    begin
      update public.gift_issuance_one_time_dispatch_receipts
        set provider_outcome='outcome_unknown' where
          attempt_id='68700000-0000-4000-8000-000000000099'::uuid;
      raise exception 'Build 687 append-only provider receipt modified';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
    begin
      update public.gift_issuance_one_time_dispatch_approvals
        set operator_staff_user_id=v_owner where certificate_id=v_release_cert;
      raise exception 'Build 687 append-only approval modified';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
const sql=source.replace(marker,insert+marker)
  .replace(zero,zero+'\n'+
    '     or exists(select 1 from public.gift_issuance_one_time_dispatch_approvals where case_id=v_case)'+
    '\n     or exists(select 1 from public.gift_issuance_one_time_dispatch_attempts where certificate_id=v_release_cert)'+
    '\n     or exists(select 1 from public.gift_issuance_one_time_dispatch_receipts where attempt_id=\'68700000-0000-4000-8000-000000000099\'::uuid)');
if(!sql.includes('Build 687 duplicate provider slot allowed')||
   !sql.includes('BUILD681_EXPECTED_ROLLBACK'))throw Error('Incomplete Build 687 rollback fixture');
export function build687RollbackCanary(){return sql;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)
  process.stdout.write(sql);
