-- Club directory, published events, RSVP lifecycle, management, and demo records.

create table if not exists public.club_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '' check (char_length(short_description) <= 280),
  description text not null default '' check (char_length(description) <= 5000),
  logo_url text,
  contact_email text,
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null check (char_length(trim(title)) between 3 and 180),
  short_description text not null default '' check (char_length(short_description) <= 360),
  description text not null check (char_length(trim(description)) between 1 and 10000),
  event_type text not null check (event_type in ('Technical', 'Academic', 'Cultural', 'Sports', 'Career', 'Workshop', 'Community', 'Other')),
  club_id uuid not null references public.club_profiles(id) on delete restrict,
  venue text not null check (char_length(trim(venue)) between 2 and 240),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  cover_image_url text,
  registration_enabled boolean not null default true,
  max_attendees integer check (max_attendees is null or max_attendees > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_time > start_time)
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'checked_in')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_one_per_user unique (event_id, user_id)
);

create index if not exists club_profiles_name_idx on public.club_profiles (lower(name));
create index if not exists events_feed_idx on public.events (status, event_date, start_time);
create index if not exists events_club_date_idx on public.events (club_id, event_date);
create index if not exists events_type_date_idx on public.events (event_type, event_date);
create index if not exists event_registrations_user_status_idx on public.event_registrations (user_id, status, registered_at desc);
create index if not exists event_registrations_event_status_idx on public.event_registrations (event_id, status);

alter table public.club_profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

revoke all on table public.club_profiles, public.events, public.event_registrations from anon, authenticated;
grant select on table public.club_profiles, public.events, public.event_registrations to authenticated;
grant insert, update, delete on table public.club_profiles, public.events to authenticated;

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

create or replace function public.can_manage_club(target_club uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    public.is_campus_admin()
    or exists (select 1 from public.club_profiles c where c.id = target_club and c.manager_id = (select auth.uid()))
  );
$$;
revoke all on function public.can_manage_club(uuid) from public, anon;
grant execute on function public.can_manage_club(uuid) to authenticated;

create or replace function public.can_manage_event(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.events e
    where e.id = target_event and public.can_manage_club(e.club_id)
  );
$$;
revoke all on function public.can_manage_event(uuid) from public, anon;
grant execute on function public.can_manage_event(uuid) to authenticated;

create or replace function public.is_event_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    public.is_campus_admin()
    or exists (select 1 from public.club_profiles c where c.manager_id = (select auth.uid()))
  );
$$;
revoke all on function public.is_event_manager() from public, anon;
grant execute on function public.is_event_manager() to authenticated;

create or replace function public.set_club_event_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_club_event_updated_at() from public, anon, authenticated;

drop trigger if exists set_club_profiles_updated_at on public.club_profiles;
create trigger set_club_profiles_updated_at before update on public.club_profiles
for each row execute procedure public.set_club_event_updated_at();
drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
for each row execute procedure public.set_club_event_updated_at();
drop trigger if exists set_event_registrations_updated_at on public.event_registrations;
create trigger set_event_registrations_updated_at before update on public.event_registrations
for each row execute procedure public.set_club_event_updated_at();

-- Club directory is visible to signed-in students; mutations stay with admins and club managers.
drop policy if exists "Authenticated users can view clubs" on public.club_profiles;
create policy "Authenticated users can view clubs" on public.club_profiles
for select to authenticated using (true);
drop policy if exists "Admins can create clubs" on public.club_profiles;
create policy "Admins can create clubs" on public.club_profiles
for insert to authenticated with check (public.is_campus_admin());
drop policy if exists "Admins and managers can update clubs" on public.club_profiles;
create policy "Admins and managers can update clubs" on public.club_profiles
for update to authenticated using (public.can_manage_club(id)) with check (public.can_manage_club(id));
drop policy if exists "Admins can delete clubs" on public.club_profiles;
create policy "Admins can delete clubs" on public.club_profiles
for delete to authenticated using (public.is_campus_admin());

