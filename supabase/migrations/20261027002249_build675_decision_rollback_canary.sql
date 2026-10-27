-- Build 675 live schema acceptance. Every synthetic record exists only in the
-- nested PL/pgSQL subtransaction that is deliberately rolled back. No card,
-- email, certificate, ledger entry, payment or actual webhook is dispatched.
do $build675$
declare
  v_session text := 'cs_test_build675_rollback_only_ABC1234567';
  v_sku text;
  v_result jsonb;
begin
  if exists (select 1 from public.gift_certificates where stripe_session_id = v_session)
     or exists (select 1 from public.gift_issuance_receipts where stripe_session_id = v_session)
     or exists (select 1 from public.gift_issuance_recovery_decisions where stripe_session_id = v_session) then
    raise exception 'Synthetic rollback probe already exists; operator review required';
  end if;
  begin
    select sku into v_sku from public.gift_products where type = 'value' and is_active = true limit 1;
    if v_sku is null then raise exception 'No active gift SKU available for rolled-back trial'; end if;
    insert into public.gift_certificates
      (code,sku,type,currency,face_value_cents,remaining_cents,status,
       stripe_session_id,stripe_payment_intent,checkout_line_number,purchase_context)
    values
      ('RD-B675-ROLLBACK',v_sku,'value','CAD',10000,10000,'active',
       v_session,'pi_build675_rollback',1,'{"gift_delivery":{"delivery_status":"pending"}}'::jsonb);
    insert into public.gift_issuance_receipts
      (stripe_session_id,first_event_id,last_event_id,payload_digest,expected_count,issued_count,state)
    values (v_session,'evt_build675_rollback','evt_build675_rollback',repeat('a',64),1,1,'issued');
    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build675_rollback',v_session,'checkout.session.completed',repeat('a',64),'issued');

    select public.record_gift_issuance_recovery_decision(
      '67500000-0000-4000-8000-000000000001'::uuid,v_session,null,'db_rollback_probe',
      'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build675_rollback','cad',repeat('b',64),now()
    ) into v_result;
    if v_result->>'action' <> 'close_verified_no_action' then raise exception 'Unexpected closeout record'; end if;
    select public.record_gift_issuance_recovery_decision(
      '67500000-0000-4000-8000-000000000001'::uuid,v_session,null,'db_rollback_probe',
      'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
      false,1,10000,'pi_build675_rollback','cad',repeat('b',64),now()
    ) into v_result;
    if v_result->>'idempotent' <> 'true' then raise exception 'Decision replay not idempotent'; end if;

    insert into public.gift_issuance_webhook_events
      (event_id,stripe_session_id,event_type,payload_digest,observed_state)
    values ('evt_build675_held',v_session,'checkout.session.completed',repeat('c',64),'hold');
    begin
      perform public.record_gift_issuance_recovery_decision(
        '67500000-0000-4000-8000-000000000002'::uuid,v_session,null,'db_rollback_probe',
        'close_verified_no_action','verified_no_duplicate','paid_verified','paid','complete',
        false,1,10000,'pi_build675_rollback','cad',repeat('c',64),now()
      );
      raise exception 'HOLD_NOT_BLOCKED';
    exception when others then
      if sqlerrm not like 'Closeout blocked:%' then raise; end if;
    end;
    -- Force this inner block's inserts, even the successful first decision,
    -- to roll back as a single savepoint before finishing this migration.
    raise exception 'BUILD675_CANARY_EXPECTED_ROLLBACK';
  exception when others then
    if sqlerrm <> 'BUILD675_CANARY_EXPECTED_ROLLBACK' then raise; end if;
  end;
  if exists (select 1 from public.gift_certificates where stripe_session_id = v_session)
     or exists (select 1 from public.gift_issuance_receipts where stripe_session_id = v_session)
     or exists (select 1 from public.gift_issuance_webhook_events where stripe_session_id = v_session)
     or exists (select 1 from public.gift_issuance_recovery_decisions where stripe_session_id = v_session) then
    raise exception 'Build 675 canary rollback leaked synthetic state';
  end if;
end $build675$;
