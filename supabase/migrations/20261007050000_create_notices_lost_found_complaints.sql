-- Notices, Lost & Found, and private student complaint tracking.
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 4 and 180),
  category text not null check (category in ('Academic', 'Exams', 'Registration', 'Campus', 'Events', 'General')),
  description text not null check (char_length(trim(description)) between 10 and 8000),
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  is_published boolean not null default true,
  published_date timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notices_published_date_idx on public.notices (published_date desc) where is_published;
create index if not exists notices_category_priority_idx on public.notices (category, priority) where is_published;
alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select on public.notices to authenticated;
grant insert, update, delete on public.notices to authenticated;
drop policy if exists "Students can read published notices" on public.notices;
create policy "Students can read published notices" on public.notices for select to authenticated using (is_published or public.is_campus_admin());
drop policy if exists "Admins create notices" on public.notices;
create policy "Admins create notices" on public.notices for insert to authenticated with check (public.is_campus_admin() and created_by = (select auth.uid()));
drop policy if exists "Admins update notices" on public.notices;
create policy "Admins update notices" on public.notices for update to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
drop policy if exists "Admins delete notices" on public.notices;
create policy "Admins delete notices" on public.notices for delete to authenticated using (public.is_campus_admin());

create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('lost', 'found')),
  title text not null check (char_length(trim(title)) between 4 and 160),
  description text not null check (char_length(trim(description)) between 10 and 3000),
  photo_url text,
  storage_path text,
  location text not null check (char_length(trim(location)) between 2 and 180),
  item_date date not null,
  contact_information text not null check (char_length(trim(contact_information)) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lost_found_status_created_idx on public.lost_found_items (status, created_at desc);
create index if not exists lost_found_type_date_idx on public.lost_found_items (item_type, item_date desc);
alter table public.lost_found_items enable row level security;
revoke all on public.lost_found_items from anon, authenticated;
grant select, insert, update, delete on public.lost_found_items to authenticated;
drop policy if exists "Signed-in users browse lost and found" on public.lost_found_items;
create policy "Signed-in users browse lost and found" on public.lost_found_items for select to authenticated using (true);
drop policy if exists "Students create their own lost and found posts" on public.lost_found_items;
create policy "Students create their own lost and found posts" on public.lost_found_items for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "Owners manage their own lost and found posts" on public.lost_found_items;
create policy "Owners manage their own lost and found posts" on public.lost_found_items for update to authenticated using (created_by = (select auth.uid()) or public.is_campus_admin()) with check (created_by = (select auth.uid()) or public.is_campus_admin());
drop policy if exists "Owners delete their own lost and found posts" on public.lost_found_items;
create policy "Owners delete their own lost and found posts" on public.lost_found_items for delete to authenticated using (created_by = (select auth.uid()) or public.is_campus_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campus-lost-found', 'campus-lost-found', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Users read lost and found photos" on storage.objects;
create policy "Signed in users read Lost and Found photos" on storage.objects for select to authenticated using (bucket_id = 'campus-lost-found');
drop policy if exists "Users upload own lost and found photos" on storage.objects;
create policy "Users upload own lost and found photos" on storage.objects for insert to authenticated with check (bucket_id = 'campus-lost-found' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users update own lost and found photos" on storage.objects;
create policy "Users update own lost and found photos" on storage.objects for update to authenticated using (bucket_id = 'campus-lost-found' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_campus_admin())) with check (bucket_id = 'campus-lost-found' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_campus_admin()));
drop policy if exists "Users delete own lost and found photos" on storage.objects;
create policy "Users delete own lost and found photos" on storage.objects for delete to authenticated using (bucket_id = 'campus-lost-found' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_campus_admin()));

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Facilities', 'Academic', 'Transport', 'Safety', 'IT Support', 'Other')),
  description text not null check (char_length(trim(description)) between 20 and 5000),
  status text not null default 'Submitted' check (status in ('Submitted', 'Reviewing', 'In Progress', 'Resolved')),
  submitted_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);
create index if not exists complaints_user_submitted_idx on public.complaints (user_id, submitted_at desc);
create index if not exists complaints_status_submitted_idx on public.complaints (status, submitted_at desc);
alter table public.complaints enable row level security;
revoke all on public.complaints from anon, authenticated;
grant select, insert on public.complaints to authenticated;
grant update (status) on public.complaints to authenticated;
drop policy if exists "Students see own complaints and admins see all" on public.complaints;
create policy "Students see own complaints and admins see all" on public.complaints for select to authenticated using (user_id = (select auth.uid()) or public.is_campus_admin());
drop policy if exists "Students submit complaints as themselves" on public.complaints;
create policy "Students submit complaints as themselves" on public.complaints for insert to authenticated with check (user_id = (select auth.uid()) and status = 'Submitted');
drop policy if exists "Admins change complaint status" on public.complaints;
create policy "Admins change complaint status" on public.complaints for update to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());

create or replace function public.set_student_service_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.set_student_service_updated_at() from public, anon, authenticated;
drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at before update on public.notices for each row execute procedure public.set_student_service_updated_at();
drop trigger if exists set_lost_found_updated_at on public.lost_found_items;
create trigger set_lost_found_updated_at before update on public.lost_found_items for each row execute procedure public.set_student_service_updated_at();
drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at before update on public.complaints for each row execute procedure public.set_student_service_updated_at();

create or replace function public.search_notices(search_query text default '', category_filter text default '', result_limit integer default 100)
returns setof public.notices language sql stable security invoker set search_path = '' as $$
  select n.* from public.notices n
  where n.is_published
    and (coalesce(category_filter, '') = '' or n.category = category_filter)
    and (coalesce(search_query, '') = '' or n.title ilike '%' || search_query || '%' or n.description ilike '%' || search_query || '%' or n.category ilike '%' || search_query || '%')
  order by case n.priority when 'urgent' then 0 when 'important' then 1 else 2 end, n.published_date desc
  limit least(greatest(coalesce(result_limit, 100),1),200);
$$;
revoke all on function public.search_notices(text, text, integer) from public, anon;
grant execute on function public.search_notices(text, text, integer) to authenticated;

create or replace function public.search_lost_found(search_query text default '', type_filter text default '', status_filter text default 'open', result_limit integer default 100)
returns setof public.lost_found_items language sql stable security invoker set search_path = '' as $$
  select i.* from public.lost_found_items i
  where (coalesce(type_filter, '') = '' or i.item_type = type_filter)
    and (coalesce(status_filter, '') = '' or i.status = status_filter)
    and (coalesce(search_query, '') = '' or i.title ilike '%' || search_query || '%' or i.description ilike '%' || search_query || '%' or i.location ilike '%' || search_query || '%')
  order by i.created_at desc limit least(greatest(coalesce(result_limit,100),1),200);
$$;
revoke all on function public.search_lost_found(text, text, text, integer) from public, anon;
grant execute on function public.search_lost_found(text, text, text, integer) to authenticated;
