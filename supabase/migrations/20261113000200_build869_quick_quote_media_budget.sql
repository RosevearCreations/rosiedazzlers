-- Rosie 869: staff-only roadside capture, quote preparation, and verified link
-- to a separately created canonical booking. Never creates a deposit/payment.
alter table public.rosie_detailing_intake_v868
 add column if not exists customer_name text,
 add column if not exists customer_phone text,
 add column if not exists customer_email text,
 add column if not exists contact_permission boolean not null default false,
 add column if not exists private_photo_permission boolean not null default false,
 add column if not exists photo_permission_recorded_at timestamptz,
 add column if not exists quote_cents integer,
 add column if not exists quote_review_state text not null default 'needs_review',
 add column if not exists linked_booking_id uuid references public.bookings(id) on delete restrict,
 add column if not exists linked_at timestamptz,
 add column if not exists linked_by_staff text;
alter table public.rosie_detailing_intake_v868
 add constraint rosie869_quote_amount check(quote_cents is null or quote_cents between 1 and 10000000),
 add constraint rosie869_quote_state check(quote_review_state in('needs_review','estimate_prepared','booking_linked')),
 add constraint rosie869_contact_shape check(
  (contact_permission and
    (nullif(customer_name,'') is not null or nullif(customer_email,'') is not null or nullif(customer_phone,'') is not null))
  or (not contact_permission and customer_name is null and customer_email is null and customer_phone is null)),
 add constraint rosie869_contact_lengths check(
  (customer_name is null or char_length(customer_name) between 2 and 100) and
  (customer_phone is null or char_length(customer_phone) between 7 and 32) and
  (customer_email is null or char_length(customer_email) between 5 and 180)),
 add constraint rosie869_link_pair check(
  (linked_booking_id is null and linked_at is null and linked_by_staff is null and quote_review_state<>'booking_linked')
  or (linked_booking_id is not null and linked_at is not null and linked_by_staff is not null and quote_review_state='booking_linked'));
create unique index rosie869_one_intake_per_booking on public.rosie_detailing_intake_v868(linked_booking_id)
 where linked_booking_id is not null;

-- Service-only read; reserved bytes include both verified and pending uploads
-- to prevent repeated abandoned attempts from evading a small storage budget.
create function public.rosie869_storage_meter()
 returns table(reserved_bytes bigint,stored_bytes bigint,pending_bytes bigint,
  file_count bigint,draft_count bigint)
 language sql security invoker set search_path='' as $$
 select coalesce(sum(m.expected_bytes),0)::bigint,
  coalesce(sum(m.expected_bytes) filter(where m.status='stored_private'),0)::bigint,
  coalesce(sum(m.expected_bytes) filter(where m.status='pending_upload'),0)::bigint,
  count(m.id)::bigint,
  (select count(*)::bigint from public.rosie_detailing_intake_v868)
 from public.rosie_detailing_intake_media_v868 m;
 $$;
revoke all on function public.rosie869_storage_meter() from public,anon,authenticated;
grant execute on function public.rosie869_storage_meter() to service_role;

-- Atomic bucket-wide admission, including pending upload reservation. This does
-- not issue a storage URL; the trusted server signs a private short-lived URL.
create function public.rosie869_reserve_media(
 p_draft_id uuid,p_media_id uuid,p_object_path text,p_filename text,
 p_content_type text,p_expected_bytes bigint,p_budget_bytes bigint)
 returns table(outcome text,reserved_bytes bigint,budget_bytes bigint)
 language plpgsql security invoker set search_path='' as $$
