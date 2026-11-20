-- Build 913 — gated original retail finance, signed provider evidence, invoice/HST and staff-custody handoffs.
-- Financial actions are OFF unless owner-supervised Cloudflare secrets/flags and real original events authorize them.
create table if not exists public.rosie_retail_finance_v913 (
  order_id uuid primary key references public.rosie_retail_order_requests_v912(id) on delete restrict,
  provider text not null default 'stripe' check(provider='stripe'),
  provider_session_id text not null unique check(length(provider_session_id) between 8 and 180),
  provider_payment_intent_id text unique,
  subtotal_cents integer not null check(subtotal_cents>0),
  hst_cents integer not null check(hst_cents>=0),
  total_cents integer not null check(total_cents=subtotal_cents+hst_cents and total_cents>0),
  amount_paid_cents integer not null default 0 check(amount_paid_cents>=0),
  amount_refunded_cents integer not null default 0 check(amount_refunded_cents>=0 and amount_refunded_cents<=amount_paid_cents),
  payment_state text not null default 'awaiting_provider'
    check(payment_state in ('awaiting_provider','paid','partial_refund','refunded')),
  provider_paid_event_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.rosie_retail_provider_events_v913 (
  event_id text primary key check(length(event_id) between 5 and 200),
  order_id uuid not null references public.rosie_retail_order_requests_v912(id),
  event_kind text not null check(event_kind in ('checkout_paid','refund_succeeded')),
  provider text not null default 'stripe' check(provider='stripe'),
  occurred_at timestamptz not null default now()
);
create sequence if not exists public.rosie_retail_invoice_number_v913_seq;
revoke all on sequence public.rosie_retail_invoice_number_v913_seq from public,anon,authenticated;
grant usage,select on sequence public.rosie_retail_invoice_number_v913_seq to service_role;
create table if not exists public.rosie_retail_invoices_v913 (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.rosie_retail_order_requests_v912(id),
  invoice_number text not null unique,
  subtotal_cents integer not null check(subtotal_cents>=0),
  hst_cents integer not null check(hst_cents>=0),
  total_cents integer not null check(total_cents=subtotal_cents+hst_cents),
  currency text not null default 'CAD' check(currency='CAD'),
  issued_at timestamptz not null default now(),
  provider_paid_event_id text not null references public.rosie_retail_provider_events_v913(event_id),
  tax_review_state text not null default 'hst_recorded_not_filed' check(tax_review_state='hst_recorded_not_filed')
);
create table if not exists public.rosie_retail_refunds_v913 (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.rosie_retail_order_requests_v912(id),
  amount_cents integer not null check(amount_cents>0),
  reason text not null check(length(reason) between 8 and 400),
  status text not null default 'requested' check(status in ('requested','provider_pending','succeeded','failed')),
  provider_refund_id text unique,
  provider_event_id text unique,
  requested_by_staff_user_id uuid not null,
  requested_at timestamptz not null default now(),
  succeeded_at timestamptz
);
create unique index if not exists rosie_retail_refunds_v913_single_active_idx
 on public.rosie_retail_refunds_v913(order_id) where status in ('requested','provider_pending');
create table if not exists public.rosie_retail_handoffs_v913 (
  order_id uuid primary key references public.rosie_retail_order_requests_v912(id),
  confirmation_hash text not null check(confirmation_hash ~ '^[a-f0-9]{64}$'),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0 check(attempts between 0 and 8),
  confirmed_by_staff_user_id uuid,
  customer_present_attested boolean not null default false,
  handoff_at timestamptz,
  handoff_note text not null default '' check(length(handoff_note)<=400),
  check(expires_at>issued_at)
);
create table if not exists public.rosie_retail_stock_movements_v913 (
  order_id uuid not null references public.rosie_retail_order_requests_v912(id),
  product_id uuid not null references public.rosie_retail_products_v912(id),
  quantity integer not null check(quantity>0),
  movement_kind text not null default 'physical_handoff' check(movement_kind='physical_handoff'),
  created_at timestamptz not null default now(),
  primary key(order_id,product_id)
);
do $$
declare tab text;
begin
 foreach tab in array array['rosie_retail_finance_v913','rosie_retail_provider_events_v913',
 'rosie_retail_invoices_v913','rosie_retail_refunds_v913','rosie_retail_handoffs_v913','rosie_retail_stock_movements_v913']
 loop
   execute format('alter table public.%I enable row level security',tab);
   execute format('revoke all on public.%I from public,anon,authenticated',tab);
   execute format('grant select,insert,update on public.%I to service_role',tab);
 end loop;
end $$;

-- Explicitly service-role only. Security INVOKER: caller must already possess table/sequence grants.
create or replace function public.rosie_retail_register_checkout_v913(
 p_order uuid,p_session text,p_total integer
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare o record; f record;
begin
 select * into o from public.rosie_retail_order_requests_v912 where id=p_order for update;
 if not found or o.status<>'quoted' then raise exception 'Original order must be staff-quoted'; end if;
 if p_total<>o.subtotal_cents+o.estimated_hst_cents or p_total<=0 then
   raise exception 'Server-confirmed total mismatch'; end if;
 select * into f from public.rosie_retail_finance_v913 where order_id=p_order for update;
 if found then
   if f.provider_session_id<>p_session or f.total_cents<>p_total then
      raise exception 'Checkout already registered with a different provider session'; end if;
 else
  insert into public.rosie_retail_finance_v913(order_id,provider_session_id,
   subtotal_cents,hst_cents,total_cents) values(p_order,p_session,o.subtotal_cents,o.estimated_hst_cents,p_total);
 end if;
 return jsonb_build_object('ok',true,'order_id',p_order,'provider_session_id',p_session);
end $$;

create or replace function public.rosie_retail_settle_stripe_v913(
 p_order uuid,p_session text,p_payment_intent text,p_amount integer,p_event text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare f public.rosie_retail_finance_v913%rowtype; num text;
begin
 select * into f from public.rosie_retail_finance_v913 where order_id=p_order for update;
 if not found or f.provider_session_id<>p_session or
   p_amount<>f.total_cents or p_amount<=0 or length(coalesce(p_event,''))<5 or
   length(coalesce(p_payment_intent,''))<5 then
   raise exception 'Original provider settlement mismatch'; end if;
 if f.payment_state='paid' or f.payment_state='partial_refund' or f.payment_state='refunded' then
  if f.provider_payment_intent_id<>p_payment_intent then
   raise exception 'Conflicting provider payment intent'; end if;
  return jsonb_build_object('ok',true,'replay',true,'state',f.payment_state);
 end if;
 insert into public.rosie_retail_provider_events_v913(event_id,order_id,event_kind)
 values(p_event,p_order,'checkout_paid');
 update public.rosie_retail_finance_v913 set
 provider_payment_intent_id=p_payment_intent,amount_paid_cents=p_amount,
 payment_state='paid',provider_paid_event_id=p_event,paid_at=now(),updated_at=now()
 where order_id=p_order;
 num:='R-'||to_char(now() at time zone 'America/Toronto','YYYY')||'-'||
 lpad(nextval('public.rosie_retail_invoice_number_v913_seq')::text,8,'0');
 insert into public.rosie_retail_invoices_v913(order_id,invoice_number,subtotal_cents,
   hst_cents,total_cents,provider_paid_event_id)
 values(p_order,num,f.subtotal_cents,f.hst_cents,f.total_cents,p_event);
 return jsonb_build_object('ok',true,'replay',false,'invoice_number',num,'paid_cents',p_amount);
end $$;

create or replace function public.rosie_retail_request_refund_v913(
 p_order uuid,p_staff uuid,p_amount integer,p_reason text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare f public.rosie_retail_finance_v913%rowtype; pending integer; result uuid;
begin
 select * into f from public.rosie_retail_finance_v913 where order_id=p_order for update;
 if not found or f.payment_state not in ('paid','partial_refund') then
  raise exception 'Original paid transaction required';end if;
 if exists (select 1 from public.rosie_retail_handoffs_v913
            where order_id=p_order and handoff_at is not null) then
  raise exception 'Delivered order needs special return review';end if;
 if p_staff is null or length(trim(coalesce(p_reason,''))) not between 8 and 400 then
  raise exception 'Staff and reason required';end if;
 if p_amount<=0 or p_amount>f.amount_paid_cents-f.amount_refunded_cents then
  raise exception 'Refund amount exceeds verified balance';end if;
 if exists(select 1 from public.rosie_retail_refunds_v913
           where order_id=p_order and status in ('requested','provider_pending')) then
  raise exception 'Refund already in progress';end if;
 insert into public.rosie_retail_refunds_v913(order_id,amount_cents,reason,requested_by_staff_user_id)
 values(p_order,p_amount,trim(p_reason),p_staff) returning id into result;
 return jsonb_build_object('ok',true,'refund_id',result,'state','requested');
end $$;

create or replace function public.rosie_retail_record_refund_provider_v913(
 p_refund uuid,p_provider_refund text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.rosie_retail_refunds_v913%rowtype;
begin
 select * into r from public.rosie_retail_refunds_v913 where id=p_refund for update;
 if not found or length(coalesce(p_provider_refund,''))<5 then raise exception 'Refund source missing';end if;
 if r.status='provider_pending' and r.provider_refund_id=p_provider_refund then
   return jsonb_build_object('ok',true,'replay',true);end if;
 if r.status<>'requested' then raise exception 'Refund state mismatch';end if;
 update public.rosie_retail_refunds_v913 set status='provider_pending',
 provider_refund_id=p_provider_refund where id=p_refund;
 return jsonb_build_object('ok',true,'replay',false);
end $$;

create or replace function public.rosie_retail_settle_refund_v913(
 p_refund text,p_amount integer,p_event text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.rosie_retail_refunds_v913%rowtype; f public.rosie_retail_finance_v913%rowtype;
declare new_refunded integer;
begin
 select * into r from public.rosie_retail_refunds_v913
 where provider_refund_id=p_refund for update;
 if not found or r.amount_cents<>p_amount or length(coalesce(p_event,''))<5 then
  raise exception 'Original refund event unmatched';end if;
 select * into f from public.rosie_retail_finance_v913 where order_id=r.order_id for update;
 if not found then raise exception 'Original finance entry missing';end if;
 if r.status='succeeded' then return jsonb_build_object('ok',true,'replay',true);end if;
 if r.status<>'provider_pending' then raise exception 'Provider refund not pending';end if;
 new_refunded:=f.amount_refunded_cents+p_amount;
 if new_refunded>f.amount_paid_cents then raise exception 'Refund exceeds verified payment';end if;
 insert into public.rosie_retail_provider_events_v913(event_id,order_id,event_kind)
 values(p_event,r.order_id,'refund_succeeded');
 update public.rosie_retail_refunds_v913 set status='succeeded',provider_event_id=p_event,
 succeeded_at=now() where id=r.id;
 update public.rosie_retail_finance_v913 set amount_refunded_cents=new_refunded,
 payment_state=case when new_refunded=amount_paid_cents then 'refunded' else 'partial_refund' end,
 updated_at=now() where order_id=r.order_id;
 return jsonb_build_object('ok',true,'replay',false,'total_refunded_cents',new_refunded);
end $$;

create or replace function public.rosie_retail_issue_handoff_pin_v913(
 p_order uuid,p_hash text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare f public.rosie_retail_finance_v913%rowtype;
begin
 select * into f from public.rosie_retail_finance_v913 where order_id=p_order for update;
 if not found or f.payment_state<>'paid' then raise exception 'Paid, unrefunded order required';end if;
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid confirmation hash';end if;
 if exists(select 1 from public.rosie_retail_handoffs_v913 where order_id=p_order and handoff_at is not null)
 then raise exception 'Already handed over';end if;
 insert into public.rosie_retail_handoffs_v913(order_id,confirmation_hash,expires_at)
 values(p_order,p_hash,now()+interval '15 minutes')
 on conflict(order_id) do update set confirmation_hash=excluded.confirmation_hash,
 issued_at=now(),expires_at=excluded.expires_at,attempts=0;
 return jsonb_build_object('ok',true,'valid_minutes',15);
end $$;

create or replace function public.rosie_retail_confirm_handoff_v913(
 p_order uuid,p_staff uuid,p_hash text,p_attested boolean,p_note text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare f public.rosie_retail_finance_v913%rowtype;
declare h public.rosie_retail_handoffs_v913%rowtype;
declare o public.rosie_retail_order_requests_v912%rowtype;
declare item jsonb; product uuid; qty integer;
begin
 if p_staff is null or p_attested is distinct from true or
 length(trim(coalesce(p_note,'')))<12 or length(trim(p_note))>400 then
  raise exception 'Signed staff, physical-custody attestation and note required';end if;
 select * into o from public.rosie_retail_order_requests_v912 where id=p_order for update;
 if not found or o.status<>'quoted' then raise exception 'Quoted original order required';end if;
 select * into f from public.rosie_retail_finance_v913 where order_id=p_order for update;
 if not found or f.payment_state<>'paid' then raise exception 'Original unrefunded payment required';end if;
 select * into h from public.rosie_retail_handoffs_v913 where order_id=p_order for update;
 if not found or h.handoff_at is not null or h.expires_at<=now() or h.attempts>=8 then
  raise exception 'Handoff unavailable or expired';end if;
 -- Do not compare plaintext: only SHA-256 server-derived pin hash persists.
 if h.confirmation_hash<>p_hash then
   update public.rosie_retail_handoffs_v913 set attempts=attempts+1 where order_id=p_order;
   return jsonb_build_object('ok',false,'reason','invalid_customer_token');
 end if;
 for item in select * from jsonb_array_elements(o.lines) loop
   product:=(item->>'product_id')::uuid;
   qty:=(item->>'quantity')::integer;
   if qty<=0 then raise exception 'Invalid original stock quantity';end if;
   update public.rosie_retail_products_v912 set stock_on_hand=stock_on_hand-qty,
    updated_at=now() where id=product and stock_on_hand>=qty and active=true;
   if not found then raise exception 'Insufficient original stock for physical handoff';end if;
   insert into public.rosie_retail_stock_movements_v913(order_id,product_id,quantity)
    values(p_order,product,qty);
 end loop;
 update public.rosie_retail_handoffs_v913 set handoff_at=now(),
   confirmed_by_staff_user_id=p_staff,customer_present_attested=true,
   handoff_note=trim(p_note) where order_id=p_order;
 return jsonb_build_object('ok',true,'physical_handoff_staff_attested',true);
end $$;

do $$
declare fn text;
begin
 foreach fn in array array[
  'rosie_retail_register_checkout_v913(uuid,text,integer)',
  'rosie_retail_settle_stripe_v913(uuid,text,text,integer,text)',
  'rosie_retail_request_refund_v913(uuid,uuid,integer,text)',
  'rosie_retail_record_refund_provider_v913(uuid,text)',
  'rosie_retail_settle_refund_v913(text,integer,text)',
  'rosie_retail_issue_handoff_pin_v913(uuid,text)',
  'rosie_retail_confirm_handoff_v913(uuid,uuid,text,boolean,text)'
 ] loop
   execute 'revoke all on function public.'||fn||' from public,anon,authenticated';
   execute 'grant execute on function public.'||fn||' to service_role';
 end loop;
end $$;
comment on table public.rosie_retail_invoices_v913 is
 'Provider-verified payment creates a numbered internal issued invoice record and HST evidence; filing/accountant attestation remains separate.';
comment on table public.rosie_retail_finance_v913 is
 'Stripe-only original verified retail branch. No service booking deposit ledger mutation, bank proof, settlement payout or sale claim without signed provider confirmation.';
