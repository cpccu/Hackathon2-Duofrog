-- Secure QR attendance for existing CampusOS registrations.
-- Existing registrations receive a fresh opaque token; no profile data is encoded in QR values.

alter table public.event_registrations
  add column if not exists registration_token text,
  add column if not exists checked_in boolean not null default false,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references public.profiles(id) on delete set null;

update public.event_registrations
set registration_token = lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
where registration_token is null;

update public.event_registrations
set checked_in = (status = 'checked_in'),
    checked_in_at = case when status = 'checked_in' then coalesce(checked_in_at, updated_at, registered_at) else null end
where checked_in is distinct from (status = 'checked_in')
   or (status = 'checked_in' and checked_in_at is null);

alter table public.event_registrations
  alter column registration_token set default lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  alter column registration_token set not null;

create unique index if not exists event_registrations_token_unique_idx
  on public.event_registrations (registration_token);
create index if not exists event_registrations_checked_in_idx
  on public.event_registrations (event_id, checked_in, registered_at);

alter table public.event_registrations
  drop constraint if exists event_registrations_checkin_consistency;
alter table public.event_registrations
  add constraint event_registrations_checkin_consistency
  check (
    checked_in = (status = 'checked_in')
    and (not checked_in or checked_in_at is not null)
  );

-- Tokens are retrievable only through a per-user function; organizers never get token table access.
revoke select on table public.event_registrations from authenticated;
revoke insert, update, delete on table public.event_registrations from authenticated;
grant select (
  id, event_id, user_id, registered_at, status,
  checked_in, checked_in_at, checked_in_by, created_at, updated_at
) on table public.event_registrations to authenticated;

