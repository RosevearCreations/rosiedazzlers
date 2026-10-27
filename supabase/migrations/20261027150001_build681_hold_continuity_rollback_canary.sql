-- Build 681: transactional full-chain synthetic acceptance. Every synthetic
-- staff member, gift and audit event is rolled back intentionally.
do $build681$
declare
  v_session text:='cs_test_build681_rollback_only_ABC1234567';
  v_sku text;
  v_owner uuid;
  v_old_reviewer uuid;
  v_rechecker uuid:='68100000-0000-4000-8000-000000000030';
  v_auditor uuid:='68100000-0000-4000-8000-000000000031';
  v_case uuid:='68100000-0000-4000-8000-000000000032';
  v_decision uuid:='68100000-0000-4000-8000-000000000033';
  v_old_review uuid:='68100000-0000-4000-8000-000000000034';
  v_old_handoff uuid:='68100000-0000-4000-8000-000000000035';
  v_recurrence uuid:='68100000-0000-4000-8000-000000000036';
  v_followup uuid:='68100000-0000-4000-8000-000000000037';
  v_assignment uuid:='68100000-0000-4000-8000-000000000038';
  v_new_review uuid:='68100000-0000-4000-8000-000000000039';
  v_handoff uuid:='68100000-0000-4000-8000-000000000040';
  v_closeout uuid:='68100000-0000-4000-8000-000000000041';
  v_watch uuid:='68100000-0000-4000-8000-000000000042';
  v_renewal uuid:='68100000-0000-4000-8000-000000000043';
  v_audit uuid:='68100000-0000-4000-8000-000000000044';
  v_ack uuid:='68100000-0000-4000-8000-000000000045';
  v_alert uuid:='68100000-0000-4000-8000-000000000050';
  v_request uuid:='68100000-0000-4000-8000-000000000051';
  v_attest uuid:='68100000-0000-4000-8000-000000000052';
  v_reconcile uuid:='68100000-0000-4000-8000-000000000053';
  v_escalate uuid:='68100000-0000-4000-8000-000000000054';
  v_recheck uuid:='68100000-0000-4000-8000-000000000055';
  v_continuity uuid:='68100000-0000-4000-8000-000000000056';
  v_checked timestamptz;
  v_result jsonb;
