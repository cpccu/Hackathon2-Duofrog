-- Deleting a club removes its events; event registrations cascade from events.
alter table public.events
  drop constraint if exists events_club_id_fkey;

alter table public.events
  add constraint events_club_id_fkey
  foreign key (club_id)
  references public.club_profiles(id)
  on delete cascade;
