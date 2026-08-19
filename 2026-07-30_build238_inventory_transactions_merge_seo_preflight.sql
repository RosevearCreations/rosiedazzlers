-- Build 238 — transactional inventory bulk updates, reviewed duplicate merge,
-- audit evidence, and launch-readiness roadmap cycle.
-- Apply in Supabase SQL Editor before using the new bulk/merge execute actions.
begin;

create table if not exists public.catalog_inventory_change_batches (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('bulk_update','archive','restore')),
  reason text not null check (char_length(reason) between 8 and 1200),
  row_count integer not null default 0 check (row_count >= 0),
  actor_staff_email text null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_inventory_change_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.catalog_inventory_change_batches(id) on delete restrict,
  item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  item_key text not null,
  before_row jsonb not null,
  after_row jsonb not null,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_inventory_merge_audit (
  id uuid primary key default gen_random_uuid(),
  survivor_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  survivor_item_key text not null,
  duplicate_item_id uuid not null references public.catalog_inventory_items(id) on delete restrict,
  duplicate_item_key text not null,
  reason text not null check (char_length(reason) between 8 and 1200),
  reference_counts jsonb not null default '{}'::jsonb,
  survivor_before jsonb not null,
  duplicate_before jsonb not null,
  survivor_after jsonb not null,
  duplicate_after jsonb not null,
  actor_staff_email text null,
  created_at timestamptz not null default now()
);

create index if not exists catalog_inventory_change_batches_created_idx
  on public.catalog_inventory_change_batches(created_at desc);
create index if not exists catalog_inventory_change_batch_rows_batch_idx
  on public.catalog_inventory_change_batch_rows(batch_id, created_at);
create index if not exists catalog_inventory_change_batch_rows_item_idx
  on public.catalog_inventory_change_batch_rows(item_id, created_at desc);
create index if not exists catalog_inventory_merge_survivor_idx
  on public.catalog_inventory_merge_audit(survivor_item_id, created_at desc);
create index if not exists catalog_inventory_merge_duplicate_idx
  on public.catalog_inventory_merge_audit(duplicate_item_id, created_at desc);

alter table public.catalog_inventory_change_batches enable row level security;
alter table public.catalog_inventory_change_batch_rows enable row level security;
alter table public.catalog_inventory_merge_audit enable row level security;
revoke all privileges on table public.catalog_inventory_change_batches from public, anon, authenticated;
revoke all privileges on table public.catalog_inventory_change_batch_rows from public, anon, authenticated;
revoke all privileges on table public.catalog_inventory_merge_audit from public, anon, authenticated;
grant all privileges on table public.catalog_inventory_change_batches to service_role;
grant all privileges on table public.catalog_inventory_change_batch_rows to service_role;
grant all privileges on table public.catalog_inventory_merge_audit to service_role;

