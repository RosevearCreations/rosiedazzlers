-- Build 246 — catalog publish-readiness review, audit evidence, and current execution cycle.
-- Apply after Build 238 and Build 239 migrations.

create table if not exists public.catalog_publish_readiness_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text null,
  action text not null check (action in ('preview','publish','blocked')),
  reason text not null,
  item_keys jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  blocked_count integer not null default 0,
  published_count integer not null default 0
);
create index if not exists catalog_publish_readiness_audit_created_idx on public.catalog_publish_readiness_audit(created_at desc);

alter table public.catalog_publish_readiness_audit enable row level security;
revoke all on public.catalog_publish_readiness_audit from public, anon, authenticated;
grant all on public.catalog_publish_readiness_audit to service_role;

create or replace function public.admin_catalog_inventory_publish_review(
  p_item_keys text[],
  p_actor_email text,
  p_reason text,
  p_dry_run boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := btrim(coalesce(p_reason,''));
  v_requested integer := coalesce(array_length(p_item_keys,1),0);
  v_found integer := 0;
  v_blocked integer := 0;
  v_published integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_missing jsonb := '[]'::jsonb;
begin
  if v_requested < 1 then raise exception 'Select at least one inventory item.' using errcode='22023'; end if;
  if v_requested > 500 then raise exception 'A maximum of 500 inventory items can be reviewed at once.' using errcode='22023'; end if;
  if length(v_reason) < 8 then raise exception 'Enter a reason with at least 8 characters.' using errcode='22023'; end if;

  select count(*) into v_found from public.catalog_inventory_items where item_key = any(p_item_keys);
  select coalesce(jsonb_agg(x.item_key),'[]'::jsonb) into v_missing
  from (select unnest(p_item_keys) item_key except select item_key from public.catalog_inventory_items where item_key = any(p_item_keys)) x;
  if v_found <> v_requested then
    return jsonb_build_object('ok',false,'dry_run',p_dry_run,'error','One or more inventory rows were not found.','missing_item_keys',v_missing);
  end if;

  perform 1 from public.catalog_inventory_items where item_key = any(p_item_keys) for update;

  with reviewed as (
    select
      i.item_key,
      array_remove(array[
        case when nullif(btrim(i.name),'') is null then 'Name is missing.' end,
        case when btrim(coalesce(i.name,'')) ~* '^(unknown product|untitled|item[[:space:]]*[0-9]*|product[[:space:]]*[0-9]*|amazon item)$' then 'Name is a placeholder.' end,
        case when btrim(coalesce(i.name,'')) ~* '^(B0[A-Z0-9]{8}|[A-Z0-9_-]{8,})$' then 'Name looks like an identifier.' end,
        case when i.item_type not in ('tool','consumable') then 'Item type must be tool or consumable.' end,
        case when nullif(btrim(i.category),'') is null then 'Category is missing.' end,
        case when nullif(btrim(i.unit_label),'') is null then 'Unit label is missing.' end,
        case when nullif(btrim(i.image_url),'') is null then 'Featured image is missing.' end,
        case when btrim(coalesce(i.image_url,'')) ~* '\.svg([?#].*)?$' then 'Featured image is still an SVG placeholder.' end,
        case when i.is_active is false then 'Item is inactive.' end,
        case when i.item_type='consumable' and coalesce(i.qty_on_hand,0) <= 0 then 'Consumable stock must be above zero.' end
      ],null) blockers,
      array_remove(array[
        case when coalesce(i.cost_cents,0) <= 0 then 'Unit cost is missing or zero.' end,
        case when nullif(btrim(i.description),'') is null then 'Description is missing.' end,
        case when nullif(btrim(i.preferred_vendor),'') is null then 'Preferred vendor is missing.' end,
        case when jsonb_array_length(coalesce(i.gallery_image_urls,'[]'::jsonb)) = 0 then 'Gallery has no additional images.' end,
        case when nullif(btrim(i.subcategory),'') is null then 'Subcategory is missing.' end,
        case when coalesce(cardinality(i.service_tags),0)=0 then 'Service tags are missing.' end
      ],null) warnings
    from public.catalog_inventory_items i
    where i.item_key = any(p_item_keys)
  ), shaped as (
    select item_key, blockers, warnings,
      cardinality(blockers)=0 as ready,
      greatest(0,least(100,100-cardinality(blockers)*20-cardinality(warnings)*6)) as score
    from reviewed
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'item_key',item_key,'ready',ready,'score',score,'blockers',to_jsonb(blockers),'warnings',to_jsonb(warnings)
  ) order by item_key),'[]'::jsonb), count(*) filter(where not ready)
  into v_results,v_blocked
  from shaped;

  if not p_dry_run and v_blocked=0 then
    update public.catalog_inventory_items
      set is_public=true, updated_at=now()
    where item_key=any(p_item_keys);
    get diagnostics v_published = row_count;
  end if;

  insert into public.catalog_publish_readiness_audit(actor_email,action,reason,item_keys,result,blocked_count,published_count)
  values(
    nullif(btrim(coalesce(p_actor_email,'')),''),
    case when p_dry_run then 'preview' when v_blocked>0 then 'blocked' else 'publish' end,
    v_reason,
    to_jsonb(p_item_keys),
    jsonb_build_object('items',v_results,'dry_run',p_dry_run),
    v_blocked,
    v_published
  );

  return jsonb_build_object(
    'ok', v_blocked=0,
    'dry_run', p_dry_run,
    'reviewed_count', v_requested,
    'blocked_count', v_blocked,
    'published_count', v_published,
    'items', v_results,
    'message', case when v_blocked>0 then 'Publishing blocked until every required field is corrected.' when p_dry_run then 'All selected rows passed readiness preview.' else 'Selected rows were published.' end
  );
