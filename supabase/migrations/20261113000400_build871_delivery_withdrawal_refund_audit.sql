-- Rosie Dazzlers 871 — original-project, service-only consent and refund audit.
-- Apply after 20261113000300_build870_roadside_quote_sharing.sql.
alter table public.rosie_detailing_intake_v868
 add column if not exists quote_share_withdrawn_at timestamptz,
 add column if not exists private_capture_withdrawn_at timestamptz;

-- Withdrawal cannot be silently reversed by the older Build 869 save form.
create or replace function public.rosie871_protect_withdrawn_consent()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.quote_share_withdrawn_at is not null and
   (new.quote_share_withdrawn_at is distinct from old.quote_share_withdrawn_at
     or new.contact_permission is distinct from false
     or new.customer_name is not null or new.customer_phone is not null
     or new.customer_email is not null)
 then raise exception 'Quote sharing permanently withdrawn for this draft; create a new consented request'; end if;
 if old.private_capture_withdrawn_at is not null and
   (new.private_capture_withdrawn_at is distinct from old.private_capture_withdrawn_at
    or new.private_photo_permission is distinct from false)
 then raise exception 'Private capture withdrawn for this draft';end if;
 return new;
end $$;
drop trigger if exists rosie871_protect_withdrawn_consent on public.rosie_detailing_intake_v868;
create trigger rosie871_protect_withdrawn_consent
 before update on public.rosie_detailing_intake_v868
 for each row execute function public.rosie871_protect_withdrawn_consent();
revoke all on function public.rosie871_protect_withdrawn_consent() from public,anon,authenticated;

create table if not exists public.rosie_roadside_delivery_audit_v871 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 share_id uuid references public.rosie_roadside_quote_shares_v870(id) on delete set null,
 event_type text not null check (event_type in
  ('staff_handoff_attested','customer_receipt_attested','delivery_failed','consent_withdrawn')),
 channel text not null check (channel in
  ('in_person','email_manual','sms_manual','phone_manual','other_manual','none')),
 actor text not null check (char_length(actor) between 3 and 140),
 occurred_at timestamptz not null default clock_timestamp(),
 independent_provider_delivery_proof boolean not null default false
  check (independent_provider_delivery_proof = false),
 stopped_future_capture boolean not null default false,
 check ((event_type='consent_withdrawn' and channel='none') or
        (event_type<>'consent_withdrawn' and share_id is not null and channel<>'none'))
);
create index if not exists rosie871_delivery_audit_timeline
 on public.rosie_roadside_delivery_audit_v871(draft_id,occurred_at desc);
alter table public.rosie_roadside_delivery_audit_v871 enable row level security;
revoke all on public.rosie_roadside_delivery_audit_v871 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_delivery_audit_v871 to service_role;

create table if not exists public.rosie_roadside_net_deposit_checks_v871 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 checked_by_staff text not null check (char_length(checked_by_staff) between 3 and 140),
 checked_at timestamptz not null default clock_timestamp(),
 provider text not null check (provider in ('stripe','paypal','gift','unknown')),
 state text not null check (state in
  ('net_deposit_intact','partial_refund_verified','full_refund_verified',
   'refund_review_hold','provider_unavailable_hold','deposit_unverified_hold',
   'gift_only_no_cash_deposit')),
 gross_cents integer check (gross_cents is null or gross_cents>=0),
 refunded_cents integer check (refunded_cents is null or refunded_cents>=0),
 net_cents integer check (net_cents is null or net_cents>=0),
 net_verified boolean not null default false,
 source text not null check (source in ('stripe_live','paypal_live','original_booking')),
 check (
  (net_verified and gross_cents is not null and refunded_cents is not null and net_cents is not null
    and gross_cents=refunded_cents+net_cents
    and state in ('net_deposit_intact','partial_refund_verified','full_refund_verified'))
  or (not net_verified and net_cents is null)
 )
);
create index if not exists rosie871_net_deposit_checks_timeline
 on public.rosie_roadside_net_deposit_checks_v871(booking_id,checked_at desc);
alter table public.rosie_roadside_net_deposit_checks_v871 enable row level security;
revoke all on public.rosie_roadside_net_deposit_checks_v871 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_net_deposit_checks_v871 to service_role;

-- Atomic recheck closes a race between issue and consent withdrawal; the
-- plaintext bearer token never reaches SQL, only its SHA-256 digest.
create or replace function public.rosie871_issue_roadside_share(
 p_share_id uuid,p_draft_id uuid,p_token_hash text,p_package_code text,
 p_vehicle_size text,p_actor text)
