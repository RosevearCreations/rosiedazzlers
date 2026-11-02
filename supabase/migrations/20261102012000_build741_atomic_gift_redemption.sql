-- Build 741: one gift-only booking redemption per verified certificate.
-- This does not issue, send, charge, refund or activate gift delivery.
-- The legacy two-request INSERT/PATCH redemption path was non-atomic.
create unique index if not exists gift_certificate_redemptions_booking_once_v741
  on public.gift_certificate_redemptions (booking_id)
  where booking_id is not null;

create or replace function public.redeem_gift_certificate_booking_v741(
  p_gift_certificate_id uuid,
  p_booking_id uuid,
  p_amount_cents integer
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_gift public.gift_certificates%rowtype;
  v_booking public.bookings%rowtype;
  v_prior public.gift_certificate_redemptions%rowtype;
  v_ledger bigint;
  v_next integer;
begin
  if p_gift_certificate_id is null or p_booking_id is null or p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'invalid gift redemption intent';
  end if;
  -- Serialize concurrent redemptions for the same certificate.
  select * into v_gift from public.gift_certificates
   where id = p_gift_certificate_id for update;
  if not found then raise exception 'certificate not found'; end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found'; end if;

  -- The same booking may only be credited once, including replayed requests.
  select * into v_prior from public.gift_certificate_redemptions
   where booking_id = p_booking_id limit 1;
  if found then
    if v_prior.gift_certificate_id <> p_gift_certificate_id or v_prior.amount_cents <> p_amount_cents then
      raise exception 'gift redemption replay mismatch; owner review required';
    end if;
    return jsonb_build_object('outcome','replayed','amount_cents',v_prior.amount_cents,
      'remaining_cents',v_gift.remaining_cents);
  end if;

  if v_booking.status <> 'pending' then raise exception 'booking not pending; owner review required'; end if;
  if v_gift.status <> 'active' or (v_gift.expires_at is not null and v_gift.expires_at <= now()) then
    raise exception 'gift unavailable for redemption';
  end if;
  if upper(v_gift.currency) <> 'CAD' or v_gift.remaining_cents < p_amount_cents then
    raise exception 'gift balance or currency mismatch';
  end if;
  if (v_gift.package_code is not null and v_gift.package_code <> v_booking.package_code) or
     (v_gift.vehicle_size is not null and v_gift.vehicle_size <> v_booking.vehicle_size) then
    raise exception 'gift does not match booking package/size';
  end if;
  select coalesce(sum(amount_cents),0) into v_ledger
   from public.gift_certificate_redemptions
   where gift_certificate_id = p_gift_certificate_id;
  if v_gift.face_value_cents - v_gift.remaining_cents <> v_ledger then
    raise exception 'historical balance and redemption evidence disagree; owner review required';
  end if;

  v_next := v_gift.remaining_cents - p_amount_cents;
  insert into public.gift_certificate_redemptions
    (gift_certificate_id, booking_id, amount_cents, notes)
  values (p_gift_certificate_id, p_booking_id, p_amount_cents,
    'Build 741: atomic gift-covered deposit; original booking proof required');
  update public.gift_certificates
   set remaining_cents = v_next,
       status = case when v_next = 0 then 'redeemed' else 'active' end,
       redeemed_at = case when v_next = 0 then now() else null end
   where id = p_gift_certificate_id;
  return jsonb_build_object('outcome','redeemed','amount_cents',p_amount_cents,
    'remaining_cents',v_next);
end;
$$;

revoke all on function public.redeem_gift_certificate_booking_v741(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function public.redeem_gift_certificate_booking_v741(uuid,uuid,integer)
  to service_role;