create or replace function public.admin_catalog_inventory_bulk_update(
  p_changes jsonb,
  p_actor_email text,
  p_reason text,
  p_operation_type text default 'bulk_update',
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_change jsonb;
  v_patch jsonb;
  v_item_key text;
  v_before jsonb;
  v_after jsonb;
  v_item_id uuid;
  v_batch_id uuid;
  v_processed integer := 0;
  v_unknown text[];
  v_changed_fields text[];
  v_allowed constant text[] := array[
    'name','item_type','category','subcategory','description','qty_on_hand',
    'reorder_point','reorder_qty','unit_label','cost_cents','preferred_vendor',
    'reuse_policy','image_url','gallery_image_urls','is_public','is_active','notes'
  ];
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) < 1 then
    raise exception 'At least one inventory change is required.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_changes) > 500 then
    raise exception 'A maximum of 500 rows can be updated in one batch.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a reason with at least 8 characters.' using errcode = '22023';
  end if;
  if coalesce(p_operation_type,'') not in ('bulk_update','archive','restore') then
    raise exception 'Invalid inventory batch operation.' using errcode = '22023';
  end if;

  -- Validate the complete batch before any write. Any later exception rolls back the transaction.
  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    v_item_key := trim(coalesce(v_change->>'item_key',''));
    v_patch := coalesce(v_change->'changes','{}'::jsonb);
    if v_item_key = '' then raise exception 'Every batch row requires item_key.' using errcode='22023'; end if;
    if jsonb_typeof(v_patch) <> 'object' or v_patch = '{}'::jsonb then
      raise exception 'Inventory row % has no changes.', v_item_key using errcode='22023';
    end if;
    select array_agg(k) into v_unknown
      from jsonb_object_keys(v_patch) as k
      where not (k = any(v_allowed));
    if coalesce(array_length(v_unknown,1),0) > 0 then
      raise exception 'Inventory row % contains unsupported fields: %.', v_item_key, array_to_string(v_unknown, ', ') using errcode='22023';
    end if;
    select to_jsonb(i), i.id into v_before, v_item_id
      from public.catalog_inventory_items i where i.item_key = v_item_key for update;
    if v_item_id is null then raise exception 'Inventory row % was not found.', v_item_key using errcode='P0002'; end if;
    if v_patch ? 'name' and char_length(trim(coalesce(v_patch->>'name',''))) < 2 then
      raise exception 'Inventory row % requires a useful name.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'item_type' and coalesce(v_patch->>'item_type','') not in ('tool','consumable') then
      raise exception 'Inventory row % has an invalid item type.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'reuse_policy' and coalesce(v_patch->>'reuse_policy','') not in ('reorder','single_use','never_reuse') then
      raise exception 'Inventory row % has an invalid reuse policy.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'gallery_image_urls' and (
      jsonb_typeof(v_patch->'gallery_image_urls') <> 'array' or jsonb_array_length(v_patch->'gallery_image_urls') > 7
    ) then raise exception 'Inventory row % can have no more than seven gallery images.', v_item_key using errcode='22023'; end if;
    if v_patch ? 'qty_on_hand' and coalesce((v_patch->>'qty_on_hand')::numeric,0) < 0 then
      raise exception 'Inventory row % cannot have negative quantity.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'reorder_point' and coalesce((v_patch->>'reorder_point')::numeric,0) < 0 then
      raise exception 'Inventory row % cannot have a negative reorder point.', v_item_key using errcode='22023';
    end if;
    if v_patch ? 'cost_cents' and (v_patch->>'cost_cents') is not null and (v_patch->>'cost_cents')::integer < 0 then
      raise exception 'Inventory row % cannot have a negative cost.', v_item_key using errcode='22023';
    end if;
  end loop;

  if not p_dry_run then
    insert into public.catalog_inventory_change_batches(operation_type,reason,row_count,actor_staff_email)
    values(p_operation_type,trim(p_reason),jsonb_array_length(p_changes),nullif(trim(coalesce(p_actor_email,'')),''))
    returning id into v_batch_id;
  end if;

  for v_change in select value from jsonb_array_elements(p_changes)
  loop
    v_item_key := trim(v_change->>'item_key');
    v_patch := v_change->'changes';
    select to_jsonb(i), i.id into v_before, v_item_id
      from public.catalog_inventory_items i where i.item_key = v_item_key for update;
    select array_agg(k order by k) into v_changed_fields from jsonb_object_keys(v_patch) as k;

    if p_dry_run then
      v_after := v_before || v_patch || jsonb_build_object('updated_at', now());
    else
      update public.catalog_inventory_items i set
        name = case when v_patch ? 'name' then trim(v_patch->>'name') else i.name end,
        item_type = case when v_patch ? 'item_type' then v_patch->>'item_type' else i.item_type end,
        category = case when v_patch ? 'category' then nullif(trim(v_patch->>'category'),'') else i.category end,
        subcategory = case when v_patch ? 'subcategory' then nullif(trim(v_patch->>'subcategory'),'') else i.subcategory end,
        description = case when v_patch ? 'description' then nullif(trim(v_patch->>'description'),'') else i.description end,
        qty_on_hand = case when v_patch ? 'qty_on_hand' then (v_patch->>'qty_on_hand')::numeric else i.qty_on_hand end,
        reorder_point = case when v_patch ? 'reorder_point' then (v_patch->>'reorder_point')::numeric else i.reorder_point end,
        reorder_qty = case when v_patch ? 'reorder_qty' then (v_patch->>'reorder_qty')::numeric else i.reorder_qty end,
        unit_label = case when v_patch ? 'unit_label' then nullif(trim(v_patch->>'unit_label'),'') else i.unit_label end,
        cost_cents = case when v_patch ? 'cost_cents' then nullif(v_patch->>'cost_cents','')::integer else i.cost_cents end,
        preferred_vendor = case when v_patch ? 'preferred_vendor' then nullif(trim(v_patch->>'preferred_vendor'),'') else i.preferred_vendor end,
        reuse_policy = case when v_patch ? 'reuse_policy' then v_patch->>'reuse_policy' else i.reuse_policy end,
        image_url = case when v_patch ? 'image_url' then nullif(trim(v_patch->>'image_url'),'') else i.image_url end,
        gallery_image_urls = case when v_patch ? 'gallery_image_urls' then v_patch->'gallery_image_urls' else i.gallery_image_urls end,
        is_public = case when v_patch ? 'is_public' then (v_patch->>'is_public')::boolean else i.is_public end,
        is_active = case when v_patch ? 'is_active' then (v_patch->>'is_active')::boolean else i.is_active end,
        notes = case when v_patch ? 'notes' then nullif(trim(v_patch->>'notes'),'') else i.notes end,
        updated_at = now()
      where i.id = v_item_id
      returning to_jsonb(i) into v_after;

      insert into public.catalog_inventory_change_batch_rows(
        batch_id,item_id,item_key,before_row,after_row,changed_fields
      ) values(v_batch_id,v_item_id,v_item_key,v_before,v_after,coalesce(v_changed_fields,'{}'));
    end if;
    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,'dry_run',p_dry_run,'processed',v_processed,'batch_id',v_batch_id,
    'operation_type',p_operation_type
  );
