-- Rosie Dazzlers Build 240
-- Transactional booking/project inventory posting, reviewed reversal, and reservation availability.
-- Apply after Build 239. Test in staging before production.
begin;

-- Inventory reservations support thousandths; widen live quantity and movement evidence to the same safe precision.
alter table public.catalog_inventory_items
  alter column qty_on_hand type numeric(14,3) using round(qty_on_hand::numeric,3),
  alter column reorder_point type numeric(14,3) using round(reorder_point::numeric,3),
  alter column reorder_qty type numeric(14,3) using round(reorder_qty::numeric,3);
alter table public.catalog_inventory_movements
  alter column qty_delta type numeric(14,3) using round(qty_delta::numeric,3),
  alter column previous_qty type numeric(14,3) using round(previous_qty::numeric,3),
  alter column new_qty type numeric(14,3) using round(new_qty::numeric,3);

alter table public.catalog_inventory_movements
  drop constraint if exists catalog_inventory_movements_movement_type_check;
alter table public.catalog_inventory_movements
  add constraint catalog_inventory_movements_movement_type_check
  check (movement_type in ('adjustment','job_use','project_use','receive','recount','waste','return'));

alter table public.catalog_inventory_movements
  add column if not exists source_kind text null
    check (source_kind is null or source_kind in ('booking','creative_project','manual','merge','bulk')),
  add column if not exists source_reference_id uuid null,
  add column if not exists posting_batch_id uuid null,
  add column if not exists reversal_of_movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  add column if not exists is_reversed boolean not null default false,
  add column if not exists reversed_at timestamptz null,
  add column if not exists reversed_by_staff_email text null,
  add column if not exists reversal_reason text null;

create table if not exists public.catalog_inventory_posting_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_kind text not null check (source_kind in ('booking','creative_project')),
  source_reference_id uuid not null,
  booking_id uuid null references public.bookings(id) on delete set null,
  project_id uuid null references public.creative_projects(id) on delete set null,
  status text not null default 'posted' check (status in ('posted','reversed','failed')),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 180),
  reason text not null check (char_length(reason) between 8 and 1200),
  actor_staff_email text null,
  row_count integer not null default 0 check (row_count >= 0),
  total_quantity numeric(14,3) not null default 0 check (total_quantity >= 0),
  accounting_status text not null default 'pending'
    check (accounting_status in ('pending','posted','partial','failed','not_required','reversal_review')),
  accounting_note text null,
  reversed_at timestamptz null,
  reversed_by_staff_email text null,
  reversal_reason text null
);

create table if not exists public.catalog_inventory_posting_rows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  batch_id uuid not null references public.catalog_inventory_posting_batches(id) on delete cascade,
  inventory_item_id uuid null references public.catalog_inventory_items(id) on delete set null,
  item_key text not null,
  item_name text not null,
  reservation_id uuid null references public.creative_project_inventory_reservations(id) on delete set null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_label text null,
  unit_cost_cents integer null,
  previous_qty numeric(14,3) not null,
  new_qty numeric(14,3) not null,
  movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  reversal_movement_id uuid null references public.catalog_inventory_movements(id) on delete set null,
  status text not null default 'posted' check (status in ('posted','reversed')),
  unique(batch_id,item_key)
);

alter table public.catalog_inventory_movements
  drop constraint if exists catalog_inventory_movements_posting_batch_id_fkey;
alter table public.catalog_inventory_movements
  add constraint catalog_inventory_movements_posting_batch_id_fkey
  foreign key (posting_batch_id) references public.catalog_inventory_posting_batches(id) on delete set null;

alter table public.creative_project_inventory_reservations
  drop constraint if exists creative_project_inventory_reservations_inventory_mutated_check;
alter table public.creative_project_inventory_reservations
  add column if not exists posting_batch_id uuid null references public.catalog_inventory_posting_batches(id) on delete set null,
  add column if not exists reversed_at timestamptz null,
  add column if not exists reversed_by_staff_email text null,
  add column if not exists reversal_reason text null;

