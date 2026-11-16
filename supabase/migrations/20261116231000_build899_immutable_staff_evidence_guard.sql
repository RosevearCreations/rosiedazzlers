-- Build 899 companion protection. Supabase's service_role may possess inherited
-- UPDATE/DELETE despite scoped grants, so enforce immutable evidence in the database.
create or replace function public.rosie899_reject_record_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
 raise exception using errcode='42501',message='Rosie 899 original staff evidence is append-only. Revisions require a new signed record.';
end;
$$;
revoke all on function public.rosie899_reject_record_mutation() from public, anon, authenticated;

drop trigger if exists rosie899_equipment_immutable on public.rosie_equipment_service_v899;
create trigger rosie899_equipment_immutable before update or delete
 on public.rosie_equipment_service_v899 for each row
 execute function public.rosie899_reject_record_mutation();
drop trigger if exists rosie899_equipment_no_truncate on public.rosie_equipment_service_v899;
create trigger rosie899_equipment_no_truncate before truncate
 on public.rosie_equipment_service_v899 for each statement
 execute function public.rosie899_reject_record_mutation();

drop trigger if exists rosie899_count_immutable on public.rosie_inventory_count_reviews_v899;
create trigger rosie899_count_immutable before update or delete
 on public.rosie_inventory_count_reviews_v899 for each row
 execute function public.rosie899_reject_record_mutation();
drop trigger if exists rosie899_count_no_truncate on public.rosie_inventory_count_reviews_v899;
create trigger rosie899_count_no_truncate before truncate
 on public.rosie_inventory_count_reviews_v899 for each statement
 execute function public.rosie899_reject_record_mutation();

comment on function public.rosie899_reject_record_mutation() is
 'Reject UPDATE, DELETE and TRUNCATE of Build 899 original staff evidence, including inherited service_role privileges.';
