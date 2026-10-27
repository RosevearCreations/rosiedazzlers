-- Build 679: synthetic full-chain test, with every row rolled back.
-- Never issue real certificates, contact recipients, or create staff identities.
do $build679$
declare
  v_session text:='cs_test_build679_rollback_only_ABC1234567';
  v_sku text;
  v_owner uuid;
  v_old_reviewer uuid;
  v_rechecker uuid:='67900000-0000-4000-8000-000000000030';
  v_auditor uuid:='67900000-0000-4000-8000-000000000031';
  v_case uuid:='67900000-0000-4000-8000-000000000032';
  v_decision uuid:='67900000-0000-4000-8000-000000000033';
  v_old_review uuid:='67900000-0000-4000-8000-000000000034';
  v_old_handoff uuid:='67900000-0000-4000-8000-000000000035';
  v_recurrence uuid:='67900000-0000-4000-8000-000000000036';
  v_followup uuid:='67900000-0000-4000-8000-000000000037';
  v_assignment uuid:='67900000-0000-4000-8000-000000000038';
  v_new_review uuid:='67900000-0000-4000-8000-000000000039';
  v_handoff uuid:='67900000-0000-4000-8000-000000000040';
  v_closeout uuid:='67900000-0000-4000-8000-000000000041';
  v_watch uuid:='67900000-0000-4000-8000-000000000042';
  v_renewal uuid:='67900000-0000-4000-8000-000000000043';
  v_audit uuid:='67900000-0000-4000-8000-000000000044';
  v_ack uuid:='67900000-0000-4000-8000-000000000045';
  v_checked timestamptz;
  v_result jsonb;
begin
  if exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.staff_users where id in (v_rechecker,v_auditor)) then
    raise exception 'Build 679 synthetic test collided with existing records';
  end if;
  select id into v_owner from public.staff_users where is_active=true
    and role_code='admin' order by id limit 1;
  select id into v_old_reviewer from public.staff_users where is_active=true
    and role_code in ('senior_detailer','detailer') order by id limit 1;
  select sku into v_sku from public.gift_products where is_active=true and type='value' limit 1;
  if v_owner is null or v_old_reviewer is null or v_sku is null then
    raise exception 'Build 679 requires real role anchors and a test value SKU';
  end if;
  begin
    insert into public.staff_users(id,full_name,email,role_code,is_active)
    values (v_rechecker,'Rollback Recheck Reviewer','build679-rechecker@example.invalid','detailer',true),
           (v_auditor,'Rollback Separate Auditor','build679-auditor@example.invalid','detailer',true);
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,recipient_email,
       stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values ('RD-B679-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
      'synthetic-rollback@example.invalid',v_session,'pi_build679_rollback',1,
      '{"gift_delivery":{"delivery_status":"pending","recipient_provider_status":"not_submitted","purchaser_copy_status":"not_submitted"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values (v_session,'evt_build679_first','evt_build679_first',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build679_first',v_session,'checkout.session.completed',repeat('a',64),'issued');
    perform public.record_gift_issuance_recovery_decision(
      v_decision,v_session,v_owner,v_owner::text,'close_verified_no_action',
      'verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build679_rollback','cad',repeat('b',64),now());
    perform public.assign_gift_issuance_independent_reviewer(
      '67900000-0000-4000-8000-000000000046'::uuid,v_case,v_decision,
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

    select public.record_gift_closeout_audit_event(v_watch,v_case,v_closeout,
      v_owner,v_auditor,'watch_opened',null,null,null,null,null,null,null,null)
      into v_result;
    if v_result->>'event_kind'<>'watch_opened' then raise exception 'Watch missing'; end if;
    select public.record_gift_closeout_audit_event(v_watch,v_case,v_closeout,
      v_owner,v_auditor,'watch_opened',null,null,null,null,null,null,null,null)
      into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Watch replay failed'; end if;
    begin
      perform public.record_gift_closeout_audit_event(
        '67900000-0000-4000-8000-000000000047'::uuid,v_case,v_closeout,
        v_owner,v_rechecker,'watch_opened',null,null,null,null,null,null,null,null);
      raise exception 'DUPLICATE_WATCH_ACCEPTED';
    exception when others then
      if sqlerrm not like 'Watch requires%' then raise; end if;
    end;
    begin
      perform public.record_gift_closeout_audit_event(
        '67900000-0000-4000-8000-000000000048'::uuid,v_case,v_closeout,
        v_owner,v_auditor,'evidence_renewed',v_watch,'paid_verified','pi_build679_rollback',
        'cad',1,10000,repeat('c',64),now()-interval '10 minutes');
      raise exception 'STALE_PROOF_ACCEPTED';
    exception when others then
      if sqlerrm not like 'Stale, mismatched%' then raise; end if;
    end;
    v_checked:=clock_timestamp();
    select public.record_gift_closeout_audit_event(v_renewal,v_case,v_closeout,
      v_owner,v_auditor,'evidence_renewed',v_watch,'paid_verified','pi_build679_rollback',
      'cad',1,10000,repeat('c',64),v_checked) into v_result;
    if v_result->>'event_kind'<>'evidence_renewed' then raise exception 'Renewal missing'; end if;
    begin
      perform public.record_gift_closeout_audit_event(
        '67900000-0000-4000-8000-000000000049'::uuid,v_case,v_closeout,
        v_rechecker,v_auditor,'independent_audit_recorded',v_renewal,'paid_verified',
        'pi_build679_rollback','cad',1,10000,repeat('c',64),clock_timestamp());
      raise exception 'SAME_REVIEWER_AUDITED_SELF';
    exception when others then
      if sqlerrm not like 'Independent auditor%' then raise; end if;
    end;
    select public.record_gift_closeout_audit_event(v_audit,v_case,v_closeout,
      v_auditor,v_auditor,'independent_audit_recorded',v_renewal,'paid_verified',
      'pi_build679_rollback','cad',1,10000,repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'event_kind'<>'independent_audit_recorded' then raise exception 'Audit missing'; end if;
    select public.record_gift_closeout_audit_event(v_ack,v_case,v_closeout,
      v_owner,v_auditor,'owner_audit_acknowledged',v_audit,'paid_verified',
      'pi_build679_rollback','cad',1,10000,repeat('c',64),clock_timestamp()) into v_result;
    if v_result->>'customer_messages_sent'<>'0' or v_result->>'payment_mutations'<>'0'
       or v_result->>'gift_balance_mutations'<>'0' then
      raise exception 'Unexpected customer mutation in audit';
    end if;
    begin
      update public.gift_issuance_closeout_audit_events
        set reason_code='post_closeout_watch' where id=v_ack;
      raise exception 'IMMUTABLE_AUDIT_UPDATED';
    exception when others then
      if sqlerrm not like 'Gift closeout audit evidence is immutable%' then raise; end if;
    end;
    raise exception 'BUILD679_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm<>'BUILD679_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists(select 1 from public.staff_users where id in (v_rechecker,v_auditor))
     or exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_cases where id=v_case)
     or exists(select 1 from public.gift_issuance_closeout_audit_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_recheck_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_followup_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_receipts where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_webhook_events where stripe_session_id=v_session) then
    raise exception 'Build 679 synthetic audit records survived rollback';
  end if;
end $build679$;