create index if not exists catalog_inventory_posting_batches_source_idx
  on public.catalog_inventory_posting_batches(source_kind,source_reference_id,created_at desc);
create index if not exists catalog_inventory_posting_batches_status_idx
  on public.catalog_inventory_posting_batches(status,created_at desc);
create index if not exists catalog_inventory_posting_rows_batch_idx
  on public.catalog_inventory_posting_rows(batch_id,created_at);
create index if not exists catalog_inventory_posting_rows_item_idx
  on public.catalog_inventory_posting_rows(item_key,created_at desc);
create index if not exists catalog_inventory_movements_posting_batch_idx
  on public.catalog_inventory_movements(posting_batch_id,created_at desc);
create index if not exists catalog_inventory_movements_reversal_idx
  on public.catalog_inventory_movements(reversal_of_movement_id);

alter table public.catalog_inventory_posting_batches enable row level security;
alter table public.catalog_inventory_posting_rows enable row level security;
revoke all privileges on table public.catalog_inventory_posting_batches,public.catalog_inventory_posting_rows from public,anon,authenticated;
grant all privileges on table public.catalog_inventory_posting_batches,public.catalog_inventory_posting_rows to service_role;

create or replace function public.admin_catalog_inventory_post(
  p_source_kind text,
  p_source_reference_id uuid,
  p_lines jsonb,
  p_actor_email text,
  p_reason text,
  p_idempotency_key text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line jsonb;
  v_item public.catalog_inventory_items%rowtype;
  v_item_key text;
  v_qty numeric(14,3);
  v_reservation_id uuid;
  v_reservation public.creative_project_inventory_reservations%rowtype;
  v_batch public.catalog_inventory_posting_batches%rowtype;
  v_batch_id uuid;
  v_movement_id uuid;
  v_previous numeric(14,3);
  v_new numeric(14,3);
  v_total numeric(14,3) := 0;
  v_count integer := 0;
  v_preview jsonb := '[]'::jsonb;
  v_existing jsonb;
  v_duplicate_count integer;
begin
  if p_source_kind not in ('booking','creative_project') then
    raise exception 'source_kind must be booking or creative_project.' using errcode='22023';
  end if;
  if p_source_reference_id is null then
    raise exception 'A booking or project reference is required.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a posting reason with at least 8 characters.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_idempotency_key,''))) < 8 then
    raise exception 'A stable idempotency key is required.' using errcode='22023';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'At least one inventory line is required.' using errcode='22023';
  end if;
  if jsonb_array_length(p_lines) > 100 then
    raise exception 'A maximum of 100 inventory lines can be posted at once.' using errcode='22023';
  end if;

  if p_source_kind='booking' then
    perform 1 from public.bookings where id=p_source_reference_id;
    if not found then raise exception 'Booking was not found.' using errcode='P0002'; end if;
  else
    perform 1 from public.creative_projects where id=p_source_reference_id;
    if not found then raise exception 'Creative project was not found.' using errcode='P0002'; end if;
  end if;

  if not p_dry_run then
    select to_jsonb(b) into v_existing
    from public.catalog_inventory_posting_batches b
    where b.idempotency_key=trim(p_idempotency_key);
    if v_existing is not null then
      return jsonb_build_object('ok',true,'dry_run',false,'idempotent_replay',true,'batch',v_existing);
    end if;
  end if;

  select count(*) into v_duplicate_count
  from (
    select trim(value->>'item_key') item_key
    from jsonb_array_elements(p_lines)
    group by trim(value->>'item_key')
    having count(*) > 1
  ) duplicates;
  if v_duplicate_count > 0 then
    raise exception 'Combine duplicate item keys into one line before posting.' using errcode='22023';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_item_key := trim(coalesce(v_line->>'item_key',''));
    v_qty := round(coalesce(nullif(v_line->>'quantity','')::numeric,0),3);
    v_reservation_id := nullif(trim(coalesce(v_line->>'reservation_id','')),'')::uuid;
    if v_item_key='' or v_qty<=0 then
      raise exception 'Every posting line requires an item key and quantity greater than zero.' using errcode='22023';
    end if;

    select * into v_item from public.catalog_inventory_items where item_key=v_item_key for update;
    if not found then raise exception 'Inventory item % was not found.',v_item_key using errcode='P0002'; end if;
    if not v_item.is_active then raise exception 'Inventory item % is archived.',v_item_key using errcode='22023'; end if;
    if coalesce(v_item.qty_on_hand,0) < v_qty then
      raise exception 'Insufficient stock for %: requested %, available %.',v_item_key,v_qty,coalesce(v_item.qty_on_hand,0) using errcode='22023';
    end if;

    if p_source_kind='creative_project' then
      if v_reservation_id is null then
        raise exception 'Creative project lines require a reviewed reservation ID.' using errcode='22023';
      end if;
      select * into v_reservation
      from public.creative_project_inventory_reservations
      where id=v_reservation_id and project_id=p_source_reference_id and inventory_item_id=v_item.id
      for update;
      if not found then raise exception 'Reservation does not match the selected project and inventory item.' using errcode='22023'; end if;
      if v_reservation.status not in ('reserved','reviewed') or v_reservation.inventory_mutated then
        raise exception 'Reservation % is not ready for posting.',v_reservation_id using errcode='22023';
      end if;
      if v_qty <> round(v_reservation.quantity,3) then
        raise exception 'Posted quantity must equal the reviewed reservation quantity; edit and review the reservation first.' using errcode='22023';
      end if;
    end if;

    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous-v_qty,3);
    v_total := v_total+v_qty;
    v_count := v_count+1;
    v_preview := v_preview || jsonb_build_array(jsonb_build_object(
      'item_key',v_item.item_key,'item_name',v_item.name,'quantity',v_qty,
      'previous_qty',v_previous,'new_qty',v_new,'unit_label',v_item.unit_label,
      'unit_cost_cents',v_item.cost_cents,'reservation_id',v_reservation_id,
      'available',true
    ));
  end loop;

  if p_dry_run then
    return jsonb_build_object(
      'ok',true,'dry_run',true,'source_kind',p_source_kind,
      'source_reference_id',p_source_reference_id,'row_count',v_count,
      'total_quantity',round(v_total,3),'lines',v_preview
    );
  end if;

  insert into public.catalog_inventory_posting_batches(
    source_kind,source_reference_id,booking_id,project_id,status,idempotency_key,
    reason,actor_staff_email,row_count,total_quantity,accounting_status
  ) values(
    p_source_kind,p_source_reference_id,
    case when p_source_kind='booking' then p_source_reference_id else null end,
    case when p_source_kind='creative_project' then p_source_reference_id else null end,
    'posted',trim(p_idempotency_key),trim(p_reason),nullif(trim(coalesce(p_actor_email,'')),''),
    v_count,round(v_total,3),case when p_source_kind='booking' then 'pending' else 'not_required' end
  ) returning * into v_batch;
  v_batch_id := v_batch.id;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_item_key := trim(v_line->>'item_key');
    v_qty := round((v_line->>'quantity')::numeric,3);
    v_reservation_id := nullif(trim(coalesce(v_line->>'reservation_id','')),'')::uuid;
    select * into v_item from public.catalog_inventory_items where item_key=v_item_key for update;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous-v_qty,3);

    update public.catalog_inventory_items
      set qty_on_hand=v_new,updated_at=now()
      where id=v_item.id;

    insert into public.catalog_inventory_movements(
      item_id,item_key,booking_id,movement_type,qty_delta,previous_qty,new_qty,
      unit_label,note,actor_name,source_kind,source_reference_id,posting_batch_id
    ) values(
      v_item.id,v_item.item_key,
      case when p_source_kind='booking' then p_source_reference_id else null end,
      case when p_source_kind='booking' then 'job_use' else 'project_use' end,
      -v_qty,v_previous,v_new,v_item.unit_label,trim(p_reason),
      nullif(trim(coalesce(p_actor_email,'')),''),p_source_kind,p_source_reference_id,v_batch_id
    ) returning id into v_movement_id;

    insert into public.catalog_inventory_posting_rows(
      batch_id,inventory_item_id,item_key,item_name,reservation_id,quantity,unit_label,
      unit_cost_cents,previous_qty,new_qty,movement_id,status
    ) values(
      v_batch_id,v_item.id,v_item.item_key,v_item.name,v_reservation_id,v_qty,v_item.unit_label,
      v_item.cost_cents,v_previous,v_new,v_movement_id,'posted'
    );

    if p_source_kind='creative_project' and v_reservation_id is not null then
      update public.creative_project_inventory_reservations
        set status='posted',inventory_mutated=true,posted_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
            posted_at=now(),posting_batch_id=v_batch_id,updated_at=now(),
            reversed_at=null,reversed_by_staff_email=null,reversal_reason=null
        where id=v_reservation_id;
    end if;
  end loop;

  return jsonb_build_object(
    'ok',true,'dry_run',false,'idempotent_replay',false,
    'batch',to_jsonb(v_batch),'lines',v_preview
  );
