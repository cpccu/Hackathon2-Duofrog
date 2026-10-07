-- Admin-only CampusOS overview and safe user-role management.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_campus_admin());

create or replace function public.admin_dashboard_stats()
returns table (
  total_users bigint,
  total_students bigint,
  total_events bigint,
  total_resources bigint,
  total_notices bigint,
  total_lost_found bigint,
  pending_complaints bigint,
  total_registrations bigint,
  total_check_ins bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_campus_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where role = 'student'),
    (select count(*) from public.events),
    (select count(*) from public.resources),
    (select count(*) from public.notices),
    (select count(*) from public.lost_found_items),
    (select count(*) from public.complaints where status <> 'Resolved'),
    (select count(*) from public.event_registrations where status in ('registered','checked_in')),
    (select count(*) from public.event_registrations where checked_in);
end;
$$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

create or replace function public.admin_set_user_role(target_user uuid, new_role text)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_campus_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if target_user is null or target_user = (select auth.uid()) then
    raise exception 'You cannot change your own role here' using errcode = '22023';
  end if;
  if new_role not in ('student', 'admin') then
    raise exception 'Role must be student or admin' using errcode = '22023';
  end if;
  update public.profiles set role = new_role where id = target_user;
  if not found then return false; end if;
  return true;
end;
$$;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