returns table(outcome text,quote_amount_cents integer,valid_until timestamptz)
language plpgsql security invoker set search_path='' as $$
declare d record;t timestamptz:=clock_timestamp();
begin
 select * into d from public.rosie_detailing_intake_v868
  where id=p_draft_id for update;
 if d.id is null or d.status<>'intake_draft' or d.expires_at<=t
  or d.quote_share_withdrawn_at is not null
  or d.contact_permission is distinct from true
  or nullif(d.customer_email,'') is null
  or d.quote_cents is null or d.quote_cents<1
  or d.linked_booking_id is not null
 then raise exception 'Active consented quote draft required';end if;
 if p_token_hash !~ '^[0-9a-f]{64}$' or
    coalesce(char_length(p_actor),0) not between 3 and 140
 then raise exception 'Original issuer and hash required';end if;
 if p_package_code is not null and p_package_code not in
  ('premium_wash','basic_detail','complete_detail','interior_detail','exterior_detail')
 then raise exception 'Unknown package';end if;
 if p_vehicle_size is not null and p_vehicle_size not in ('small','mid','oversize')
 then raise exception 'Unknown size';end if;
 if exists(select 1 from public.rosie_roadside_quote_shares_v870
  where draft_id=p_draft_id and revoked_at is null)
 then raise exception 'Revoke old link before issuing another';end if;
 insert into public.rosie_roadside_quote_shares_v870(
  id,draft_id,token_hash,quote_snapshot_cents,package_code,vehicle_size,
  purpose,consent_attested,consent_recorded_at,created_by_staff,created_at,expires_at)
 values(p_share_id,p_draft_id,p_token_hash,d.quote_cents,p_package_code,p_vehicle_size,
  'quote_and_booking_only',true,t,p_actor,t,t+interval '7 days');
 return query select 'ISSUED_CONSENTED'::text,d.quote_cents::integer,t+interval '7 days';
end $$;

create or replace function public.rosie871_record_quote_delivery(
 p_event_id uuid,p_draft_id uuid,p_share_id uuid,p_actor text,
 p_event_type text,p_channel text)
returns table(outcome text)
language plpgsql security invoker set search_path='' as $$
declare d record;s record;t timestamptz:=clock_timestamp();
begin
 select * into d from public.rosie_detailing_intake_v868
  where id=p_draft_id for update;
 if d.id is null or d.status<>'intake_draft' or d.expires_at<=t
  or d.contact_permission is distinct from true or
  d.quote_share_withdrawn_at is not null
 then raise exception 'Customer quote permission withdrawn or original draft unavailable';end if;
 select * into s from public.rosie_roadside_quote_shares_v870
 where id=p_share_id and draft_id=p_draft_id for update;
 if s.id is null or s.revoked_at is not null or s.expires_at<=t
 then raise exception 'Active original quote link required';end if;
 if p_event_type not in
  ('staff_handoff_attested','customer_receipt_attested','delivery_failed')
  or p_channel not in
  ('in_person','email_manual','sms_manual','phone_manual','other_manual')
  or coalesce(char_length(p_actor),0) not between 3 and 140
 then raise exception 'Invalid staff delivery attestation';end if;
 insert into public.rosie_roadside_delivery_audit_v871(
  id,draft_id,share_id,event_type,channel,actor)
 values(p_event_id,p_draft_id,p_share_id,p_event_type,p_channel,p_actor);
 return query select 'STAFF_ATTESTATION_RECORDED_NOT_PROVIDER_DELIVERY_PROOF'::text;
end $$;

create or replace function public.rosie871_withdraw_quote_consent(
 p_event_id uuid,p_draft_id uuid,p_actor text,p_stop_private_capture boolean)
returns table(outcome text,links_revoked integer,private_capture_stopped boolean)
language plpgsql security invoker set search_path='' as $$
declare d record;t timestamptz:=clock_timestamp();count_revoked integer:=0;
begin
 select * into d from public.rosie_detailing_intake_v868 where id=p_draft_id for update;
 if d.id is null or d.status<>'intake_draft' then
  raise exception 'Original private draft not found';end if;
 if coalesce(char_length(p_actor),0) not between 3 and 140 then
  raise exception 'Original staff actor required';end if;
 if d.quote_share_withdrawn_at is not null and
   (p_stop_private_capture is distinct from true or d.private_capture_withdrawn_at is not null)
 then
  return query select 'ALREADY_WITHDRAWN'::text,0::integer,
    (d.private_capture_withdrawn_at is not null);
  return;
 end if;
 update public.rosie_detailing_intake_v868 set
  contact_permission=false,customer_name=null,customer_email=null,customer_phone=null,
  quote_share_withdrawn_at=coalesce(quote_share_withdrawn_at,t),
  private_photo_permission=case when p_stop_private_capture is true then false else private_photo_permission end,
  private_capture_withdrawn_at=case when p_stop_private_capture is true then
      coalesce(private_capture_withdrawn_at,t) else private_capture_withdrawn_at end,
  updated_at=t where id=p_draft_id;
 update public.rosie_roadside_quote_shares_v870 set revoked_at=t
  where draft_id=p_draft_id and revoked_at is null;
 get diagnostics count_revoked=row_count;
 insert into public.rosie_roadside_delivery_audit_v871(
  id,draft_id,event_type,channel,actor,stopped_future_capture)
 values(p_event_id,p_draft_id,'consent_withdrawn','none',p_actor,
  p_stop_private_capture is true);
 return query select 'WITHDRAWN_AND_REVOKED'::text,count_revoked,p_stop_private_capture is true;
end $$;

revoke all on function public.rosie871_issue_roadside_share(uuid,uuid,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie871_issue_roadside_share(uuid,uuid,text,text,text,text)
 to service_role;
revoke all on function public.rosie871_record_quote_delivery(uuid,uuid,uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie871_record_quote_delivery(uuid,uuid,uuid,text,text,text)
 to service_role;
revoke all on function public.rosie871_withdraw_quote_consent(uuid,uuid,text,boolean)
 from public,anon,authenticated;
grant execute on function public.rosie871_withdraw_quote_consent(uuid,uuid,text,boolean)
 to service_role;