end;
$$;

create or replace function public.admin_catalog_inventory_post_reverse(
  p_batch_id uuid,
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.catalog_inventory_posting_batches%rowtype;
  v_row public.catalog_inventory_posting_rows%rowtype;
  v_item public.catalog_inventory_items%rowtype;
  v_previous numeric(14,3);
  v_new numeric(14,3);
  v_reversal_id uuid;
  v_preview jsonb := '[]'::jsonb;
begin
  if p_batch_id is null then raise exception 'A posting batch is required.' using errcode='22023'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a reversal reason with at least 8 characters.' using errcode='22023';
  end if;
  select * into v_batch from public.catalog_inventory_posting_batches where id=p_batch_id for update;
  if not found then raise exception 'Posting batch was not found.' using errcode='P0002'; end if;
  if v_batch.status='reversed' then
    return jsonb_build_object('ok',true,'dry_run',p_dry_run,'already_reversed',true,'batch',to_jsonb(v_batch));
  end if;
  if v_batch.status<>'posted' then raise exception 'Only posted batches can be reversed.' using errcode='22023'; end if;

  for v_row in select * from public.catalog_inventory_posting_rows where batch_id=p_batch_id order by created_at,id for update
  loop
    select * into v_item from public.catalog_inventory_items where id=v_row.inventory_item_id for update;
    if not found then raise exception 'Inventory item % is unavailable for reversal.',v_row.item_key using errcode='P0002'; end if;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous+v_row.quantity,3);
    v_preview := v_preview || jsonb_build_array(jsonb_build_object(
      'item_key',v_row.item_key,'item_name',v_row.item_name,'quantity',v_row.quantity,
      'previous_qty',v_previous,'new_qty',v_new,'unit_label',v_row.unit_label
    ));
  end loop;

  if p_dry_run then
    return jsonb_build_object('ok',true,'dry_run',true,'batch',to_jsonb(v_batch),'lines',v_preview);
  end if;

  for v_row in select * from public.catalog_inventory_posting_rows where batch_id=p_batch_id order by created_at,id for update
  loop
    select * into v_item from public.catalog_inventory_items where id=v_row.inventory_item_id for update;
    v_previous := round(coalesce(v_item.qty_on_hand,0),3);
    v_new := round(v_previous+v_row.quantity,3);
    update public.catalog_inventory_items set qty_on_hand=v_new,updated_at=now() where id=v_item.id;

    insert into public.catalog_inventory_movements(
      item_id,item_key,booking_id,movement_type,qty_delta,previous_qty,new_qty,unit_label,
      note,actor_name,source_kind,source_reference_id,posting_batch_id,reversal_of_movement_id
    ) values(
      v_item.id,v_item.item_key,v_batch.booking_id,'return',v_row.quantity,v_previous,v_new,
      v_row.unit_label,'Reversal: '||trim(p_reason),nullif(trim(coalesce(p_actor_email,'')),''),
      v_batch.source_kind,v_batch.source_reference_id,v_batch.id,v_row.movement_id
    ) returning id into v_reversal_id;

    update public.catalog_inventory_movements
      set is_reversed=true,reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
          reversal_reason=trim(p_reason),updated_at=now()
      where id=v_row.movement_id;
    update public.catalog_inventory_posting_rows
      set status='reversed',reversal_movement_id=v_reversal_id,updated_at=now()
      where id=v_row.id;

    if v_row.reservation_id is not null then
      update public.creative_project_inventory_reservations
        set status='reviewed',inventory_mutated=false,posting_batch_id=null,
            reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
            reversal_reason=trim(p_reason),updated_at=now()
        where id=v_row.reservation_id;
    end if;
  end loop;

  update public.catalog_inventory_posting_batches
    set status='reversed',reversed_at=now(),reversed_by_staff_email=nullif(trim(coalesce(p_actor_email,'')),''),
        reversal_reason=trim(p_reason),accounting_status=case when source_kind='booking' then 'reversal_review' else accounting_status end,
        updated_at=now()
    where id=p_batch_id returning * into v_batch;

  return jsonb_build_object('ok',true,'dry_run',false,'batch',to_jsonb(v_batch),'lines',v_preview);
