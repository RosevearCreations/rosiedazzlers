-- Build 678 transactional acceptance. Every synthetic row is rolled back.
-- A temporary passwordless reviewer is used because the live workshop roster
-- currently has only one non-owner staff member; no account persists.
do $build678$
declare
  v_session text:='cs_test_build678_rollback_only_ABC1234567';
  v_sku text;
  v_owner uuid;
  v_reviewer uuid;
  v_new_reviewer uuid:='67800000-0000-4000-8000-000000000030'::uuid;
  v_case uuid:='67800000-0000-4000-8000-000000000031'::uuid;
  v_decision uuid:='67800000-0000-4000-8000-000000000032'::uuid;
  v_old_review uuid:='67800000-0000-4000-8000-000000000033'::uuid;
  v_old_handoff uuid:='67800000-0000-4000-8000-000000000034'::uuid;
  v_recurrence uuid:='67800000-0000-4000-8000-000000000035'::uuid;
  v_followup uuid:='67800000-0000-4000-8000-000000000036'::uuid;
  v_assignment uuid:='67800000-0000-4000-8000-000000000037'::uuid;
  v_new_review uuid:='67800000-0000-4000-8000-000000000038'::uuid;
  v_new_handoff uuid:='67800000-0000-4000-8000-000000000039'::uuid;
  v_closeout uuid:='67800000-0000-4000-8000-000000000040'::uuid;
  v_result jsonb;
begin
  if exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.staff_users where id=v_new_reviewer) then
    raise exception 'Existing Build 678 canary evidence requires manual reconciliation';
  end if;
  select id into v_owner from public.staff_users
    where is_active=true and role_code='admin' order by id limit 1;
  select id into v_reviewer from public.staff_users
    where is_active=true and id<>v_owner order by id limit 1;
  select sku into v_sku from public.gift_products where is_active=true and type='value' limit 1;
  if v_owner is null or v_reviewer is null or v_sku is null then
    raise exception 'Build 678 canary requires owner, active reviewer and value SKU';
  end if;
  begin
    insert into public.staff_users(id,full_name,email,role_code,is_active)
    values(v_new_reviewer,'Rollback Test Independent Reviewer','build678-canary@example.invalid',
      'detailer',true);
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,recipient_email,
       stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values ('RD-B678-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
      'synthetic-rollback@example.invalid',v_session,'pi_build678_rollback',1,
      '{"gift_delivery":{"delivery_status":"pending","recipient_provider_status":"not_submitted","purchaser_copy_status":"not_submitted"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values(v_session,'evt_build678_first','evt_build678_first',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values('evt_build678_first',v_session,'checkout.session.completed',repeat('a',64),'issued');
    perform public.record_gift_issuance_recovery_decision(
      v_decision,v_session,v_owner,v_owner::text,
      'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build678_rollback','cad',repeat('b',64),now());
    perform public.assign_gift_issuance_independent_reviewer(
      '67800000-0000-4000-8000-000000000041'::uuid,v_case,v_decision,
      v_reviewer,v_owner,v_owner::text,now()+interval '48 hours');
    perform public.record_gift_issuance_reviewer_outcome(
      v_old_review,v_case,v_reviewer,'handoff_review_ready','independent_verified',1);
    perform public.record_gift_review_followup_event(
      v_old_handoff,v_case,v_owner,'handoff_receipt_confirmed',
      'owner_receipt_acknowledged',2,v_old_review);
    perform public.record_gift_review_followup_event(
      v_recurrence,v_case,v_owner,'recurrence_opened','evidence_changed',2,v_old_handoff);
    perform public.record_gift_review_followup_event(
      v_followup,v_case,v_owner,'recurrence_followup_recorded',
      'recheck_requested',2,v_recurrence);
    select public.record_gift_recovery_recheck_event(v_assignment,v_case,v_owner,
      'recheck_assigned','independent_recheck_requested',2,v_recurrence,null,
      v_new_reviewer,now()+interval '36 hours') into v_result;
    if v_result->>'event_kind'<>'recheck_assigned' or v_result->>'case_version'<>'3' then
      raise exception 'Build 678 assignment did not atomically reopen case';
    end if;
    begin
      perform public.record_gift_issuance_reviewer_outcome(
        '67800000-0000-4000-8000-000000000042'::uuid,v_case,v_reviewer,
        'handoff_review_ready','independent_verified',3);
      raise exception 'OLD_REVIEWER_NOT_REJECTED';
    exception when others then
      if sqlerrm not like 'Reviewer identity, independence%' then raise; end if;
    end;
    begin
      perform public.record_gift_recovery_recheck_event(
        '67800000-0000-4000-8000-000000000043'::uuid,v_case,v_owner,
        'handoff_refreshed','fresh_handoff_verified',3,v_recurrence,v_old_review,
        v_new_reviewer,null);
      raise exception 'OLD_HANDOFF_NOT_REJECTED';
    exception when others then
      if sqlerrm not like 'Fresh owner handoff%' then raise; end if;
    end;
    perform public.record_gift_issuance_reviewer_outcome(
      v_new_review,v_case,v_new_reviewer,'handoff_review_ready','independent_verified',3);
    select public.record_gift_recovery_recheck_event(v_new_handoff,v_case,v_owner,
      'handoff_refreshed','fresh_handoff_verified',4,v_recurrence,v_new_review,
      v_new_reviewer,null) into v_result;
    if v_result->>'event_kind'<>'handoff_refreshed' or v_result->>'customer_messages_sent'<>'0' then
      raise exception 'Build 678 independently refreshed evidence missing';
    end if;
    select public.record_gift_recovery_recheck_event(v_new_handoff,v_case,v_owner,
      'handoff_refreshed','fresh_handoff_verified',4,v_recurrence,v_new_review,
      v_new_reviewer,null) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 678 replay not idempotent'; end if;
    select public.record_gift_recovery_recheck_event(v_closeout,v_case,v_owner,
      'owner_closeout_recorded','closed_no_dispatch',4,v_recurrence,v_new_handoff,
      v_new_reviewer,null) into v_result;
    if v_result->>'event_kind'<>'owner_closeout_recorded' or
       v_result->>'customer_messages_sent'<>'0' then
      raise exception 'Build 678 internal owner closeout missing';
    end if;
    begin
      perform public.record_gift_recovery_recheck_event(
        '67800000-0000-4000-8000-000000000044'::uuid,v_case,v_owner,
        'owner_closeout_recorded','closed_no_dispatch',4,v_recurrence,v_new_handoff,
        v_new_reviewer,null);
      raise exception 'DUPLICATE_CLOSEOUT_NOT_REJECTED';
    exception when others then
      if sqlerrm not like 'Closeout requires%' then raise; end if;
    end;
    raise exception 'BUILD678_CANARY_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm <> 'BUILD678_CANARY_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists(select 1 from public.staff_users where id=v_new_reviewer)
     or exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_receipts where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_webhook_events where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_recheck_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_followup_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_events where case_id=v_case)
       then raise exception 'Build 678 rollback canary retained synthetic rows'; end if;
end $build678$;