end;
$$;

create or replace function public.admin_catalog_inventory_merge(
  p_survivor_item_key text,
  p_duplicate_item_key text,
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.catalog_inventory_items%rowtype;
  d public.catalog_inventory_items%rowtype;
  v_survivor_before jsonb;
  v_duplicate_before jsonb;
  v_survivor_after jsonb;
  v_duplicate_after jsonb;
  v_counts jsonb := '{}'::jsonb;
  v_count bigint;
  v_gallery jsonb;
  v_tags text[];
  v_note text;
begin
  if trim(coalesce(p_survivor_item_key,'')) = '' or trim(coalesce(p_duplicate_item_key,'')) = '' then
    raise exception 'Choose both a survivor and a duplicate inventory row.' using errcode='22023';
  end if;
  if p_survivor_item_key = p_duplicate_item_key then
    raise exception 'The survivor and duplicate must be different rows.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Enter a merge reason with at least 8 characters.' using errcode='22023';
  end if;

  select * into s from public.catalog_inventory_items where item_key=p_survivor_item_key for update;
  if not found then raise exception 'Survivor inventory row was not found.' using errcode='P0002'; end if;
  select * into d from public.catalog_inventory_items where item_key=p_duplicate_item_key for update;
  if not found then raise exception 'Duplicate inventory row was not found.' using errcode='P0002'; end if;
  if s.item_type <> d.item_type then
    raise exception 'Only inventory rows of the same type can be merged.' using errcode='22023';
  end if;
  if nullif(trim(coalesce(s.unit_label,'')),'') is not null and nullif(trim(coalesce(d.unit_label,'')),'') is not null
     and lower(trim(s.unit_label)) <> lower(trim(d.unit_label)) then
    raise exception 'The selected rows use different units. Correct the units before merging.' using errcode='22023';
  end if;
  if d.is_active = false and coalesce(d.qty_on_hand,0)=0 and position('Merged into ' in coalesce(d.notes,''))>0 then
    raise exception 'The selected duplicate already appears to have been merged.' using errcode='22023';
  end if;

  v_survivor_before := to_jsonb(s);
  v_duplicate_before := to_jsonb(d);

  select count(*) into v_count from public.catalog_inventory_movements where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('inventory_movements',v_count);
  select count(*) into v_count from public.catalog_low_stock_alerts where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('low_stock_alerts',v_count);
  select count(*) into v_count from public.catalog_purchase_orders where item_id=d.id or item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('purchase_orders',v_count);
  select count(*) into v_count from public.catalog_item_receipts where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('receipts',v_count);
  select count(*) into v_count from public.catalog_item_assignments where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('assignments',v_count);
  select count(*) into v_count from public.service_product_links where item_key=d.item_key;
  v_counts := v_counts || jsonb_build_object('service_links',v_count);
  select count(*) into v_count from public.creative_project_material_lines where inventory_item_id=d.id;
  v_counts := v_counts || jsonb_build_object('project_material_lines',v_count);
  select count(*) into v_count from public.creative_project_inventory_reservations where inventory_item_id=d.id;
  v_counts := v_counts || jsonb_build_object('project_reservations',v_count);

  select coalesce(jsonb_agg(value order by first_seen),'[]'::jsonb) into v_gallery
  from (
    select value, first_seen
    from (
      select trim(value) as value, first_seen,
             row_number() over (partition by lower(trim(value)) order by first_seen) as duplicate_rank
      from (
        select value, ordinality first_seen from jsonb_array_elements_text(coalesce(s.gallery_image_urls,'[]'::jsonb)) with ordinality
        union all
        select value, 100 + ordinality first_seen from jsonb_array_elements_text(coalesce(d.gallery_image_urls,'[]'::jsonb)) with ordinality
      ) source_images
      where trim(value)<>''
    ) ranked_images
    where duplicate_rank=1
    order by first_seen
    limit 7
  ) dedup;
  select array_agg(tag order by tag) into v_tags from (
    select distinct trim(tag) tag from unnest(coalesce(s.service_tags,'{}') || coalesce(d.service_tags,'{}')) tag where trim(tag)<>''
  ) t;

  if p_dry_run then
    return jsonb_build_object(
      'ok',true,'dry_run',true,'reference_counts',v_counts,
      'survivor',v_survivor_before,'duplicate',v_duplicate_before,
      'proposed',jsonb_build_object(
        'qty_on_hand',coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),
        'cost_cents',coalesce(s.cost_cents,d.cost_cents),
        'image_url',coalesce(nullif(s.image_url,''),d.image_url),
        'gallery_image_urls',coalesce(v_gallery,'[]'::jsonb),
        'category',coalesce(nullif(s.category,''),d.category),
        'preferred_vendor',coalesce(nullif(s.preferred_vendor,''),d.preferred_vendor),
        'duplicate_action','archive with zero quantity; no hard delete'
      )
    );
  end if;

  -- Record a compensating transfer before moving historical references.
  if coalesce(d.qty_on_hand,0) <> 0 then
    insert into public.catalog_inventory_movements(item_id,item_key,movement_type,qty_delta,previous_qty,new_qty,unit_label,note,actor_name)
    values(s.id,s.item_key,'adjustment',coalesce(d.qty_on_hand,0),coalesce(s.qty_on_hand,0),coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),coalesce(s.unit_label,d.unit_label),'Build 238 duplicate merge transfer from '||d.item_key,nullif(trim(coalesce(p_actor_email,'')),''));
    insert into public.catalog_inventory_movements(item_id,item_key,movement_type,qty_delta,previous_qty,new_qty,unit_label,note,actor_name)
    values(d.id,d.item_key,'adjustment',-coalesce(d.qty_on_hand,0),coalesce(d.qty_on_hand,0),0,coalesce(d.unit_label,s.unit_label),'Build 238 duplicate merge transfer to '||s.item_key,nullif(trim(coalesce(p_actor_email,'')),''));
  end if;

  update public.catalog_inventory_movements set item_id=s.id,item_key=s.item_key,updated_at=now() where (item_id=d.id or item_key=d.item_key) and note not like 'Build 238 duplicate merge transfer to %';
  update public.catalog_low_stock_alerts set item_id=s.id,item_key=s.item_key where item_id=d.id or item_key=d.item_key;
  update public.catalog_purchase_orders set item_id=s.id,item_key=s.item_key,item_name=s.name,updated_at=now() where item_id=d.id or item_key=d.item_key;
  update public.catalog_item_receipts set item_key=s.item_key where item_key=d.item_key;
  update public.catalog_item_assignments set item_key=s.item_key where item_key=d.item_key;
  update public.service_product_links set item_key=s.item_key,updated_at=now() where item_key=d.item_key;
  update public.creative_project_material_lines set inventory_item_id=s.id,updated_at=now() where inventory_item_id=d.id;
  update public.creative_project_inventory_reservations set inventory_item_id=s.id,updated_at=now() where inventory_item_id=d.id;

  update public.catalog_inventory_items as ci set
    qty_on_hand=coalesce(s.qty_on_hand,0)+coalesce(d.qty_on_hand,0),
    reorder_point=greatest(coalesce(s.reorder_point,0),coalesce(d.reorder_point,0)),
    reorder_qty=greatest(coalesce(s.reorder_qty,0),coalesce(d.reorder_qty,0)),
    category=coalesce(nullif(s.category,''),d.category),
    subcategory=coalesce(nullif(s.subcategory,''),d.subcategory),
    description=coalesce(nullif(s.description,''),d.description),
    image_url=coalesce(nullif(s.image_url,''),d.image_url),
    gallery_image_urls=coalesce(v_gallery,'[]'::jsonb),
    cost_cents=coalesce(s.cost_cents,d.cost_cents),
    preferred_vendor=coalesce(nullif(s.preferred_vendor,''),d.preferred_vendor),
    vendor_sku=coalesce(nullif(s.vendor_sku,''),d.vendor_sku),
    unit_label=coalesce(nullif(s.unit_label,''),d.unit_label),
    receipt_url=coalesce(nullif(s.receipt_url,''),d.receipt_url),
    assigned_station=coalesce(nullif(s.assigned_station,''),d.assigned_station),
    amazon_url=coalesce(nullif(s.amazon_url,''),d.amazon_url),
    amazon_asin=coalesce(nullif(s.amazon_asin,''),d.amazon_asin),
    amazon_title=coalesce(nullif(s.amazon_title,''),d.amazon_title),
    amazon_brand=coalesce(nullif(s.amazon_brand,''),d.amazon_brand),
    amazon_category=coalesce(nullif(s.amazon_category,''),d.amazon_category),
    service_tags=coalesce(v_tags,'{}'),
    notes=concat_ws(E'\n',nullif(s.notes,''),'Merged duplicate '||d.item_key||' on '||to_char(now(),'YYYY-MM-DD')||'. Reason: '||trim(p_reason)),
    is_active=true,
    updated_at=now()
  where ci.id=s.id returning to_jsonb(ci) into v_survivor_after;

  v_note := concat_ws(E'\n',nullif(d.notes,''),'Merged into '||s.item_key||' on '||to_char(now(),'YYYY-MM-DD')||'. Reason: '||trim(p_reason));
  update public.catalog_inventory_items as ci set
    qty_on_hand=0,is_active=false,is_public=false,notes=v_note,updated_at=now()
  where ci.id=d.id returning to_jsonb(ci) into v_duplicate_after;

  insert into public.catalog_inventory_merge_audit(
    survivor_item_id,survivor_item_key,duplicate_item_id,duplicate_item_key,reason,
    reference_counts,survivor_before,duplicate_before,survivor_after,duplicate_after,actor_staff_email
  ) values(
    s.id,s.item_key,d.id,d.item_key,trim(p_reason),v_counts,
    v_survivor_before,v_duplicate_before,v_survivor_after,v_duplicate_after,nullif(trim(coalesce(p_actor_email,'')),'')
  );

  return jsonb_build_object('ok',true,'dry_run',false,'reference_counts',v_counts,'survivor',v_survivor_after,'duplicate',v_duplicate_after);
