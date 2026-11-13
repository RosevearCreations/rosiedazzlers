-- Rosie 872: private provider-confirmed quote receipts, refund exception cases and
-- original-browser challenge ledger. Requires original Build 868-871 migrations.
create table if not exists public.rosie_roadside_dispatches_v872 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 share_id uuid not null unique references public.rosie_roadside_quote_shares_v870(id) on delete cascade,
 channel text not null check (channel in ('email','sms')),
 recipient_hash text not null check(recipient_hash ~ '^[0-9a-f]{64}$'),
 actor text not null check(length(actor) between 3 and 140),
 provider text check(provider is null or length(provider) between 1 and 80),
 provider_message_id text check(provider_message_id is null or length(provider_message_id) between 8 and 160),
 state text not null default 'claimed' check (state in
  ('claimed','provider_accepted','dispatch_unknown','delivery_confirmed','delivery_failed','receipt_after_withdrawal')),
 created_at timestamptz not null default clock_timestamp(),
 provider_accepted_at timestamptz,
 receipt_at timestamptz
);
create index if not exists rosie872_dispatch_draft_time
 on public.rosie_roadside_dispatches_v872(draft_id,created_at desc);
alter table public.rosie_roadside_dispatches_v872 enable row level security;
revoke all on public.rosie_roadside_dispatches_v872 from public,anon,authenticated;
grant select,insert,update on public.rosie_roadside_dispatches_v872 to service_role;

create table if not exists public.rosie_roadside_provider_receipts_v872 (
 id uuid primary key,
 dispatch_id uuid not null references public.rosie_roadside_dispatches_v872(id) on delete cascade,
 provider_event_id text not null unique check(length(provider_event_id) between 8 and 160),
 provider_message_id text not null check(length(provider_message_id) between 8 and 160),
 event_type text not null check(event_type in ('delivered','failed','bounced')),
 effective_state text not null check(effective_state in
  ('delivery_confirmed','delivery_failed','receipt_after_withdrawal')),
 received_at timestamptz not null default clock_timestamp(),
 signature_verified boolean not null default true check(signature_verified=true)
);
create index if not exists rosie872_receipt_dispatch_time
 on public.rosie_roadside_provider_receipts_v872(dispatch_id,received_at desc);
alter table public.rosie_roadside_provider_receipts_v872 enable row level security;
revoke all on public.rosie_roadside_provider_receipts_v872 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_provider_receipts_v872 to service_role;

create table if not exists public.rosie_roadside_refund_cases_v872 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 source_check_id uuid not null references public.rosie_roadside_net_deposit_checks_v871(id),
 issue_code text not null check(issue_code in ('deposit_hold','refund_detected')),
 state text not null default 'open' check(state in ('open','reviewed_hold','closed_verified')),
 opened_by text not null check(length(opened_by) between 3 and 140),
 opened_at timestamptz not null default clock_timestamp(),
 owner_reviewed_by text,
 owner_reviewed_at timestamptz,
 resolution_note text check(resolution_note is null or length(resolution_note) between 12 and 500),
 closed_source_check_id uuid references public.rosie_roadside_net_deposit_checks_v871(id),
 closed_at timestamptz
);
create unique index if not exists rosie872_refund_one_open_per_booking
 on public.rosie_roadside_refund_cases_v872(booking_id)
 where state in ('open','reviewed_hold');
create index if not exists rosie872_refund_case_timeline
 on public.rosie_roadside_refund_cases_v872(draft_id,opened_at desc);
alter table public.rosie_roadside_refund_cases_v872 enable row level security;
revoke all on public.rosie_roadside_refund_cases_v872 from public,anon,authenticated;
grant select,insert,update on public.rosie_roadside_refund_cases_v872 to service_role;

