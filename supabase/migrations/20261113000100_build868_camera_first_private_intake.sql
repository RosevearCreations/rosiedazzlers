-- Rosie 868: private camera-first DETAILING INTAKE DRAFT, NOT an appointment.
-- Existing original RosieDazzlers project, no booking/capacity/payment mutation.
create table public.rosie_detailing_intake_v868(
 id uuid primary key,
 temporary_label text not null unique check(temporary_label ~ '^RD-TMP-[0-9]{8}-[A-F0-9]{8}$'),
 display_title text not null check(char_length(display_title) between 3 and 100),
 notes text not null default '' check(char_length(notes)<=3000),
 status text not null default 'intake_draft' check(status='intake_draft'),
 created_by_staff text not null check(char_length(created_by_staff) between 3 and 140),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '30 days')
);
create index rosie868_draft_recent on public.rosie_detailing_intake_v868
 (updated_at desc,id desc);
alter table public.rosie_detailing_intake_v868 enable row level security;
revoke all on public.rosie_detailing_intake_v868 from public,anon,authenticated,service_role;
grant select,insert,update on public.rosie_detailing_intake_v868 to service_role;

create table public.rosie_detailing_intake_media_v868(
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete restrict,
 bucket text not null default 'rosie-intake-private' check(bucket='rosie-intake-private'),
 object_path text not null unique check(object_path ~ '^intakes/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|heic|mp4|mov|webm)$'),
 original_filename text not null check(char_length(original_filename) between 1 and 120),
 content_type text not null check(content_type in('image/jpeg','image/png','image/webp','image/heic',
 'video/mp4','video/quicktime','video/webm')),
 expected_bytes bigint not null check(expected_bytes between 1 and 41943040),
 status text not null default 'pending_upload' check(status in('pending_upload','stored_private')),
 created_at timestamptz not null default clock_timestamp(),
 verified_at timestamptz
);
create index rosie868_media_by_draft on public.rosie_detailing_intake_media_v868
 (draft_id,created_at,id);
alter table public.rosie_detailing_intake_media_v868 enable row level security;
revoke all on public.rosie_detailing_intake_media_v868 from public,anon,authenticated,service_role;
grant select,insert,update on public.rosie_detailing_intake_media_v868 to service_role;

-- Bounded, non-public media bucket. Requires a private service-role signed URL
-- before a browser may upload. Free Supabase quota is shared by all buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('rosie-intake-private','rosie-intake-private',false,41943040,
 array['image/jpeg','image/png','image/webp','image/heic',
 'video/mp4','video/quicktime','video/webm']::text[])
 on conflict(id) do nothing;