declare used_bytes bigint;draft_count int;rec record;max_file bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('rosie-intake-private-budget-v869',869));
 select * into rec from public.rosie_detailing_intake_v868
 where id=p_draft_id and status='intake_draft' for update;
 if rec.id is null or rec.expires_at<=clock_timestamp()
   or rec.private_photo_permission is distinct from true
 then raise exception 'Current authorized owner photo-consent draft required';end if;
 if p_budget_bytes<104857600 or p_budget_bytes>10737418240
 then raise exception 'Unsupported storage budget';end if;
 if p_content_type in('image/jpeg','image/png','image/webp','image/heic')
 then max_file:=12582912;
 elsif p_content_type in('video/mp4','video/quicktime','video/webm')
 then max_file:=41943040;
 else raise exception 'Unsupported private media type';end if;
 if p_expected_bytes<1 or p_expected_bytes>max_file
 then raise exception 'Invalid media size';end if;
 if p_object_path !~ ('^intakes/'||p_draft_id::text||'/'||
       p_media_id::text||'\.(jpg|png|webp|heic|mp4|mov|webm)$')
 then raise exception 'Invalid scoped object path';end if;
 select count(*) into draft_count from public.rosie_detailing_intake_media_v868
 where draft_id=p_draft_id;
 if draft_count>=8 then
  return query select 'DRAFT_MEDIA_LIMIT_HOLD'::text,0::bigint,p_budget_bytes;
  return;
 end if;
 select coalesce(sum(expected_bytes),0)::bigint into used_bytes
 from public.rosie_detailing_intake_media_v868;
 if used_bytes+p_expected_bytes>p_budget_bytes then
  return query select 'STORAGE_BUDGET_HOLD'::text,used_bytes,p_budget_bytes;
  return;
 end if;
 insert into public.rosie_detailing_intake_media_v868(
  id,draft_id,bucket,object_path,original_filename,content_type,expected_bytes,status)
 values(p_media_id,p_draft_id,'rosie-intake-private',p_object_path,p_filename,
   p_content_type,p_expected_bytes,'pending_upload');
 return query select 'RESERVED'::text,used_bytes+p_expected_bytes,p_budget_bytes;
end $$;
revoke all on function public.rosie869_reserve_media(
 uuid,uuid,text,text,text,bigint,bigint) from public,anon,authenticated;
grant execute on function public.rosie869_reserve_media(
 uuid,uuid,text,text,text,bigint,bigint) to service_role;

-- Secure manual conversion link. Booking itself is created by the standard
-- checkout (availability, pricing, consent, payment unchanged). This function
-- only records an existing non-cancelled booking after exact email matching.
create function public.rosie869_link_existing_booking(
 p_draft_id uuid,p_booking_id uuid,p_actor text)
 returns table(outcome text,booked_total_cents integer,booked_deposit_cents integer)
 language plpgsql security invoker set search_path='' as $$
declare d record;b record;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_draft_id::text,869));
 select * into d from public.rosie_detailing_intake_v868
  where id=p_draft_id and status='intake_draft' for update;
 if d.id is null or d.linked_booking_id is not null
   or d.expires_at<=clock_timestamp()
   or d.contact_permission is distinct from true
   or d.quote_cents is null
   or nullif(d.customer_email,'') is null
 then raise exception 'Original quoted and consented unlinked draft required';end if;
 select id,customer_email,status,price_total_cents,deposit_cents into b
 from public.bookings where id=p_booking_id;
 if b.id is null or b.status='cancelled'
   or lower(trim(b.customer_email)) is distinct from lower(trim(d.customer_email))
 then raise exception 'Exact canonical booking and matching customer email required';end if;
 if exists(select 1 from public.rosie_detailing_intake_v868
  where linked_booking_id=p_booking_id) then
  raise exception 'Canonical booking already linked to a different intake';end if;
 if p_actor is null or char_length(p_actor) not between 3 and 140
 then raise exception 'Original staff actor required';end if;
 update public.rosie_detailing_intake_v868 set
  linked_booking_id=p_booking_id,linked_at=clock_timestamp(),
  linked_by_staff=p_actor,quote_review_state='booking_linked',
  updated_at=clock_timestamp()
 where id=p_draft_id;
 return query select 'LINKED_NOT_PAYMENT_PROOF'::text,
  b.price_total_cents::integer,b.deposit_cents::integer;
end $$;
revoke all on function public.rosie869_link_existing_booking(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.rosie869_link_existing_booking(uuid,uuid,text)
 to service_role;
comment on function public.rosie869_link_existing_booking(uuid,uuid,text) is
 'Explicit link to existing canonical customer booking only. Never records payment receipt or overrides price/deposit/availability.';