-- Published events are visible to members; managers can also see their drafts and manage their clubs' events.
drop policy if exists "Members can view published events and managers their own" on public.events;
create policy "Members can view published events and managers their own" on public.events
for select to authenticated using (
  status = 'published'
  or public.can_manage_event(id)
  or exists (
    select 1 from public.event_registrations r
    where r.event_id = events.id and r.user_id = (select auth.uid())
  )
);
drop policy if exists "Club managers can create events" on public.events;
create policy "Club managers can create events" on public.events
for insert to authenticated with check (
  created_by = (select auth.uid()) and public.can_manage_club(club_id)
  and (status <> 'published' or event_date + end_time > (now() at time zone 'Asia/Dhaka'))
);
drop policy if exists "Club managers can update their events" on public.events;
create policy "Club managers can update their events" on public.events
for update to authenticated using (public.can_manage_event(id))
with check (
  public.can_manage_event(id)
  and (status <> 'published' or event_date + end_time > (now() at time zone 'Asia/Dhaka'))
);
drop policy if exists "Club managers can delete their events" on public.events;
create policy "Club managers can delete their events" on public.events
for delete to authenticated using (public.can_manage_event(id));

-- Registration writes only happen through locked RPCs so duplicate and capacity checks are atomic.
drop policy if exists "Members can see own registrations and managers attendees" on public.event_registrations;
create policy "Members can see own registrations and managers attendees" on public.event_registrations
for select to authenticated using (user_id = (select auth.uid()) or public.can_manage_event(event_id));