end;
$$;

revoke all on function public.admin_catalog_inventory_post(text,uuid,jsonb,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_catalog_inventory_post(text,uuid,jsonb,text,text,text,boolean) to service_role;
revoke all on function public.admin_catalog_inventory_post_reverse(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_catalog_inventory_post_reverse(uuid,text,text,boolean) to service_role;

comment on table public.catalog_inventory_posting_batches is 'Build 240 atomic booking/project stock postings. One batch posts or reverses as one database transaction.';
comment on table public.catalog_inventory_posting_rows is 'Build 240 row evidence for inventory posting and authorized reversal.';
comment on function public.admin_catalog_inventory_post is 'Build 240 preview/commit inventory posting with stock locking, shortage checks, project reservation validation, and idempotency.';
comment on function public.admin_catalog_inventory_post_reverse is 'Build 240 preview/commit compensating inventory reversal. It never deletes movement history.';

-- Build 240 Startup Command Center additions. Existing items are preserved.
insert into public.app_startup_process_items(process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active) values
('migration-240',35,'Inventory and operations','blocker','Apply and verify the Build 240 transactional inventory posting migration','Booking and Creative Project material usage must no longer depend on separate browser writes. Build 240 moves preview, shortage validation, stock mutation, movement evidence, reservation status, idempotency and reversal links into one database transaction.','["Supabase Dashboard → SQL Editor", "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql", "Supabase Dashboard → Database → Functions", "/admin-inventory-posting.html"]'::jsonb,'["Confirm Builds 235, 237, 238 and 239 migrations have been applied in order.", "Open the complete Build 240 SQL migration from the ZIP.", "Run it in staging/preview first and do not edit individual statements.", "Confirm catalog_inventory_posting_batches and catalog_inventory_posting_rows exist.", "Confirm admin_catalog_inventory_post and admin_catalog_inventory_post_reverse appear under Database Functions.", "Refresh the Supabase schema cache if the admin page reports that the RPC is missing.", "Open /admin-inventory-posting.html and preview one harmless booking posting without committing.", "Load one reviewed Creative Project reservation and confirm shortages or conflicts are explained before posting.", "Record the migration date and staging result in the Startup evidence editor."]'::jsonb,'The two tables and two RPC functions exist, previews load from the shared database, a reviewed project reservation can be validated without changing stock, and the interface no longer reports migration required.','/admin-inventory-posting.html','migration_240',240,true),
('inventory-post-reversal-acceptance',36,'Inventory and accounting','blocker','Complete transactional inventory posting and authorized reversal acceptance testing','The feature is not production-ready until one committed booking posting, one reviewed project posting, one shortage rejection, one idempotent replay and one compensating reversal have been observed with correct quantities and audit evidence. Booking reversals also require accounting review because stock restoration does not automatically erase journal history.','["/admin-inventory-posting.html", "/admin-progress.html", "/admin-creative-projects.html", "/admin-accounting.html", "Supabase Dashboard → Table Editor → catalog_inventory_posting_batches"]'::jsonb,'["Choose a low-risk staging inventory item and record its starting quantity.", "Preview a booking posting and confirm the before/after quantity and total lines are correct.", "Commit once, refresh history, and confirm the quantity decreased exactly once.", "Repeat the same request with the same idempotency key and confirm stock does not decrease again.", "Preview a quantity greater than stock and confirm the whole transaction is rejected with no row changed.", "Create or use a reviewed Creative Project reservation, preview it, commit it, and confirm the reservation becomes posted/inventory_mutated.", "Open Transaction History, choose the test batch, enter a specific reversal reason, and preview the compensating return.", "Commit the reversal and confirm quantity returns, the original movement is marked reversed, a return movement exists, and the project reservation returns to reviewed where applicable.", "For a booking reversal, open Accounting and review or reverse the related COGS journal evidence rather than deleting it.", "Save screenshots or record IDs without customer secrets in Startup evidence."]'::jsonb,'All acceptance cases pass, duplicate submission cannot double-deduct stock, shortages leave every row unchanged, reversals preserve original and compensating history, and booking accounting evidence is reviewed.','/admin-inventory-posting.html','inventory_posting_reversal_acceptance',240,true)
on conflict(process_key) do update set sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,source_build=excluded.source_build,is_active=true,updated_at=now();
insert into public.app_startup_process_audit(process_key,event_type,actor_staff_email,safe_note) values
('migration-240','seeded',null,'Build 240 added transactional inventory migration instructions.'),
('inventory-post-reversal-acceptance','seeded',null,'Build 240 added posting and reversal acceptance instructions.');

-- Build 240 current execution cycle. Older rows remain for history.
update public.app_roadmap_execution_items set is_current_cycle=false where cycle_key<>'build240';
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b240_01','Deploy Build 240 and verify the Inventory Posting page','reliability','critical','in_progress',240,10,'MASTER_VALUE_ROADMAP.md','build240',true,'Deploy preview, hard-refresh /admin-inventory-posting, verify CSS/scripts/menu/route copy and confirm no console error.'),
('b240_02','Apply the Build 240 transaction migration in staging','reliability','critical','planned',240,20,'MASTER_VALUE_ROADMAP.md','build240',true,'Run the complete Build 240 migration after prior migrations, refresh schema cache, and confirm tables/RPCs.'),
('b240_03','Complete booking inventory posting acceptance','operations','critical','planned',240,30,'MASTER_VALUE_ROADMAP.md','build240',true,'Preview and commit a small booking usage batch; verify stock, movement, batch, row and job history evidence.'),
('b240_04','Complete Creative Project reservation posting acceptance','operations','critical','planned',240,40,'MASTER_VALUE_ROADMAP.md','build240',true,'Post reviewed project reservations and verify project ownership, shortage checks, status and inventory_mutated evidence.'),
('b240_05','Complete idempotency, shortage and rollback tests','reliability','critical','planned',240,50,'MASTER_VALUE_ROADMAP.md','build240',true,'Replay the same key, submit an over-stock request, and confirm no duplicate or partial mutations.'),
('b240_06','Complete authorized reversal and accounting review','payments','critical','planned',240,60,'MASTER_VALUE_ROADMAP.md','build240',true,'Preview/commit a compensating reversal and reconcile booking COGS journal evidence without deleting history.'),
('b240_07','Retest Block Calendar full-day, AM and PM behaviour','booking','critical','planned',240,70,'MASTER_VALUE_ROADMAP.md','build240',true,'Create/remove each block type and confirm public booking availability matches after refresh.'),
('b240_08','Complete end-to-end booking, payment and notification test','booking','critical','planned',240,80,'MASTER_VALUE_ROADMAP.md','build240',true,'Run phone-sized booking, deposit, webhook, email and admin reconciliation with safe evidence.'),
('b240_09','Complete Cloudflare and Supabase recovery rehearsal','reliability','critical','planned',240,90,'MASTER_VALUE_ROADMAP.md','build240',true,'Audit variables/bindings then perform staging restore and deployment rollback with smoke tests.'),
('b240_10','Complete legal, consent and staff permission review','customer','critical','planned',240,100,'MASTER_VALUE_ROADMAP.md','build240',true,'Publish policies, verify links, roles, session expiry and private media/incident boundaries.'),
('b240_11','Complete real-device mobile and accessibility acceptance','reliability','high','planned',240,110,'MASTER_VALUE_ROADMAP.md','build240',true,'Test customer/admin paths, keyboard, focus, labels, contrast, wrapping, tables and touch targets.'),
('b240_12','Finish resumable media upload and derivative worker','media','high','planned',240,120,'MASTER_VALUE_ROADMAP.md','build240',true,'Implement resumable weak-network upload recovery, deduplication and WebP/AVIF responsive derivatives.'),
('b240_13','Add automatic product publish-readiness gates','operations','high','planned',240,130,'MASTER_VALUE_ROADMAP.md','build240',true,'Block public publishing when required image roles, price, tax, category, stock, SEO or consent are incomplete.'),
('b240_14','Complete inventory name/category/cost/duplicate cleanup','operations','high','planned',240,140,'MASTER_VALUE_ROADMAP.md','build240',true,'Use suspicious-name, transactional bulk update, merge preview and audit history tools.'),
('b240_15','Complete sellable product galleries and pricing review','operations','high','planned',240,150,'MASTER_VALUE_ROADMAP.md','build240',true,'Finish featured plus seven images, alt/captions/roles, costs, HST, margins and public display.'),
('b240_16','Complete payment application and tax workflow','payments','high','planned',240,160,'MASTER_VALUE_ROADMAP.md','build240',true,'Post approved receipts against AR, add HST review, exceptions and traceable journal links.'),
('b240_17','Add month-end close, lock/reopen and accountant export','payments','high','planned',240,170,'MASTER_VALUE_ROADMAP.md','build240',true,'Implement controlled period close, authorized reopen and evidence-complete export packaging.'),
('b240_18','Complete Search Console, schema and GBP alignment','seo','high','planned',240,180,'MASTER_VALUE_ROADMAP.md','build240',true,'Submit sitemap, validate canonicals/schema/indexing and align GBP services, areas, hours, photos and reviews.'),
('b240_19','Replace high-value placeholders with approved local proof','seo','high','planned',240,190,'MASTER_VALUE_ROADMAP.md','build240',true,'Prioritize homepage, town/service pages, booking, galleries and trust blocks using customer-approved Rosie-owned images.'),
('b240_20','Run invite-only soft launch and prioritize observed failures','operations','critical','planned',240,200,'MASTER_VALUE_ROADMAP.md','build240',true,'Accept a small known-customer cohort and review every booking, payment, notification, upload, inventory and incident event daily.')
on conflict(item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=case when public.app_roadmap_execution_items.status='done' then 'done' else excluded.status end,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

commit;
