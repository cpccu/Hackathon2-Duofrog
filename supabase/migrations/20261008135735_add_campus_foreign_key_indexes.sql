-- Index each remaining profile foreign key so lookups and profile deletes stay efficient.
create index if not exists bus_routes_created_by_idx
  on public.bus_routes (created_by);
create index if not exists club_profiles_manager_id_idx
  on public.club_profiles (manager_id);
create index if not exists event_registrations_checked_in_by_idx
  on public.event_registrations (checked_in_by);
create index if not exists events_created_by_idx
  on public.events (created_by);
create index if not exists helpdesk_articles_created_by_idx
  on public.helpdesk_articles (created_by);
create index if not exists lost_found_items_created_by_idx
  on public.lost_found_items (created_by);
create index if not exists notice_attachments_uploaded_by_idx
  on public.notice_attachments (uploaded_by);
create index if not exists notices_created_by_idx
  on public.notices (created_by);
create index if not exists resources_uploader_id_idx
  on public.resources (uploader_id);

-- Keep the existing student-own/admin-all access rule in one readable RLS policy.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Users and admins can read profiles" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select public.is_campus_admin()));
