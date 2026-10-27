-- Build 683 follow-up: keep the owner's recorded renewal reason pinned through
-- the separate auditor and owner acknowledgment stages. A newly reopened
-- recurrence or changed source still supersedes it and fails closed.
-- The function definition is modified only when the exact expected source is
-- present, avoiding a destructive drop/recreate or any expanded privileges.
do $build683_reason_fix$
declare
  v_signature regprocedure := 'public.record_gift_hold_renewal_event(uuid,uuid,uuid,uuid,uuid,text,text,uuid,text,text,text,integer,bigint,text,timestamptz)'::regprocedure;
  v_definition text;
  v_old text := $old$  if v_recurring then v_reason:='recurrence_reopened';
  elsif not v_source_current or v_case.status<>'ready_for_delivery_review'
    then v_reason:='source_superseded';
  elsif v_age>=120 then v_reason:='followup_proof_aged';$old$;
  v_new text := $new$  if v_recurring then v_reason:='recurrence_reopened';
  elsif not v_source_current or v_case.status<>'ready_for_delivery_review'
    then v_reason:='source_superseded';
  elsif v_last.id is not null and v_last.event_kind in
    ('owner_renewal_requested','independent_recurrence_reassessed') then
    v_reason:=v_last.reason;
  elsif v_age>=120 then v_reason:='followup_proof_aged';$new$;
begin
  select pg_catalog.pg_get_functiondef(v_signature) into v_definition;
  if v_definition is null or pg_catalog.strpos(v_definition,v_old)=0 or
     pg_catalog.strpos(pg_catalog.substr(v_definition,
       pg_catalog.strpos(v_definition,v_old)+pg_catalog.length(v_old)),v_old)>0
  then raise exception 'Build 683 renewal source changed; do not rewrite an unknown function'; end if;
  execute pg_catalog.replace(v_definition,v_old,v_new);
end $build683_reason_fix$;
