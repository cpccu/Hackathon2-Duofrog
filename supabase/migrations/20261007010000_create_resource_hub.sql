create or replace function public.is_campus_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_campus_admin() from public, anon;
grant execute on function public.is_campus_admin() to authenticated;
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 5000),
  course text not null check (char_length(trim(course)) between 1 and 160),
  department text not null check (char_length(trim(department)) between 1 and 160),
  category text not null check (category in (
    'Lecture Notes',
    'Question Papers',
    'Study Materials',
    'Official Notices',
    'Other Academic Resources'
  )),
  storage_path text not null unique,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_created_at_idx on public.resources (created_at desc);
create index if not exists resources_department_course_idx on public.resources (department, course);
create index if not exists resources_category_idx on public.resources (category);

alter table public.resources enable row level security;
revoke all on table public.resources from anon, authenticated;
grant select on table public.resources to authenticated;
grant insert, update, delete on table public.resources to authenticated;

drop policy if exists "Authenticated users can browse resources" on public.resources;
create policy "Authenticated users can browse resources"
  on public.resources for select to authenticated using (true);

drop policy if exists "Admins can create resources as themselves" on public.resources;
create policy "Admins can create resources as themselves"
  on public.resources for insert to authenticated
  with check (uploader_id = (select auth.uid()) and public.is_campus_admin());

drop policy if exists "Admins can update resources" on public.resources;
create policy "Admins can update resources"
  on public.resources for update to authenticated
  using (public.is_campus_admin()) with check (public.is_campus_admin());

drop policy if exists "Admins can delete resources" on public.resources;
create policy "Admins can delete resources"
  on public.resources for delete to authenticated using (public.is_campus_admin());

create or replace function public.set_resources_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_resources_updated_at() from public, anon, authenticated;

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
  before update on public.resources
  for each row execute procedure public.set_resources_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campus-resources',
  'campus-resources',
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

drop policy if exists "Authenticated users can read campus resource files" on storage.objects;
create policy "Authenticated users can read campus resource files"
  on storage.objects for select to authenticated
  using (bucket_id = 'campus-resources');

drop policy if exists "Admins can upload campus resource files" on storage.objects;
create policy "Admins can upload campus resource files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'campus-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_campus_admin()
  );

drop policy if exists "Admins can update campus resource files" on storage.objects;
create policy "Admins can update campus resource files"
  on storage.objects for update to authenticated
  using (bucket_id = 'campus-resources' and public.is_campus_admin())
  with check (bucket_id = 'campus-resources' and public.is_campus_admin());

drop policy if exists "Admins can delete campus resource files" on storage.objects;
create policy "Admins can delete campus resource files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'campus-resources' and public.is_campus_admin());

create or replace function public.search_resources(
  search_query text default '',
  department_filter text default '',
  course_filter text default '',
  category_filter text default '',
  page_number integer default 1,
  page_size integer default 24
)
returns table (
  id uuid,
  title text,
  description text,
  course text,
  department text,
  category text,
  storage_path text,
  uploader_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  uploader_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      '%' || replace(
        replace(
          replace(coalesce(search_query, ''), chr(92), chr(92) || chr(92)),
          '%', chr(92) || '%'
        ),
        '_', chr(92) || '_'
      ) || '%' as pattern
  ),
  matching as (
    select r.*, coalesce(p.full_name, 'Campus member') as uploader_name
    from public.resources as r
    left join public.profiles as p on p.id = r.uploader_id
    cross join input
    where (select auth.uid()) is not null
    and (
      coalesce(search_query, '') = ''
      or r.title ilike input.pattern
      or r.description ilike input.pattern
      or r.course ilike input.pattern
    )
    and (coalesce(department_filter, '') = '' or r.department = department_filter)
    and (coalesce(course_filter, '') = '' or r.course = course_filter)
    and (coalesce(category_filter, '') = '' or r.category = category_filter)
  )
  select
    matching.id,
    matching.title,
    matching.description,
    matching.course,
    matching.department,
    matching.category,
    matching.storage_path,
    matching.uploader_id,
    matching.created_at,
    matching.updated_at,
    matching.uploader_name,
    count(*) over () as total_count
  from matching
  order by matching.created_at desc, matching.id
  offset greatest(coalesce(page_number, 1) - 1, 0) * least(greatest(coalesce(page_size, 24), 1), 100)
  limit least(greatest(coalesce(page_size, 24), 1), 100);
$$;
revoke all on function public.search_resources(text, text, text, text, integer, integer) from public, anon;
grant execute on function public.search_resources(text, text, text, text, integer, integer) to authenticated;

create or replace function public.get_resource_filter_options()
returns table (option_type text, option_value text)
language sql
stable
security invoker
set search_path = ''
as $$
  select 'department'::text, r.department from public.resources as r
  where nullif(trim(r.department), '') is not null
  union
  select 'course'::text, r.course from public.resources as r
  where nullif(trim(r.course), '') is not null
  order by 1, 2;
$$;
revoke all on function public.get_resource_filter_options() from public, anon;
grant execute on function public.get_resource_filter_options() to authenticated;

create or replace function public.get_resource_details(resource_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  course text,
  department text,
  category text,
  storage_path text,
  uploader_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  uploader_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.title,
    r.description,
    r.course,
    r.department,
    r.category,
    r.storage_path,
    r.uploader_id,
    r.created_at,
    r.updated_at,
    coalesce(p.full_name, 'Campus member') as uploader_name
  from public.resources as r
  left join public.profiles as p on p.id = r.uploader_id
  where (select auth.uid()) is not null and r.id = resource_id;
$$;
revoke all on function public.get_resource_details(uuid) from public, anon;
grant execute on function public.get_resource_details(uuid) to authenticated;
