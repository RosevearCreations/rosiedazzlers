-- Follow-up to the already-applied Build 678 RPC definition. B676 reviewer
-- events default to transaction-start now(), whereas B678 assignments use
-- clock_timestamp(). Comparing their timestamps is not a reliable ordering
-- proof inside one transaction. A single B676 ready finding increments the
-- case version exactly once after the B678 assignment, so enforce that.
do $build678_fix$
declare
  v_source text;
  v_old text:='or v_review.created_at <= v_last.created_at';
  v_new text:='or v_case.version <> v_last.case_version + 1';
begin
  select pg_catalog.pg_get_functiondef(
    'public.record_gift_recovery_recheck_event(uuid,uuid,uuid,text,text,integer,uuid,uuid,uuid,timestamptz)'::regprocedure)
    into v_source;
  if pg_catalog.strpos(v_source,v_old)=0 then
    -- Fresh installs already carry this fix in the original Build 678 file.
    if pg_catalog.strpos(v_source,v_new)=0 then
      raise exception 'Build 678 reviewer evidence guard is not recognized';
    end if;
  else
    execute pg_catalog.replace(v_source,v_old,v_new);
  end if;
end $build678_fix$;
