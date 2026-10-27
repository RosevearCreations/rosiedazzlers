// Full B681→B684 owner/auditor/gift fixture. All writes roll back on purpose.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function build684RollbackCanary(){
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source681=read('supabase/migrations/20261027150001_build681_hold_continuity_rollback_canary.sql');
const script682=read('scripts/build682_hold_followup_canary.mjs');
const script683=read('scripts/build683_hold_renewal_canary.mjs');
const insertion682=script682.match(/^const insertion=`([\s\S]*?)`;\nconst rollbackMarker=/m);
const insertion683=script683.match(/^const insertion=`([\s\S]*?)`;\nconst zeroMarker=/m);
const marker="    raise exception 'BUILD681_EXPECTED_ROLLBACK';";
const zero681='     or exists(select 1 from public.gift_issuance_hold_continuity_events where case_id=v_case)';
const zero682='     or exists(select 1 from public.gift_issuance_hold_followup_events where case_id=v_case)';
const zero683='     or exists(select 1 from public.gift_issuance_hold_renewal_events where case_id=v_case)';
const beforeRecurrence='    -- New recurrence after the Build 682 owner closure:';
if(!insertion682||!insertion683||source681.split(marker).length!==2||
   source681.split(zero681).length!==2||insertion683[1].split(beforeRecurrence).length!==2)
  throw Error('Build 681-683 checked source changed; do not run unverified canary.');
const insertion684=`    -- B684: manual release of exactly one not-yet-sent certificate.
    -- Source is the latest independently verified B683 owner acknowledgment.
    select id into v_release_cert from public.gift_certificates
      where stripe_session_id=v_session and checkout_line_number=1;
    if v_release_cert is null then raise exception 'Build 684 gift fixture absent'; end if;
    begin
      perform public.record_gift_verified_release(
        '68400000-0000-4000-8000-000000000061'::uuid,v_case,v_release_cert,
        '68300000-0000-4000-8000-000000000056'::uuid,
        v_auditor,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'Build 684 independent auditor improperly released gift';
    exception when others then
      if sqlerrm not like 'Current independent verification or owner approval missing%' then raise; end if;
    end;
    begin
      perform public.record_gift_verified_release(
        '68400000-0000-4000-8000-000000000062'::uuid,v_case,v_release_cert,
        '68300000-0000-4000-8000-000000000056'::uuid,
        v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp()-interval '8 minutes');
      raise exception 'Build 684 stale Stripe proof improperly accepted';
    exception when others then
      if sqlerrm not like 'Paid Stripe proof is missing%' then raise; end if;
    end;
    begin
      update public.gift_certificates set purchase_context=
        pg_catalog.jsonb_set(purchase_context,'{gift_delivery,recipient_provider_status}',
          '"sent"'::jsonb,true) where id=v_release_cert;
      perform public.record_gift_verified_release(
        '68400000-0000-4000-8000-000000000063'::uuid,v_case,v_release_cert,
        '68300000-0000-4000-8000-000000000056'::uuid,
        v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'Build 684 prior send accepted';
    exception when others then
      if sqlerrm not like 'Prior delivery, queued message%' then raise; end if;
    end;
    select public.record_gift_verified_release(
      '68400000-0000-4000-8000-000000000064'::uuid,v_case,v_release_cert,
      '68300000-0000-4000-8000-000000000056'::uuid,
      v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
      repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'manual_delivery_eligible'<>'true' or
       v_result->>'customer_messages_sent'<>'0' or
       v_result->>'payment_mutations'<>'0' or
       v_result->>'gift_balance_mutations'<>'0' or
       v_result->>'integration_events_dispatched'<>'0' then
      raise exception 'Build 684 release improperly mutated external state'; end if;
    begin
      perform public.record_gift_verified_release(
        '68400000-0000-4000-8000-000000000065'::uuid,v_case,v_release_cert,
        '68300000-0000-4000-8000-000000000056'::uuid,
        v_owner,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'Build 684 duplicate gift release accepted';
    exception when others then
      if sqlerrm not like 'Gift already released%' then raise; end if;
    end;
    begin
      update public.gift_issuance_verified_release_events
        set actor_staff_user_id=v_auditor where certificate_id=v_release_cert;
      raise exception 'Build 684 immutable owner approval was edited';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
`;
let source=source681.replace(marker,insertion682[1]+marker)
  .replace(zero681,zero681+'\n'+zero682);
const withRelease=insertion683[1].replace(beforeRecurrence,insertion684+beforeRecurrence);
source=source.replace(marker,withRelease+marker)
  .replace(zero682,zero682+'\n'+zero683+
    '\n     or exists(select 1 from public.gift_issuance_verified_release_events where case_id=v_case)');
source=source.replace('  v_result jsonb;','  v_result jsonb;\n  v_release_cert uuid;');
if(!source.includes('Build 684 release improperly mutated external state')||
   !source.includes('BUILD681_EXPECTED_ROLLBACK')||source.split(marker).length!==2)
  throw Error('Build 684 release rollback fixture is incomplete.');
return source;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  process.stdout.write(build684RollbackCanary());
