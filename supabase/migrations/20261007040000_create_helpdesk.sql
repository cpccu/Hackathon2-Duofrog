-- CampusOS Helpdesk knowledge and City University transport information.
-- Source URLs on seeded records point to the official City University site.

create table if not exists public.helpdesk_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 4 and 180),
  summary text not null default '' check (char_length(summary) <= 320),
  content text not null check (char_length(trim(content)) between 10 and 8000),
  category text not null check (category in ('faq', 'academic', 'exams', 'registration', 'campus', 'transport')),
  keywords text[] not null default '{}',
  source_label text not null,
  source_url text not null check (source_url ~ '^https://'),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(content, '')), 'C')
  ) stored
);

create table if not exists public.bus_routes (
  id uuid primary key default gen_random_uuid(),
  route_code text not null unique,
  route_name text not null check (char_length(trim(route_name)) between 3 and 160),
  origin text not null default '',
  destination text not null default '',
  stops text[] not null default '{}',
  departure_time time,
  return_time time,
  operating_days text[] not null default '{}',
  fare_information text not null default '',
  service_information text not null default '',
  contact_information text not null default '',
  source_label text not null,
  source_url text not null check (source_url ~ '^https://'),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(route_name, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(origin, '') || ' ' || coalesce(destination, '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(service_information, '') || ' ' || coalesce(contact_information, '')), 'C')
  ) stored
);

create index if not exists helpdesk_articles_published_category_idx
  on public.helpdesk_articles (category, updated_at desc) where is_published;
create index if not exists helpdesk_articles_search_idx
  on public.helpdesk_articles using gin (search_vector);
create index if not exists bus_routes_published_name_idx
  on public.bus_routes (route_name) where is_published;
create index if not exists bus_routes_search_idx
  on public.bus_routes using gin (search_vector);

alter table public.helpdesk_articles enable row level security;
alter table public.bus_routes enable row level security;
revoke all on table public.helpdesk_articles, public.bus_routes from anon, authenticated;
grant select on table public.helpdesk_articles, public.bus_routes to authenticated;
grant insert, update, delete on table public.helpdesk_articles, public.bus_routes to authenticated;

drop policy if exists "Signed-in users can read published helpdesk articles" on public.helpdesk_articles;
create policy "Signed-in users can read published helpdesk articles" on public.helpdesk_articles
  for select to authenticated using (is_published or public.is_campus_admin());
drop policy if exists "Admins can create helpdesk articles" on public.helpdesk_articles;
create policy "Admins can create helpdesk articles" on public.helpdesk_articles
  for insert to authenticated with check (public.is_campus_admin() and created_by = (select auth.uid()));
drop policy if exists "Admins can update helpdesk articles" on public.helpdesk_articles;
create policy "Admins can update helpdesk articles" on public.helpdesk_articles
  for update to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
drop policy if exists "Admins can delete helpdesk articles" on public.helpdesk_articles;
create policy "Admins can delete helpdesk articles" on public.helpdesk_articles
  for delete to authenticated using (public.is_campus_admin());

drop policy if exists "Signed-in users can read published bus routes" on public.bus_routes;
create policy "Signed-in users can read published bus routes" on public.bus_routes
  for select to authenticated using (is_published or public.is_campus_admin());
drop policy if exists "Admins can create bus routes" on public.bus_routes;
create policy "Admins can create bus routes" on public.bus_routes
  for insert to authenticated with check (public.is_campus_admin() and created_by = (select auth.uid()));
drop policy if exists "Admins can update bus routes" on public.bus_routes;
create policy "Admins can update bus routes" on public.bus_routes
  for update to authenticated using (public.is_campus_admin()) with check (public.is_campus_admin());
drop policy if exists "Admins can delete bus routes" on public.bus_routes;
create policy "Admins can delete bus routes" on public.bus_routes
  for delete to authenticated using (public.is_campus_admin());

create or replace function public.set_helpdesk_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_helpdesk_updated_at() from public, anon, authenticated;
drop trigger if exists set_helpdesk_articles_updated_at on public.helpdesk_articles;
create trigger set_helpdesk_articles_updated_at before update on public.helpdesk_articles
  for each row execute procedure public.set_helpdesk_updated_at();
drop trigger if exists set_bus_routes_updated_at on public.bus_routes;
create trigger set_bus_routes_updated_at before update on public.bus_routes
  for each row execute procedure public.set_helpdesk_updated_at();

create or replace function public.search_helpdesk_articles(
  search_text text default '', category_filter text default '', result_limit integer default 100
)
returns table (
  id uuid, slug text, title text, summary text, content text, category text,
  keywords text[], source_label text, source_url text, updated_at timestamptz
)
language sql stable
security invoker
set search_path = ''
as $$
  with input as (
    select trim(coalesce(search_text, '')) as term,
      plainto_tsquery('simple'::regconfig, trim(coalesce(search_text, ''))) as query
  )
  select a.id, a.slug, a.title, a.summary, a.content, a.category, a.keywords,
    a.source_label, a.source_url, a.updated_at
  from public.helpdesk_articles a cross join input
  where a.is_published
    and (coalesce(category_filter, '') = '' or a.category = category_filter)
    and (input.term = '' or a.search_vector @@ input.query or exists (
      select 1 from unnest(regexp_split_to_array(lower(input.term), '[^a-z0-9]+')) as term(word)
      where char_length(term.word) >= 2 and a.title || ' ' || a.summary || ' ' || a.content || ' ' || array_to_string(a.keywords, ' ')
        ilike '%' || term.word || '%'
    ))
  order by case when input.term = '' then 0 else ts_rank(a.search_vector, input.query) end desc,
    a.updated_at desc, a.title
  limit least(greatest(coalesce(result_limit, 100), 1), 200);
$$;
revoke all on function public.search_helpdesk_articles(text, text, integer) from public, anon;
grant execute on function public.search_helpdesk_articles(text, text, integer) to authenticated;

-- Seed only when these tables are empty. Facts are paraphrased from City University's published pages.
insert into public.helpdesk_articles (
  slug, title, summary, content, category, keywords, source_label, source_url, is_published
)
select seed.slug, seed.title, seed.summary, seed.content, seed.category, seed.keywords,
  seed.source_label, seed.source_url, true
from (values
  ('permanent-campus-location', 'Where is City University’s permanent campus?', 'The permanent campus is in Khagan, Birulia, Savar, Dhaka-1340.', 'City University’s official FAQ lists its permanent campus at Khagan, Birulia, Savar, Dhaka-1340, and says it is about 10 km from Gabtoli. For directions or current access information, contact the university before travelling.', 'campus', array['location','address','campus','gabtoli','savar']::text[], 'City University FAQ', 'https://cityuniversity.ac.bd/faq'),
  ('medium-of-instruction', 'What is the medium of instruction?', 'The official FAQ says English, with Bangla support from teachers where helpful.', 'City University’s FAQ says the medium of instruction is English, while teachers may provide additional support in Bangla. Ask your course teacher about language support for a specific class.', 'faq', array['language','English','Bangla','class']::text[], 'City University FAQ', 'https://cityuniversity.ac.bd/faq'),
  ('semester-examinations', 'How are semester examinations organized?', 'The university policy describes mid-term and term-final examinations each semester.', 'City University’s Exams & Result Policy describes Mid-Term and Term Final examinations in each semester. It also says each department has an examination routine. Check the current department routine and university notices for exact dates, rooms, and instructions; those details vary by semester.', 'exams', array['exam','examination','midterm','mid-term','final','routine','schedule','date']::text[], 'Exams & Result Policy', 'https://www.cityuniversity.ac.bd/exams-result-policy'),
  ('course-evaluation', 'What contributes to a course grade?', 'The published policy describes continuous assessment alongside mid-term and final exams.', 'City University’s published Exams & Result Policy describes continuous evaluation that can include class tests, quizzes, assignments, presentations, attendance, and mid-term and term-final examinations. The exact mark distribution can depend on the course; consult the current course outline or course teacher for your course.', 'academic', array['grade','marks','evaluation','assessment','quiz','assignment','attendance']::text[], 'Exams & Result Policy', 'https://www.cityuniversity.ac.bd/exams-result-policy'),
  ('semester-registration-calendar', 'When should I register for a semester?', 'Registration dates are announced in the semester academic calendar.', 'City University’s Registration Procedures state that semester registration fees should be paid within the dates announced in that semester’s Academic Calendar. The procedures say registration usually starts after mid-term exams, but the exact dates vary. Check the current calendar and official notices.', 'registration', array['registration','semester','calendar','fees','deadline','enrollment']::text[], 'Registration Procedures', 'https://www.cityuniversity.ac.bd/registration-procedures'),
  ('academic-advising', 'How does academic advising work?', 'The official procedures describe payment, online enrollment, and advisor confirmation.', 'City University’s Registration Procedures say a regular student seeking advising should pay registration fees and enroll in courses online two days after payment. The academic advisor confirms course enrollment. If you have an advising or enrollment problem, contact your academic advisor; new students with credit transfer or exemptions are directed to their program Dean’s Office for advisor details.', 'registration', array['advising','advisor','enroll','course','registration','credit transfer']::text[], 'Registration Procedures', 'https://www.cityuniversity.ac.bd/registration-procedures'),
  ('transport-contact-and-timings', 'Where can I get current bus routes and timings?', 'The official transport page describes bus and shuttle service but does not list stop-by-stop departure times.', 'City University’s Transport Facilities page says buses operate on set schedules and shuttle services run throughout the day, with special arrangements for late evenings, weekends, and exam periods. It does not publish route-by-route stops or exact departure times on that page. Contact the University Transport Office to confirm the current route and timing before travelling.', 'transport', array['bus','transport','route','shuttle','timing','schedule','stop','departure']::text[], 'Transport Facilities', 'https://www.cityuniversity.ac.bd/transportfacilities'),
  ('official-campus-contacts', 'How do I contact City University?', 'Use the official campus and query phone numbers listed by the university.', 'City University’s official pages list the permanent campus telephone as 09643-234234, campus mobile numbers +8801322917670 and +8801322917671, and query numbers +8801322917672 and +8801322917673. Check the official website for current department-specific contacts.', 'campus', array['contact','phone','telephone','help','query','office']::text[], 'City University official contact information', 'https://www.cityuniversity.ac.bd/faq')
) as seed(slug, title, summary, content, category, keywords, source_label, source_url)
where not exists (select 1 from public.helpdesk_articles);

insert into public.bus_routes (
  route_code, route_name, origin, destination, stops, operating_days,
  fare_information, service_information, contact_information,
  source_label, source_url, is_published
)
select 'transport-office-info', 'Official transport service information',
  'Route details confirmed by Transport Office', 'Permanent Campus, Khagan, Birulia, Savar, Dhaka-1340',
  '{}', '{}', 'Not listed on the official transport page.',
  'The official page says buses use set schedules and shuttle services run through the day, with special arrangements for late evenings, weekends, and exam periods. It does not publish individual stops or departure times here. Confirm the current route and timing with the University Transport Office before travelling.',
  'Transport Office: 09643-234234; +8801322917670; +8801322917671. For queries: +8801322917672; +8801322917673.',
  'City University Transport Facilities', 'https://www.cityuniversity.ac.bd/transportfacilities', true
where not exists (select 1 from public.bus_routes);

notify pgrst, 'reload schema';
