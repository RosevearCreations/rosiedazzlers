-- Build 677: disposable paid-issuance-style synthetic evidence. Any writes
-- made during trial are rolled back within the inner exception block.
do $build677$
declare
  v_session text:='cs_test_build677_rollback_only_ABC1234567';
  v_sku text;
  v_owner uuid;
  v_reviewer uuid;
  v_result jsonb;
  v_case uuid:='67700000-0000-4000-8000-000000000011'::uuid;
  v_decision uuid:='67700000-0000-4000-8000-000000000010'::uuid;
  v_review uuid:='67700000-0000-4000-8000-000000000013'::uuid;
  v_escalation uuid:='67700000-0000-4000-8000-000000000014'::uuid;
  v_recurrence uuid:='67700000-0000-4000-8000-000000000015'::uuid;
  v_receipt uuid:='67700000-0000-4000-8000-000000000016'::uuid;
  v_followup uuid:='67700000-0000-4000-8000-000000000017'::uuid;
begin
  if exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.gift_certificates where stripe_session_id=v_session) then
    raise exception 'Existing Build 677 canary evidence requires manual reconciliation';
  end if;
  select id into v_owner from public.staff_users where is_active=true and role_code='admin' order by id limit 1;
  select id into v_reviewer from public.staff_users where is_active=true and id<>v_owner order by id limit 1;
  select sku into v_sku from public.gift_products where is_active=true and type='value' limit 1;
  if v_owner is null or v_reviewer is null or v_sku is null then
    raise exception 'Build 677 canary requires existing owner, independent reviewer, value SKU';
  end if;
  begin
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,recipient_email,
       stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values ('RD-B677-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
      'synthetic-rollback@example.invalid',v_session,'pi_build677_rollback',1,
      '{"gift_delivery":{"delivery_status":"pending","recipient_provider_status":"not_submitted","purchaser_copy_status":"not_submitted"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values (v_session,'evt_build677_first','evt_build677_first',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build677_first',v_session,'checkout.session.completed',repeat('a',64),'issued');
    perform public.record_gift_issuance_recovery_decision(
      v_decision,v_session,v_owner,v_owner::text,
      'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build677_rollback','cad',repeat('b',64),now());
    select public.assign_gift_issuance_independent_reviewer(
      '67700000-0000-4000-8000-000000000012'::uuid,v_case,v_decision,
      v_reviewer,v_owner,v_owner::text,now()+interval '48 hours') into v_result;
    if v_result->>'kind'<>'assigned' then raise exception 'Build 677 assignment failed'; end if;
    -- Trial-only clock adjustment to simulate a genuine missed reviewer due time.
    update public.gift_issuance_review_cases
      set due_at=now()-interval '3 hours',updated_at=now() where id=v_case;
    select public.record_gift_review_followup_event(
      v_escalation,v_case,v_owner,'overdue_escalated','reviewer_overdue',1,null) into v_result;
    if v_result->>'event_kind'<>'overdue_escalated' or v_result->>'customer_messages_sent'<>'0'
      then raise exception 'Build 677 overdue escalation evidence missing'; end if;
    select public.record_gift_review_followup_event(
      v_escalation,v_case,v_owner,'overdue_escalated','reviewer_overdue',1,null) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 677 overdue event replay failed'; end if;
    begin
      perform public.record_gift_review_followup_event(
        '67700000-0000-4000-8000-000000000018'::uuid,
        v_case,v_owner,'overdue_escalated','reviewer_overdue',1,null);
      raise exception 'DUPLICATE_ESCALATION_NOT_BLOCKED';
    exception when others then
      if sqlerrm not like 'Overdue escalation requires%' then raise; end if;
    end;
    -- A refreshed independent reviewer decision changes the case version.
    update public.gift_issuance_review_cases
      set due_at=now()+interval '24 hours',version=version+1,updated_at=now()
      where id=v_case;
    select public.record_gift_issuance_reviewer_outcome(
      v_review,v_case,v_reviewer,'handoff_review_ready','independent_verified',2) into v_result;
    if v_result->>'handoff_disposition'<>'delivery_review_only' then
      raise exception 'Build 677 independent ready state failed';
    end if;
    select public.record_gift_review_followup_event(
      v_receipt,v_case,v_owner,'handoff_receipt_confirmed',
      'owner_receipt_acknowledged',3,v_review) into v_result;
    if v_result->>'event_kind'<>'handoff_receipt_confirmed'
       or v_result->>'customer_messages_sent'<>'0' then
      raise exception 'Build 677 safe receipt not recorded';
    end if;
    select public.record_gift_review_followup_event(
      v_receipt,v_case,v_owner,'handoff_receipt_confirmed',
      'owner_receipt_acknowledged',3,v_review) into v_result;
    if v_result->>'idempotent'<>'true' then raise exception 'Build 677 receipt replay failed'; end if;
    begin
      perform public.record_gift_review_followup_event(
        '67700000-0000-4000-8000-000000000019'::uuid,
        v_case,v_owner,'handoff_receipt_confirmed','owner_receipt_acknowledged',3,v_review);
      raise exception 'DUPLICATE_HANDOFF_RECEIPT_NOT_BLOCKED';
    exception when others then
      if sqlerrm not like 'Delivery-review handoff receipt blocked%' then raise; end if;
    end;
    perform public.record_gift_review_followup_event(
      '67700000-0000-4000-8000-000000000020'::uuid,
      v_case,v_owner,'recurrence_opened','evidence_changed',3,v_receipt);
    begin
      perform public.record_gift_review_followup_event(
        '67700000-0000-4000-8000-000000000021'::uuid,
        v_case,v_owner,'handoff_receipt_confirmed','owner_receipt_acknowledged',3,v_review);
      raise exception 'RECURRENCE_HANDOFF_HOLD_NOT_ENFORCED';
    exception when others then
      if sqlerrm not like 'Delivery-review handoff receipt blocked%' then raise; end if;
    end;
    select public.record_gift_review_followup_event(
      '67700000-0000-4000-8000-000000000022'::uuid,
      v_case,v_owner,'recurrence_followup_recorded','recheck_requested',3,
      '67700000-0000-4000-8000-000000000020'::uuid) into v_result;
    if v_result->>'event_kind'<>'recurrence_followup_recorded' then
      raise exception 'Build 677 recurrence follow-up evidence not recorded';
    end if;
    raise exception 'BUILD677_CANARY_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm <> 'BUILD677_CANARY_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_receipts where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_webhook_events where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_followup_events where case_id=v_case)
     or exists(select 1 from public.gift_issuance_review_events where case_id=v_case)
     then raise exception 'Build 677 rollback canary retained synthetic rows'; end if;
end $build677$;