create or replace function public.get_my_event_qr(target_registration uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.registration_token
  from public.event_registrations r
  where r.id = target_registration
    and r.user_id = (select auth.uid())
    and r.status in ('registered', 'checked_in')
  limit 1;
$$;
revoke all on function public.get_my_event_qr(uuid) from public, anon;
grant execute on function public.get_my_event_qr(uuid) to authenticated;

drop function if exists public.get_event_attendees(uuid);
create function public.get_event_attendees(target_event uuid)
returns table (
  registration_id uuid, user_id uuid, full_name text, student_id text, department text,
  registered_at timestamptz, status text, checked_in boolean, checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.can_manage_event(target_event) then
    raise exception 'Not authorized to view these attendees' using errcode = '42501';
  end if;
  return query
    select r.id, r.user_id, p.full_name, p.student_id, p.department,
      r.registered_at, r.status, r.checked_in, r.checked_in_at
    from public.event_registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = target_event and r.status in ('registered', 'checked_in')
    order by r.registered_at;
end;
$$;
revoke all on function public.get_event_attendees(uuid) from public, anon;
grant execute on function public.get_event_attendees(uuid) to authenticated;

create or replace function public.get_event_checkin_summary(target_event uuid)
returns table (registered_count bigint, checked_in_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where r.status in ('registered', 'checked_in')),
    count(*) filter (where r.status = 'checked_in' and r.checked_in)
  from public.event_registrations r
  where r.event_id = target_event
    and (select auth.uid()) is not null
    and public.can_manage_event(target_event);
$$;
revoke all on function public.get_event_checkin_summary(uuid) from public, anon;
grant execute on function public.get_event_checkin_summary(uuid) to authenticated;

create or replace function public.check_in_event_attendee(target_event uuid, scanned_token text)
returns table (
  outcome text, registration_id uuid, student_name text, student_id text,
  checked_in_at timestamptz, checked_in_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_event public.events%rowtype;
  v_registration public.event_registrations%rowtype;
  v_profile public.profiles%rowtype;
  v_time timestamp := now() at time zone 'Asia/Dhaka';
  v_count bigint;
begin
  -- Authorize before looking up the token, so unauthorized callers learn nothing about registrations.
  if v_actor is null or not public.can_manage_event(target_event) then
    return query select 'unauthorized'::text, null::uuid, null::text, null::text, null::timestamptz, null::bigint;
    return;
  end if;

  select * into v_event from public.events e where e.id = target_event for update;
  if not found then
    return query select 'checkin_closed'::text, null::uuid, null::text, null::text, null::timestamptz, null::bigint;
    return;
  end if;

  if scanned_token is null or trim(scanned_token) !~ '^[0-9a-f]{64}$' then
    return query select 'invalid_qr'::text, null::uuid, null::text, null::text, null::timestamptz, null::bigint;
    return;
  end if;

  select * into v_registration
  from public.event_registrations r
  where r.registration_token = trim(scanned_token)
  for update;
  if not found then
    return query select 'invalid_qr'::text, null::uuid, null::text, null::text, null::timestamptz, null::bigint;
    return;
  end if;

  if v_registration.event_id <> target_event then
    return query select 'wrong_event'::text, null::uuid, null::text, null::text, null::timestamptz, null::bigint;
    return;
  end if;

  select * into v_profile from public.profiles p where p.id = v_registration.user_id;
  select count(*) into v_count from public.event_registrations r
    where r.event_id = target_event and r.status = 'checked_in' and r.checked_in;

  if v_registration.status = 'checked_in' and v_registration.checked_in then
    return query select 'already_checked_in'::text, v_registration.id, v_profile.full_name,
      v_profile.student_id, v_registration.checked_in_at, v_count;
    return;
  end if;

  if v_registration.status <> 'registered' or v_registration.checked_in then
    return query select 'not_registered'::text, null::uuid, null::text, null::text, null::timestamptz, v_count;
    return;
  end if;

  if v_event.status <> 'published'
    or v_event.event_date + v_event.start_time > v_time + interval '2 hours'
    or v_event.event_date + v_event.end_time <= v_time then
    return query select 'checkin_closed'::text, null::uuid, null::text, null::text, null::timestamptz, v_count;
    return;
  end if;

  update public.event_registrations r
  set status = 'checked_in', checked_in = true, checked_in_at = now(), checked_in_by = v_actor, updated_at = now()
  where r.id = v_registration.id
  returning * into v_registration;

  select count(*) into v_count from public.event_registrations r
    where r.event_id = target_event and r.status = 'checked_in' and r.checked_in;
  return query select 'checked_in'::text, v_registration.id, v_profile.full_name,
    v_profile.student_id, v_registration.checked_in_at, v_count;
end;
$$;
revoke all on function public.check_in_event_attendee(uuid, text) from public, anon;
grant execute on function public.check_in_event_attendee(uuid, text) to authenticated;

-- Reissued/cancelled registrations get a new token. Counts continue to include checked-in students.
create or replace function public.register_for_event(target_event uuid)
returns table (outcome text, registration_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_existing public.event_registrations%rowtype;
  v_registration_id uuid;
  v_count bigint;
  v_user uuid := (select auth.uid());
  v_local_time timestamp := now() at time zone 'Asia/Dhaka';
begin
  if v_user is null then return query select 'not_authenticated'::text, null::uuid; return; end if;
  select * into v_event from public.events where id = target_event for update;
  if not found then return query select 'event_not_found'::text, null::uuid; return; end if;
  if v_event.status <> 'published' then return query select 'registration_closed'::text, null::uuid; return; end if;
  if not v_event.registration_enabled then return query select 'registration_disabled'::text, null::uuid; return; end if;
  if v_event.event_date + v_event.end_time <= v_local_time then return query select 'event_expired'::text, null::uuid; return; end if;
  select * into v_existing from public.event_registrations where event_id = target_event and user_id = v_user for update;
  if found and v_existing.status in ('registered', 'checked_in') then return query select 'already_registered'::text, v_existing.id; return; end if;
  select count(*) into v_count from public.event_registrations where event_id = target_event and status in ('registered', 'checked_in');
  if v_event.max_attendees is not null and v_count >= v_event.max_attendees then return query select 'event_full'::text, null::uuid; return; end if;
  insert into public.event_registrations (event_id, user_id, status, registered_at)
  values (target_event, v_user, 'registered', now())
  on conflict (event_id, user_id) do update
    set status = 'registered', registered_at = now(), registration_token = lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
        checked_in = false, checked_in_at = null, checked_in_by = null, updated_at = now()
    where public.event_registrations.status = 'cancelled'
  returning id into v_registration_id;
  return query select 'registered'::text, v_registration_id;
end;
$$;
revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;

create or replace function public.get_event_registration_count(target_event uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is not null and exists (
      select 1 from public.events e where e.id = target_event and (e.status = 'published' or public.can_manage_event(e.id))
    ) then (select count(*) from public.event_registrations r where r.event_id = target_event and r.status in ('registered', 'checked_in'))
    else null
  end;
$$;
revoke all on function public.get_event_registration_count(uuid) from public, anon;
grant execute on function public.get_event_registration_count(uuid) to authenticated;

create or replace function public.get_managed_events()
returns table (
  id uuid, title text, event_type text, event_date date, start_time time, end_time time,
  venue text, status text, registration_enabled boolean, max_attendees integer,
  club_id uuid, club_name text, registration_count bigint, created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.title, e.event_type, e.event_date, e.start_time, e.end_time, e.venue,
    e.status, e.registration_enabled, e.max_attendees, c.id, c.name,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status in ('registered', 'checked_in')),
    e.created_at, e.updated_at
  from public.events e join public.club_profiles c on c.id = e.club_id
  where (select auth.uid()) is not null and public.can_manage_event(e.id)
  order by e.event_date desc, e.created_at desc;
$$;
revoke all on function public.get_managed_events() from public, anon;
grant execute on function public.get_managed_events() to authenticated;
-- Keep feed and event capacity counts accurate after a student is checked in.
create or replace function public.search_events(
  search_query text default '', club_filter uuid default null, type_filter text default '',
  date_from date default null, date_to date default null, result_limit integer default 50
)
returns table (
  id uuid, title text, short_description text, description text, event_type text, club_id uuid,
  venue text, event_date date, start_time time, end_time time, cover_image_url text,
  registration_enabled boolean, max_attendees integer, status text, created_by uuid,
  created_at timestamptz, updated_at timestamptz, club_name text, club_slug text,
  registration_status text, registration_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select '%' || replace(
      replace(replace(coalesce(search_query, ''), chr(92), chr(92) || chr(92)), '%', chr(92) || '%'),
      '_', chr(92) || '_'
    ) || '%' as pattern
  )
  select e.id, e.title, e.short_description, e.description, e.event_type, e.club_id, e.venue,
    e.event_date, e.start_time, e.end_time, e.cover_image_url, e.registration_enabled,
    e.max_attendees, e.status, e.created_by, e.created_at, e.updated_at, c.name, c.slug,
    mine.status,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status in ('registered', 'checked_in'))
  from public.events e
  join public.club_profiles c on c.id = e.club_id
  cross join input
  left join public.event_registrations mine on mine.event_id = e.id and mine.user_id = (select auth.uid())
  where (select auth.uid()) is not null
    and e.status = 'published'
    and (e.event_date > (now() at time zone 'Asia/Dhaka')::date
      or (e.event_date = (now() at time zone 'Asia/Dhaka')::date and e.end_time > (now() at time zone 'Asia/Dhaka')::time))
    and (coalesce(search_query, '') = '' or e.title ilike input.pattern or e.short_description ilike input.pattern or e.description ilike input.pattern or c.name ilike input.pattern)
    and (club_filter is null or e.club_id = club_filter)
    and (coalesce(type_filter, '') = '' or e.event_type = type_filter)
    and (date_from is null or e.event_date >= date_from)
    and (date_to is null or e.event_date <= date_to)
  order by e.event_date, e.start_time, e.id
  limit least(greatest(coalesce(result_limit, 50), 1), 100);
$$;
revoke all on function public.search_events(text, uuid, text, date, date, integer) from public, anon;
grant execute on function public.search_events(text, uuid, text, date, date, integer) to authenticated;
