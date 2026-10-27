-- Any events submitted sequentially inside a single audited transaction must
-- preserve actual evidence order; now() is transaction-stable, not a clock.
alter table public.gift_issuance_review_followup_events
  alter column created_at set default clock_timestamp();
