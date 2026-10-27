-- Build 676 additive acceptance: no retained customer, receipt or staff data.
-- An exception caught by an outer PL/pgSQL block rolls back all records made
-- by this synthetic subtransaction, even its successful ready handoff.
do $build676$
declare
  v_session text := 'cs_test_build676_rollback_only_ABC1234567';
  v_sku text;
  v_owner uuid;
  v_reviewer uuid;
  v_result jsonb;
  v_owner_label text;
  v_due timestamptz := now() + interval '48 hours';
begin
  if exists(select 1 from public.gift_issuance_review_cases
       where stripe_session_id=v_session)
    or exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
    or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session) then
    raise exception 'Existing synthetic Build 676 session requires human reconciliation';
  end if;
  select id into v_owner from public.staff_users where is_active=true and role_code='admin' order by id limit 1;
  select id into v_reviewer from public.staff_users where is_active=true and id<>v_owner order by id limit 1;
  select sku into v_sku from public.gift_products where is_active=true and type='value' limit 1;
  if v_owner is null or v_reviewer is null or v_sku is null then
    raise exception 'Independent reviewer canary prerequisites missing: two staff identities and value SKU required';
  end if;
  v_owner_label := v_owner::text;
  begin
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,
       recipient_email,stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values ('RD-B676-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
      'synthetic-rollback@example.invalid',v_session,'pi_build676_rollback',1,
      '{"gift_delivery":{"delivery_status":"pending","recipient_provider_status":"not_submitted","purchaser_copy_status":"not_submitted"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values (v_session,'evt_build676_first','evt_build676_first',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build676_first',v_session,'checkout.session.completed',repeat('a',64),'issued');
    perform public.record_gift_issuance_recovery_decision(
      '67600000-0000-4000-8000-000000000010'::uuid,v_session,v_owner,v_owner_label,
      'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build676_rollback','cad',repeat('b',64),now()
    );
    begin
      perform public.assign_gift_issuance_independent_reviewer(
        '67600000-0000-4000-8000-000000000019'::uuid,
        '67600000-0000-4000-8000-000000000011'::uuid,
        '67600000-0000-4000-8000-000000000010'::uuid,
        v_owner,v_owner,v_owner_label,v_due
      );
      raise exception 'SELF_REVIEW_NOT_BLOCKED';
    exception when others then
      if sqlerrm not like 'Assigned reviewer must be active%' then raise; end if;
    end;
    select public.assign_gift_issuance_independent_reviewer(
      '67600000-0000-4000-8000-000000000012'::uuid,
      '67600000-0000-4000-8000-000000000011'::uuid,
      '67600000-0000-4000-8000-000000000010'::uuid,
      v_reviewer,v_owner,v_owner_label,v_due
    ) into v_result;
    if v_result->>'kind' <> 'assigned' then raise exception 'Independent reviewer assignment failed'; end if;
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build676_held',v_session,'checkout.session.completed',repeat('c',64),'hold');
    begin
      perform public.record_gift_issuance_reviewer_outcome(
        '67600000-0000-4000-8000-000000000018'::uuid,
        '67600000-0000-4000-8000-000000000011'::uuid,v_reviewer,
        'handoff_review_ready','independent_verified',1
      );
      raise exception 'HELD_DELIVERY_HANDOFF_NOT_BLOCKED';
    exception when others then
      if sqlerrm not like 'Safe delivery review handoff blocked%' then raise; end if;
    end;
    update public.gift_issuance_webhook_events set observed_state='replayed'
      where event_id='evt_build676_held' and stripe_session_id=v_session;
    select public.record_gift_issuance_reviewer_outcome(
      '67600000-0000-4000-8000-000000000013'::uuid,
      '67600000-0000-4000-8000-000000000011'::uuid,v_reviewer,
      'handoff_review_ready','independent_verified',1
    ) into v_result;
    if v_result->>'handoff_disposition' <> 'delivery_review_only'
       or v_result->>'customer_messages_sent' <> '0' then
      raise exception 'Independent ready handoff mutated customer messaging';
    end if;
    select public.record_gift_issuance_reviewer_outcome(
      '67600000-0000-4000-8000-000000000013'::uuid,
      '67600000-0000-4000-8000-000000000011'::uuid,v_reviewer,
      'handoff_review_ready','independent_verified',1
    ) into v_result;
    if v_result->>'idempotent' <> 'true' then raise exception 'Review replay was not idempotent'; end if;
    raise exception 'BUILD676_CANARY_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm <> 'BUILD676_CANARY_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists(select 1 from public.gift_certificates where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_receipts where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_webhook_events where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_recovery_decisions where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_cases where stripe_session_id=v_session)
     or exists(select 1 from public.gift_issuance_review_events where
       case_id='67600000-0000-4000-8000-000000000011'::uuid) then
    raise exception 'Build 676 rollback canary leaked synthetic state';
  end if;
end $build676$;