begin
  if exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.staff_users where id in (v_rechecker,v_auditor)) then
    raise exception 'Build 681 rollback synthetic IDs are occupied';
  end if;
  select id into v_owner from public.staff_users where is_active=true
    and role_code='admin' order by id limit 1;
  select id into v_old_reviewer from public.staff_users where is_active=true
    and role_code in ('detailer','senior_detailer') order by id limit 1;
  select sku into v_sku from public.gift_products
    where is_active=true and type='value' limit 1;
  if v_owner is null or v_old_reviewer is null or v_sku is null then
    raise exception 'Build 681 requires active owner, reviewer and value gift SKU';
  end if;
  begin
    insert into public.staff_users(id,full_name,email,role_code,is_active)
    values(v_rechecker,'Rollback Only Recheck Staff','build681-rechecker@example.invalid','detailer',true),
          (v_auditor,'Rollback Only Separate Auditor','build681-auditor@example.invalid','detailer',true);
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,recipient_email,
       stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values('RD-B681-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
      'synthetic-rollback@example.invalid',v_session,'pi_build681_rollback',1,
      '{"gift_delivery":{"delivery_status":"pending","recipient_provider_status":"not_submitted","purchaser_copy_status":"not_submitted"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values(v_session,'evt_build681_first','evt_build681_first',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values('evt_build681_first',v_session,'checkout.session.completed',repeat('a',64),'issued');
    perform public.record_gift_issuance_recovery_decision(v_decision,v_session,v_owner,
      v_owner::text,'close_verified_no_action','verified_no_duplicate','paid_verified',
      'paid','complete',false,1,10000,'pi_build681_rollback','cad',repeat('b',64),now());
    perform public.assign_gift_issuance_independent_reviewer(
      '68100000-0000-4000-8000-000000000046'::uuid,v_case,v_decision,
      v_old_reviewer,v_owner,v_owner::text,now()+interval '48 hours');
    perform public.record_gift_issuance_reviewer_outcome(v_old_review,v_case,v_old_reviewer,
      'handoff_review_ready','independent_verified',1);
    perform public.record_gift_review_followup_event(v_old_handoff,v_case,v_owner,
      'handoff_receipt_confirmed','owner_receipt_acknowledged',2,v_old_review);
    perform public.record_gift_review_followup_event(v_recurrence,v_case,v_owner,
      'recurrence_opened','evidence_changed',2,v_old_handoff);
    perform public.record_gift_review_followup_event(v_followup,v_case,v_owner,
      'recurrence_followup_recorded','recheck_requested',2,v_recurrence);
    perform public.record_gift_recovery_recheck_event(v_assignment,v_case,v_owner,
      'recheck_assigned','independent_recheck_requested',2,v_recurrence,null,
      v_rechecker,now()+interval '36 hours');
    perform public.record_gift_issuance_reviewer_outcome(v_new_review,v_case,v_rechecker,
      'handoff_review_ready','independent_verified',3);
    perform public.record_gift_recovery_recheck_event(v_handoff,v_case,v_owner,
      'handoff_refreshed','fresh_handoff_verified',4,v_recurrence,v_new_review,
      v_rechecker,null);
    perform public.record_gift_recovery_recheck_event(v_closeout,v_case,v_owner,
      'owner_closeout_recorded','closed_no_dispatch',4,v_recurrence,v_handoff,
      v_rechecker,null);
    perform public.record_gift_closeout_audit_event(v_watch,v_case,v_closeout,
      v_owner,v_auditor,'watch_opened',null,null,null,null,null,null,null,null);
    v_checked:=clock_timestamp();
    perform public.record_gift_closeout_audit_event(v_renewal,v_case,v_closeout,
      v_owner,v_auditor,'evidence_renewed',v_watch,'paid_verified','pi_build681_rollback',
      'cad',1,10000,repeat('c',64),v_checked);
    perform public.record_gift_audit_alert_event(v_alert,v_case,v_closeout,
      v_owner,v_auditor,'alert_opened',null,v_renewal,'independent_review_due',
      null,null,null,null,null,null,null);
    perform public.record_gift_audit_alert_event(v_request,v_case,v_closeout,
      v_owner,v_auditor,'renewal_requested',v_alert,v_renewal,'independent_review_due',
      null,null,null,null,null,null,null);
    perform public.record_gift_closeout_audit_event(v_audit,v_case,v_closeout,
      v_auditor,v_auditor,'independent_audit_recorded',v_renewal,'paid_verified',
      'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
    perform public.record_gift_audit_alert_event(v_attest,v_case,v_closeout,
      v_auditor,v_auditor,'independent_renewal_attested',v_request,v_audit,
      'independent_review_due','paid_verified','pi_build681_rollback','cad',1,10000,
      repeat('c',64),clock_timestamp());
    perform public.record_gift_closeout_audit_event(v_ack,v_case,v_closeout,
      v_owner,v_auditor,'owner_audit_acknowledged',v_audit,'paid_verified',
      'pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
    perform public.record_gift_audit_alert_event(v_reconcile,v_case,v_closeout,
      v_owner,v_auditor,'owner_hold_reconciled',v_attest,v_ack,'independent_review_due',
      'paid_verified','pi_build681_rollback','cad',1,10000,repeat('c',64),clock_timestamp());

    select public.record_gift_hold_continuity_event(v_escalate,v_case,v_closeout,v_reconcile,
      v_ack,v_owner,v_auditor,'hold_escalated','owner_requested_recheck',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
      then raise exception 'Build 681 escalation failed customer HOLD'; end if;
    select public.record_gift_hold_continuity_event(v_escalate,v_case,v_closeout,v_reconcile,
      v_ack,v_owner,v_auditor,'hold_escalated','owner_requested_recheck',null,
      null,null,null,null,null,null,null) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 681 escalation replay failed'; end if;
    begin
      perform public.record_gift_hold_continuity_event(
        '68100000-0000-4000-8000-000000000060'::uuid,v_case,v_closeout,v_reconcile,
        v_ack,v_owner,v_auditor,'independent_recheck_attested','owner_requested_recheck',
        v_escalate,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp());
      raise exception 'OWNER_SELF_RECHECK_ACCEPTED';
    exception when others then
      if sqlerrm not like 'Independent recheck must%' then raise; end if;
    end;
    begin
      perform public.record_gift_hold_continuity_event(
        '68100000-0000-4000-8000-000000000061'::uuid,v_case,v_closeout,v_reconcile,
        v_ack,v_auditor,v_auditor,'independent_recheck_attested','owner_requested_recheck',
        v_escalate,'paid_verified','pi_build681_rollback','cad',1,10000,
        repeat('c',64),clock_timestamp()-interval '8 minutes');
      raise exception 'STALE_RECHECK_ACCEPTED';
    exception when others then
      if sqlerrm not like 'Current case or paid provider proof failed%' then raise; end if;
    end;
    select public.record_gift_hold_continuity_event(v_recheck,v_case,v_closeout,v_reconcile,
      v_ack,v_auditor,v_auditor,'independent_recheck_attested','owner_requested_recheck',
      v_escalate,'paid_verified','pi_build681_rollback','cad',1,10000,
      repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'customer_messages_sent'<>'0' then raise exception 'Unsafe independent recheck'; end if;
    select public.record_gift_hold_continuity_event(v_continuity,v_case,v_closeout,v_reconcile,
      v_ack,v_owner,v_auditor,'owner_continuity_closed','owner_requested_recheck',
      v_recheck,'paid_verified','pi_build681_rollback','cad',1,10000,
      repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'owner_hold'<>'true' or v_result->>'customer_delivery_authorized'<>'false'
       or v_result->>'customer_messages_sent'<>'0' or v_result->>'payment_mutations'<>'0'
       or v_result->>'gift_balance_mutations'<>'0' then
      raise exception 'Unsafe owner HOLD continuity closure'; end if;
    begin
      update public.gift_issuance_hold_continuity_events
        set escalation_reason='recurrence_reopened' where id=v_continuity;
      raise exception 'MUTABLE_CONTINUITY_RECEIPT';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
    raise exception 'BUILD681_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm<>'BUILD681_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists(select 1 from public.staff_users where id in (v_rechecker,v_auditor))
     or exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_cases where id=v_case)
     or exists(select 1 from public.gift_issuance_closeout_audit_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_audit_alert_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_hold_continuity_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_recheck_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_followup_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_receipts where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_webhook_events where stripe_session_id=v_session) then
    raise exception 'Build 681 rollback canary retained synthetic records';
  end if;
end $build681$;