create or replace function public.search_events(
  search_query text default '',
  club_filter uuid default null,
  type_filter text default '',
  date_from date default null,
  date_to date default null,
  result_limit integer default 50
)
returns table (
  id uuid,
  title text,
  short_description text,
  description text,
  event_type text,
  club_id uuid,
  venue text,
  event_date date,
  start_time time,
  end_time time,
  cover_image_url text,
  registration_enabled boolean,
  max_attendees integer,
  status text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  club_name text,
  club_slug text,
  registration_status text,
  registration_count bigint
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
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered')
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

create or replace function public.search_clubs(search_query text default '')
returns table (
  id uuid,
  name text,
  slug text,
  short_description text,
  description text,
  logo_url text,
  contact_email text,
  upcoming_event_count bigint
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
  select c.id, c.name, c.slug, c.short_description, c.description, c.logo_url, c.contact_email,
    (select count(*) from public.events e where e.club_id = c.id and e.status = 'published' and e.event_date >= (now() at time zone 'Asia/Dhaka')::date)
  from public.club_profiles c cross join input
  where (select auth.uid()) is not null
    and (coalesce(search_query, '') = '' or c.name ilike input.pattern or c.short_description ilike input.pattern or c.description ilike input.pattern)
  order by c.name
  limit 200;
$$;
revoke all on function public.search_clubs(text) from public, anon;
grant execute on function public.search_clubs(text) to authenticated;

create or replace function public.get_managed_clubs()
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.slug from public.club_profiles c
  where (select auth.uid()) is not null
    and (public.is_campus_admin() or c.manager_id = (select auth.uid()))
  order by c.name;
$$;
revoke all on function public.get_managed_clubs() from public, anon;
grant execute on function public.get_managed_clubs() to authenticated;

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
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    e.created_at, e.updated_at
  from public.events e join public.club_profiles c on c.id = e.club_id
  where (select auth.uid()) is not null and public.can_manage_event(e.id)
  order by e.event_date desc, e.created_at desc;
$$;
revoke all on function public.get_managed_events() from public, anon;
grant execute on function public.get_managed_events() to authenticated;

drop function if exists public.get_event_attendees(uuid);
create or replace function public.get_event_attendees(target_event uuid)
returns table (
  registration_id uuid, user_id uuid, full_name text, student_id text, department text,
  registered_at timestamptz, status text
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
    select r.id, r.user_id, p.full_name, p.student_id, p.department, r.registered_at, r.status
    from public.event_registrations r join public.profiles p on p.id = r.user_id
    where r.event_id = target_event and r.status = 'registered'
    order by r.registered_at;
end;
$$;
revoke all on function public.get_event_attendees(uuid) from public, anon;
grant execute on function public.get_event_attendees(uuid) to authenticated;

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
    ) then (select count(*) from public.event_registrations r where r.event_id = target_event and r.status = 'registered')
    else null
  end;
$$;
revoke all on function public.get_event_registration_count(uuid) from public, anon;
grant execute on function public.get_event_registration_count(uuid) to authenticated;

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
  select count(*) into v_count from public.event_registrations where event_id = target_event and status = 'registered';
  if v_event.max_attendees is not null and v_count >= v_event.max_attendees then return query select 'event_full'::text, null::uuid; return; end if;
  insert into public.event_registrations (event_id, user_id, status, registered_at)
  values (target_event, v_user, 'registered', now())
  on conflict (event_id, user_id) do update
    set status = 'registered', registered_at = now(), updated_at = now()
    where public.event_registrations.status = 'cancelled'
  returning id into v_registration_id;
  return query select 'registered'::text, v_registration_id;
end;
$$;
revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;

create or replace function public.cancel_event_registration(target_event uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_event public.events%rowtype;
  v_registration public.event_registrations%rowtype;
  v_local_time timestamp := now() at time zone 'Asia/Dhaka';
begin
  if v_user is null then return 'not_authenticated'; end if;
  select * into v_event from public.events where id = target_event for update;
  if not found then return 'event_not_found'; end if;
  if v_event.event_date + v_event.start_time <= v_local_time then return 'event_started'; end if;
  select * into v_registration from public.event_registrations
    where event_id = target_event and user_id = v_user for update;
  if not found or v_registration.status <> 'registered' then return 'not_registered'; end if;
  update public.event_registrations set status = 'cancelled', updated_at = now()
    where id = v_registration.id;
  return 'cancelled';
end;
$$;
revoke all on function public.cancel_event_registration(uuid) from public, anon;
grant execute on function public.cancel_event_registration(uuid) to authenticated;

-- Original CampusOS demo data: fictional event details and no private contact data or external/copyrighted files.
insert into public.club_profiles (name, slug, short_description, description)
select seed.name, seed.slug, seed.short_description, seed.description
from (values
  ('City University Programming Club', 'programming-club', 'Build, learn, and solve problems together through peer-led programming sessions.', 'A student community for programming practice, collaborative software projects, and technology learning at City University.'),
  ('Robotics & Hardware Society', 'robotics-hardware', 'Explore robotics, electronics, and hands-on engineering projects.', 'A student-led space for learning about robotics and hardware through collaborative builds and beginner-friendly workshops.'),
  ('City University Cultural Club', 'cultural-club', 'Celebrate creativity, performance, and cultural exchange on campus.', 'A campus community for students interested in music, theatre, literature, visual arts, and cultural events.'),
  ('Career Development Circle', 'career-development', 'Build practical career skills and connect with peers and mentors.', 'A student group focused on career preparation, portfolio development, interview practice, and professional learning.')
) as seed(name, slug, short_description, description)
where not exists (select 1 from public.club_profiles)
on conflict (slug) do nothing;

with demo_events (club_slug, slug, title, short_description, description, event_type, venue, days_ahead, start_time, end_time, max_attendees) as (
  values
    ('programming-club', 'demo-open-source-study-jam', 'Open Source Study Jam', 'A peer-led introduction to collaborative open-source projects.', 'Join a guided session on reading project documentation, choosing beginner-friendly issues, and making a first contribution. Bring a laptop; no previous open-source experience is required.', 'Technical', 'CSE Seminar Room', 5, time '10:00', time '12:00', 60),
    ('programming-club', 'demo-algorithms-practice', 'Algorithms Practice Circle', 'Work through problem-solving patterns with fellow students.', 'A small-group practice session covering problem decomposition, complexity, and clear solution explanations. Problems are original and prepared for the CampusOS demo.', 'Academic', 'Computer Lab 3', 10, time '14:00', time '16:00', 45),
    ('robotics-hardware', 'demo-robotics-build-lab', 'Robotics Build Lab', 'A hands-on introduction to sensors and microcontroller projects.', 'Explore basic sensor input and microcontroller output in a guided group activity. The session introduces safe bench practices and simple prototyping concepts.', 'Workshop', 'EEE Project Lab', 14, time '11:00', time '13:30', 32),
    ('cultural-club', 'demo-campus-stage-open-mic', 'Campus Stage Open Mic', 'Share music, spoken word, or short performances with the campus.', 'An inclusive student open mic with short performance slots. Participants should bring their own instruments or backing materials and confirm technical needs at registration.', 'Cultural', 'Main Auditorium', 19, time '15:00', time '17:30', 100),
    ('career-development', 'demo-career-prep-clinic', 'Career Preparation Clinic', 'Practice presenting your skills and receive peer feedback.', 'A practical clinic on CV structure, portfolio walkthroughs, and interview preparation. Activities use fictional example profiles; no personal information is shared.', 'Career', 'Multipurpose Hall', 24, time '10:30', time '12:30', 55)
)
insert into public.events (
  slug, title, short_description, description, event_type, club_id, venue,
  event_date, start_time, end_time, registration_enabled, max_attendees, status
)
select d.slug, d.title, d.short_description, d.description, d.event_type, c.id, d.venue,
  (now() at time zone 'Asia/Dhaka')::date + d.days_ahead,
  d.start_time, d.end_time, true, d.max_attendees, 'published'
from demo_events d join public.club_profiles c on c.slug = d.club_slug
on conflict (slug) do nothing;