end;
$$;

revoke all on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) from public, anon, authenticated;
grant execute on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) to service_role;
comment on function public.admin_catalog_inventory_publish_review(text[],text,text,boolean) is 'Build 246 previews and performs all-or-nothing inventory public publishing with readiness evidence.';


insert into public.app_startup_process_items(
  process_key,sort_order,category,severity,title,why_text,locations,instructions,done_when,action_route,evidence_key,source_build,is_active
) values(
  'catalog-publish-readiness',37,'Catalog and inventory','blocker',
  'Complete catalog publishing-readiness acceptance',
  'Public inventory rows should never expose placeholder names, missing categories, empty images, inactive records, or zero-stock consumables. Build 246 adds one reviewed publish gate and audit trail.',
  '["/admin-catalog.html", "/admin-inventory-manager.html", "/api/admin/catalog_readiness_report", "Supabase Dashboard → catalog_publish_readiness_audit"]'::jsonb,
  '["Apply the Build 246 migration in staging.", "Open Admin Inventory and filter to Blocked publishing rows.", "Correct one harmless test item until its readiness score has no blockers.", "Select the item and choose Preview public readiness.", "Confirm the preview lists warnings but no blockers.", "Publish the selection and confirm it appears in the public catalog.", "Select an intentionally incomplete test row and confirm publishing is blocked without changing any selected row.", "Review catalog_publish_readiness_audit and record safe IDs in Startup evidence."]'::jsonb,
  'Ready rows publish together, blocked rows remain private, incomplete batch publishing changes nothing, and every preview/publish attempt has audit evidence.',
  '/admin-catalog.html','catalog_publish_readiness',246,true
)
on conflict (process_key) do update set
  sort_order=excluded.sort_order,category=excluded.category,severity=excluded.severity,title=excluded.title,
  why_text=excluded.why_text,locations=excluded.locations,instructions=excluded.instructions,
  done_when=excluded.done_when,action_route=excluded.action_route,evidence_key=excluded.evidence_key,
  source_build=excluded.source_build,is_active=true,updated_at=now();

insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order)
values('catalog_publish_readiness','Catalog publishing readiness','Verify preview, publish, blocked-batch, public filtering, and audit evidence.','block','pending',42)
on conflict (evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();

update public.app_roadmap_execution_items set is_current_cycle=false where coalesce(is_current_cycle,false)=true;
insert into public.app_roadmap_execution_items(
  item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path
) values
('b246_01','Deploy Build 246 and verify catalog readiness assets','reliability','critical','in_progress',246,10,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_02','Apply Build 246 catalog readiness migration in staging','reliability','critical','planned',246,20,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_03','Preview and publish one ready catalog row','operations','critical','planned',246,30,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_04','Prove incomplete multi-row publish is all-or-nothing','operations','critical','planned',246,40,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_05','Review public catalog exclusions and readiness audit','operations','high','planned',246,50,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_06','Complete real-device CSS and mobile acceptance','reliability','critical','planned',246,60,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-ui-health.html'),
('b246_07','Retest full-day AM and PM booking blocks','booking','critical','planned',246,70,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-blocks.html'),
('b246_08','Complete booking payment refund and webhook acceptance','payments','critical','planned',246,80,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_09','Verify external notification delivery','reliability','critical','planned',246,90,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_10','Audit production variables bindings domains and rollback','reliability','critical','planned',246,100,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_11','Perform Supabase restore and Cloudflare rollback rehearsals','reliability','critical','planned',246,110,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_12','Complete legal consent permission and accessibility review','customer','critical','planned',246,120,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_13','Finish suspicious inventory cleanup and duplicate review','operations','high','planned',246,130,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-inventory-manager.html'),
('b246_14','Complete first sellable gallery pricing stock and tax records','operations','high','planned',246,140,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-catalog.html'),
('b246_15','Complete Search Console canonical and structured-data review','seo','high','planned',246,150,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-seo-tasks.html'),
('b246_16','Align Google Business Profile information and photo cadence','seo','high','planned',246,160,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-marketing.html'),
('b246_17','Complete upload interruption and recovery acceptance','media','high','planned',246,170,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_18','Complete payment application HST close and accountant review','payments','high','planned',246,180,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-accounting.html'),
('b246_19','Run invite-only soft launch with daily evidence review','operations','critical','planned',246,190,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-startup-guide.html'),
('b246_20','Modernize release guards and retire duplicate Markdown safely','documentation','medium','planned',246,200,'STARTUP_GO_LIVE_BLOCKERS.md','build246',true,'/admin-docs.html')
on conflict (item_key) do update set
  title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,
  status=case when public.app_roadmap_execution_items.status='done' then 'done' else excluded.status end,
  target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,
  cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();
