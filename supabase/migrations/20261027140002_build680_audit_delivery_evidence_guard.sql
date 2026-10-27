-- Follow-up for databases where the initial Build 680 migration was applied.
-- Reconcile late recipient/copy delivery failures, receipt changes, uniqueness
-- and certificate count with the source-linked Build 679 audit snapshot.
do $build680_delivery_guard$
declare
  v_source text;
  v_old_a text:=$old$or purchase_context #>> '{gift_delivery,delivery_status}'
          in ('failed','review_required','processing')) into v_count,v_bad$old$;
  v_new_a text:=$new$or purchase_context #>> '{gift_delivery,delivery_status}'
          in ('failed','review_required','processing')
        or purchase_context #>> '{gift_delivery,recipient_provider_status}'='failed'
        or purchase_context #>> '{gift_delivery,purchaser_copy_status}'='failed')
        into v_count,v_bad$new$;
  v_old_b text:=$old$or v_count<>p_expected_count or v_count<1 or v_bad<>0 or v_held<>0
         or (select count(distinct checkout_line_number) from public.gift_certificates
           where stripe_session_id=v_case.stripe_session_id)<>v_count then$old$;
  v_new_b text:=$new$or v_count<>p_expected_count or v_count<1 or v_count>100
         or v_audit.certificate_count<>v_count
         or v_audit.receipt_last_seen_at is distinct from v_receipt.last_seen_at
         or v_bad<>0 or v_held<>0
         or (select count(distinct checkout_line_number) from public.gift_certificates
           where stripe_session_id=v_case.stripe_session_id)<>v_count
         or (select coalesce(max(checkout_line_number),0) from public.gift_certificates
           where stripe_session_id=v_case.stripe_session_id)<>v_count then$new$;
begin
  select pg_catalog.pg_get_functiondef('public.record_gift_audit_alert_event(
    uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,text,text,text,text,integer,bigint,text,timestamptz)'::regprocedure)
    into v_source;
  if pg_catalog.strpos(v_source,v_old_a)>0 then
    v_source:=pg_catalog.replace(v_source,v_old_a,v_new_a);
  elsif pg_catalog.strpos(v_source,v_new_a)=0 then
    raise exception 'Unknown Build 680 delivery state guard';
  end if;
  if pg_catalog.strpos(v_source,v_old_b)>0 then
    v_source:=pg_catalog.replace(v_source,v_old_b,v_new_b);
  elsif pg_catalog.strpos(v_source,v_new_b)=0 then
    raise exception 'Unknown Build 680 certificate snapshot guard';
  end if;
  execute v_source;
end;
$build680_delivery_guard$;
