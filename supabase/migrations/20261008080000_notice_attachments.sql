-- Private attachments for official notices.
create table if not exists public.notice_attachments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(trim(file_name)) between 1 and 180),
  content_type text not null,
  file_size bigint not null check (file_size between 1 and 20971520),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists notice_attachments_notice_id_idx
  on public.notice_attachments (notice_id, created_at);

alter table public.notice_attachments enable row level security;
revoke all on public.notice_attachments from anon, authenticated;
grant select, insert, delete on public.notice_attachments to authenticated;

drop policy if exists "Users read attachments on published notices" on public.notice_attachments;
create policy "Users read attachments on published notices"
  on public.notice_attachments for select to authenticated
  using (
    public.is_campus_admin()
    or exists (
      select 1 from public.notices n
      where n.id = notice_id and n.is_published
    )
  );

drop policy if exists "Admins add notice attachments" on public.notice_attachments;
create policy "Admins add notice attachments"
  on public.notice_attachments for insert to authenticated
  with check (
    public.is_campus_admin()
    and uploaded_by = (select auth.uid())
    and exists (select 1 from public.notices n where n.id = notice_id)
  );

drop policy if exists "Admins remove notice attachments" on public.notice_attachments;
create policy "Admins remove notice attachments"
  on public.notice_attachments for delete to authenticated
  using (public.is_campus_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campus-notice-attachments',
  'campus-notice-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload notice attachments" on storage.objects;
create policy "Admins upload notice attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'campus-notice-attachments'
    and public.is_campus_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read published notice attachments" on storage.objects;
create policy "Users read published notice attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'campus-notice-attachments'
    and (
      public.is_campus_admin()
      or exists (
        select 1
        from public.notice_attachments a
        join public.notices n on n.id = a.notice_id
        where a.storage_path = storage.objects.name and n.is_published
      )
    )
  );

drop policy if exists "Admins update notice attachments" on storage.objects;
create policy "Admins update notice attachments"
  on storage.objects for update to authenticated
  using (bucket_id = 'campus-notice-attachments' and public.is_campus_admin())
  with check (bucket_id = 'campus-notice-attachments' and public.is_campus_admin());

drop policy if exists "Admins delete notice attachments" on storage.objects;
create policy "Admins delete notice attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'campus-notice-attachments' and public.is_campus_admin());
