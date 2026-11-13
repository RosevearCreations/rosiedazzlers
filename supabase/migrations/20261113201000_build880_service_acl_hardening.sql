-- Rosie 880: hosted existing-table service-role ACL correction.
-- Some projects grant all on new public tables by default, and GRANT SELECT,INSERT
-- does not revoke inherited UPDATE/DELETE. Defense in depth with append-only triggers.
revoke update,delete,truncate,references,trigger
 on public.rosie_roadside_native_watch_v880 from service_role;
revoke update,delete,truncate,references,trigger
 on public.rosie_roadside_rotation_receipts_v880 from service_role;
grant select,insert on public.rosie_roadside_native_watch_v880 to service_role;
grant select,insert on public.rosie_roadside_rotation_receipts_v880 to service_role;
