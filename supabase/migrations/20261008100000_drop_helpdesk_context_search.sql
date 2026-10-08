-- Remove the unused legacy Helpdesk context search function.
drop function if exists public.search_helpdesk_context(text, integer);

notify pgrst, 'reload schema';