create table if not exists public.rosie_roadside_device_challenges_v872 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete cascade,
 challenge_nonce text not null check(challenge_nonce ~ '^[0-9a-f]{64}$'),
 issued_by text not null check(length(issued_by) between 3 and 140),
 issued_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 completed_at timestamptz,
 media_id uuid references public.rosie_detailing_intake_media_v868(id),
 public_key_digest text check(public_key_digest is null or public_key_digest ~ '^[0-9a-f]{64}$'),
 camera_api_available boolean not null default false,
 state text not null default 'challenge_pending'
  check(state in ('challenge_pending','browser_proof_complete','owner_accepted')),
 owner_accepted_by text,
 owner_accepted_at timestamptz,
 check(expires_at>issued_at),
 check((state='challenge_pending' and completed_at is null and media_id is null)
  or (state in ('browser_proof_complete','owner_accepted') and completed_at is not null and media_id is not null))
);
create index if not exists rosie872_device_draft_time
 on public.rosie_roadside_device_challenges_v872(draft_id,issued_at desc);
alter table public.rosie_roadside_device_challenges_v872 enable row level security;
revoke all on public.rosie_roadside_device_challenges_v872 from public,anon,authenticated;
grant select,insert,update on public.rosie_roadside_device_challenges_v872 to service_role;

-- One claim per share even on provider timeout; prevents retry-based double sends.
-- Staff authorization occurs in the Worker; SQL rechecks consent under a draft lock.
create or replace function public.rosie872_claim_quote_dispatch(
 p_id uuid,p_draft_id uuid,p_share_id uuid,p_token_hash text,
 p_channel text,p_recipient_hash text,p_actor text)
returns table(outcome text,recipient_email text)
language plpgsql security invoker set search_path='' as $$
declare d record;s record;t timestamptz:=clock_timestamp();
begin
 select * into d from public.rosie_detailing_intake_v868
 where id=p_draft_id for update;
 if d.id is null or d.status<>'intake_draft' or d.expires_at<=t
  or d.contact_permission is distinct from true
  or d.quote_share_withdrawn_at is not null
  or nullif(d.customer_email,'') is null then
  raise exception 'Active original customer delivery consent required';end if;
 select * into s from public.rosie_roadside_quote_shares_v870
 where id=p_share_id and draft_id=p_draft_id for update;
 if s.id is null or s.revoked_at is not null or s.expires_at<=t
  or s.token_hash<>p_token_hash or s.quote_snapshot_cents<>d.quote_cents then
  raise exception 'Original quote share token, consent or estimate changed';end if;
 if p_channel not in ('email','sms') or
  p_recipient_hash !~ '^[0-9a-f]{64}$' or
  p_token_hash !~ '^[0-9a-f]{64}$' or
  coalesce(length(p_actor),0) not between 3 and 140 then
   raise exception 'Invalid original provider-send claim';end if;
 -- This release sends to the saved, consented email only. SMS requires
 -- a separately provisioned address/number authority and remains disabled.
 if p_channel<>'email' then raise exception 'SMS provider delivery is not enrolled';end if;
 insert into public.rosie_roadside_dispatches_v872
 (id,draft_id,share_id,channel,recipient_hash,actor)
 values(p_id,p_draft_id,p_share_id,p_channel,p_recipient_hash,p_actor);
 return query select 'CLAIMED_ONCE'::text,d.customer_email::text;
end $$;

-- Provider confirmation is admitted ONLY after the Worker verified an
-- HMAC signature with a dedicated secret. Never accept a staff assertion here.
create or replace function public.rosie872_admit_provider_receipt(
 p_receipt_id uuid,p_dispatch_id uuid,p_provider_event_id text,
 p_provider_message_id text,p_event_type text)