end;
$$;

revoke all on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) to service_role;
grant execute on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) to service_role;

comment on table public.catalog_inventory_change_batches is 'Build 238 audit header for transactional inventory bulk changes. Browser sequential partial-save batches should not be used.';
comment on table public.catalog_inventory_merge_audit is 'Build 238 append-only evidence for reviewed duplicate inventory merges. Duplicates are archived, never hard deleted.';
comment on function public.admin_catalog_inventory_bulk_update(jsonb,text,text,text,boolean) is 'Build 238 validates the entire batch before an all-or-nothing inventory update and records before/after evidence.';
comment on function public.admin_catalog_inventory_merge(text,text,text,text,boolean) is 'Build 238 previews or executes a reviewed duplicate merge, transfers known references, records compensating quantity movements, and archives the duplicate.';

-- Current-cycle roadmap items. Existing historical rows remain audit evidence.
update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(
  item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path
) values
('b238_01','Apply Build 238 inventory transaction migration in staging','operations','critical','planned',238,10,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'Supabase SQL Editor → sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql'),
('b238_02','Preview and execute one harmless two-row inventory merge','operations','high','planned',238,20,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_03','Preview and execute one transactional bulk inventory update','operations','high','planned',238,30,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_04','Verify Build 238 SEO title and description changes in preview','seo','high','planned',238,40,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'Public homepage, services, pricing, booking, gallery and local pages'),
('b238_05','Complete Block Calendar full-day AM PM production-like test','booking','critical','planned',238,50,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-blocks.html'),
('b238_06','Complete end-to-end booking and admin record verification','booking','critical','planned',238,60,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/book.html → /admin-booking.html'),
('b238_07','Complete and refund a small live Stripe transaction','payments','critical','planned',238,70,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-payments.html and Stripe Dashboard'),
('b238_08','Verify all required notification types in external inboxes','reliability','critical','planned',238,80,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-test-centre.html'),
('b238_09','Audit Cloudflare production variables bindings and branches','reliability','critical','planned',238,90,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Cloudflare Dashboard → Workers & Pages → Rosie Dazzlers'),
('b238_10','Perform Supabase staging backup and restore rehearsal','reliability','critical','planned',238,100,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Supabase Dashboard → Database → Backups'),
('b238_11','Review and publish customer policy and consent wording','customer','critical','planned',238,110,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-site-settings.html and public footer policy pages'),
('b238_12','Complete iPhone-size and Android-size real-device checks','reliability','high','planned',238,120,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Public and admin critical routes on real devices'),
('b238_13','Complete accessibility keyboard focus contrast and errors','reliability','high','planned',238,130,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-test-centre.html'),
('b238_14','Submit sitemap and validate canonical and structured data','seo','critical','planned',238,140,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Google Search Console and Rich Results Test'),
('b238_15','Verify Google Business Profile categories service area and proof','seo','critical','planned',238,150,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'Google Business Profile → Edit profile'),
('b238_16','Finish suspicious inventory name category and cost cleanup','operations','high','planned',238,160,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html'),
('b238_17','Complete featured and seven-image product media metadata','media','high','planned',238,170,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-inventory-manager.html and /admin-catalog.html'),
('b238_18','Replace high-value public visual placeholders with local proof','media','high','planned',238,180,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-media-health.html and IMAGES.md'),
('b238_19','Run invite-only soft launch with daily incident review','operations','critical','planned',238,190,'STARTUP_GO_LIVE_BLOCKERS.md','build238_launch_polish',true,'/admin-launch-readiness.html and /admin-today.html'),
('b238_20','Modernize release guards before archiving redundant Markdown','documentation','medium','planned',238,200,'MASTER_VALUE_ROADMAP.md','build238_launch_polish',true,'scripts/release_check.py and DOC_INDEX.md')
on conflict(item_key) do update set
 title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,status=excluded.status,
 target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,
 cycle_key=excluded.cycle_key,is_current_cycle=excluded.is_current_cycle,action_path=excluded.action_path,updated_at=now();

commit;