returns table(outcome text)
language plpgsql security invoker set search_path='' as $$
declare s record;d record;w record;t timestamptz:=clock_timestamp();answer text;
begin
 select * into s from public.rosie_roadside_dispatches_v872
 where id=p_dispatch_id for update;
 if s.id is null or s.state not in ('provider_accepted','delivery_confirmed','delivery_failed','receipt_after_withdrawal')
  or s.provider_message_id is distinct from p_provider_message_id or
  coalesce(length(p_provider_event_id),0) not between 8 and 160 or
  p_event_type not in ('delivered','failed','bounced') then
  raise exception 'Original provider dispatch/receipt identity mismatch';end if;
 select * into d from public.rosie_detailing_intake_v868 where id=s.draft_id for update;
 select * into w from public.rosie_roadside_quote_shares_v870 where id=s.share_id;
 if d.quote_share_withdrawn_at is not null or d.contact_permission is distinct from true
   or w.revoked_at is not null then answer:='receipt_after_withdrawal';
 elsif p_event_type='delivered' then answer:='delivery_confirmed';
 else answer:='delivery_failed';end if;
 insert into public.rosie_roadside_provider_receipts_v872
  (id,dispatch_id,provider_event_id,provider_message_id,event_type,effective_state)
 values(p_receipt_id,p_dispatch_id,p_provider_event_id,p_provider_message_id,p_event_type,answer);
 update public.rosie_roadside_dispatches_v872
 set state=answer,receipt_at=t where id=s.id;
 return query select answer;
end $$;

-- Finance case cannot be closed while the latest provider source is on HOLD,
-- stale, unrelated, or not explicitly verified. No refund/payment is mutated.
create or replace function public.rosie872_review_refund_case(
 p_case_id uuid,p_latest_check_id uuid,p_actor text,
 p_decision text,p_note text)
returns table(outcome text)
language plpgsql security invoker set search_path='' as $$
declare c record;v record;t timestamptz:=clock_timestamp();
begin
 select * into c from public.rosie_roadside_refund_cases_v872
 where id=p_case_id for update;
 if c.id is null or c.state='closed_verified' then raise exception 'Open original refund case required';end if;
 if p_decision not in ('review_hold','close_verified') or
  coalesce(length(p_actor),0) not between 3 and 140 or
  coalesce(length(trim(p_note)),0) not between 12 and 500 then
   raise exception 'Owner review decision and reasoning required';end if;
 select * into v from public.rosie_roadside_net_deposit_checks_v871
 where booking_id=c.booking_id and draft_id=c.draft_id
 order by checked_at desc,id desc limit 1;
 if v.id is null or v.id<>p_latest_check_id then
  raise exception 'Owner must review exact latest original deposit check';end if;
 if p_decision='close_verified' then
   if v.net_verified is distinct from true or v.checked_at<t-interval '15 minutes'
    or v.gross_cents is null or v.refunded_cents is null or v.net_cents is null
    or v.net_cents+v.refunded_cents<>v.gross_cents then
    raise exception 'Current original provider net deposit evidence remains on HOLD';end if;
 end if;
 update public.rosie_roadside_refund_cases_v872
 set state=case when p_decision='close_verified' then 'closed_verified' else 'reviewed_hold' end,
  owner_reviewed_by=p_actor,owner_reviewed_at=t,
  closed_source_check_id=case when p_decision='close_verified' then p_latest_check_id else null end,
  closed_at=case when p_decision='close_verified' then t else null end,
  resolution_note=trim(p_note)
 where id=p_case_id;
 return query select case when p_decision='close_verified'
  then 'CLOSED_SOURCE_VERIFIED'::text else 'HOLD_REVIEWED'::text end;
end $$;

revoke all on function public.rosie872_claim_quote_dispatch(uuid,uuid,uuid,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie872_claim_quote_dispatch(uuid,uuid,uuid,text,text,text,text) to service_role;
revoke all on function public.rosie872_admit_provider_receipt(uuid,uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie872_admit_provider_receipt(uuid,uuid,text,text,text) to service_role;
revoke all on function public.rosie872_review_refund_case(uuid,uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie872_review_refund_case(uuid,uuid,text,text,text) to service_role;
