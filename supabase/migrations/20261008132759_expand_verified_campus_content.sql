-- Add verifiable City University content without overwriting student submissions.

insert into public.club_profiles (name, slug, short_description, description)
values
  ('Central Social Welfare Club', 'central-social-welfare-club', 'A DSW-supervised central club for student welfare and community initiatives.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.'),
  ('Central Debating Club', 'central-debating-club', 'A DSW-supervised central club for student debate and discussion.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.'),
  ('Central Sports Club', 'central-sports-club', 'A DSW-supervised central club for sports and student participation.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.'),
  ('Central Cultural Club', 'central-cultural-club', 'A DSW-supervised central club for cultural activities.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.'),
  ('Central Career & Employment Club', 'central-career-employment-club', 'A DSW-supervised central club for career and employment activities.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.'),
  ('Central Photography & Film Society', 'central-photography-film-society', 'A DSW-supervised central club for photography and film.', 'Listed as one of City University’s six central clubs under the Directorate of Students’ Welfare. Check the official DSW page for current committee details and activities.')
on conflict (slug) do nothing;

-- Only these two slugs are known from the original CampusOS fixture migration.
update public.events
set title = case when title like 'Sample: %' then title else 'Sample: ' || title end,
    short_description = case when short_description ilike 'Sample data:%' then short_description else 'Sample data: ' || short_description end,
    description = case when description ilike 'Sample event:%' then description else 'Sample event: Fictional CampusOS example for testing RSVP and check-in. ' || description end
where slug in ('demo-open-source-study-jam', 'demo-algorithms-practice');

alter table public.notices add column if not exists source_url text;
alter table public.notices drop constraint if exists notices_source_url_https_check;
alter table public.notices add constraint notices_source_url_https_check
  check (source_url is null or source_url ~ '^https://');

-- Link the current Fall 2026 registration announcement to the university notice board.
update public.notices
set source_url = 'https://www.cityuniversity.ac.bd/all-notice',
    published_date = '2026-10-02 00:00:00+06'::timestamptz
where (title ilike '%Fall-2026%' or title ilike '%ফল-২০২৬%');

insert into public.notices (title, category, description, priority, is_published, published_date, source_url)
select notice.title, notice.category, notice.description, 'important', true, notice.published_date, notice.source_url
from (values
  ('সিটি ইউনিভার্সিটির চলমান সেমিস্টারের মিডটার্ম ও ফাইনাল পরীক্ষা প্রসঙ্গে', 'Exams', 'City University published a notice regarding the current semester’s mid-term and final examinations. Open the official notice for the departments and exact examination instructions.', '2026-09-17 00:00:00+06'::timestamptz, 'https://www.cityuniversity.ac.bd/all-notice'),
  ('"পরীক্ষার নোটিশ" স্থগিতকৃত পরীক্ষা সমূহ নিম্নে উল্লেখিত তারিখে অনুষ্ঠিত প্রসঙ্গে।', 'Exams', 'City University published an update about examinations that had been postponed and their revised schedule. Open the official notice to confirm which examinations are affected and their dates.', '2026-09-22 00:00:00+06'::timestamptz, 'https://www.cityuniversity.ac.bd/all-notice')
) as notice(title, category, description, published_date, source_url)
where not exists (select 1 from public.notices n where n.title = notice.title);

insert into public.helpdesk_articles (
  slug, title, summary, content, category, keywords, source_label, source_url, is_published
)
values
  ('theory-course-mark-distribution', 'How are marks distributed in a theory course?', 'The published policy assigns 10 marks each to attendance, assignments, and quizzes; 30 to mid-term; and 40 to the final.', 'City University’s Exams & Result Policy lists this theory-course distribution: class attendance and participation 10 marks, assignment and presentation 10, quizzes or class tests 10, mid-term examination 30, and final examination 40 (100 total). Check your current course outline and ask your course teacher whether any course-specific instructions apply.', 'academic', array['theory','marks','grading','attendance','assignment','quiz','midterm','final']::text[], 'City University Exams & Result Policy', 'https://www.cityuniversity.ac.bd/exams-result-policy', true),
  ('incomplete-grade-and-makeup-exam', 'What if I miss a final exam or project requirement?', 'The policy describes how to request an incomplete grade and the four-week completion period.', 'If you have completed all course requirements except the final exam or a project/report, City University’s policy says you may apply to your course teacher for an incomplete grade and explain the reason. If accepted, the remaining requirement or make-up final is due within four weeks from the start of the new semester. Contact your course teacher promptly and check current department instructions.', 'exams', array['incomplete','makeup','make-up','missed exam','project','four weeks']::text[], 'City University Exams & Result Policy', 'https://www.cityuniversity.ac.bd/exams-result-policy', true),
  ('course-retake-and-grade-improvement', 'When can I retake a course?', 'The policy covers retakes after an F and grade improvement for C+ or below.', 'City University’s published policy says a student who earns an F must retake the course in the next semester to earn at least a passing grade. It also allows a student with C+ or below to retake for grade improvement, subject to the stated course-fee requirement. Confirm current registration steps and fees with your department.', 'academic', array['retake','repeat','F grade','grade improvement','C+','course fee']::text[], 'City University Exams & Result Policy', 'https://www.cityuniversity.ac.bd/exams-result-policy', true),
  ('official-central-clubs', 'Which central clubs are listed by City University?', 'The Directorate of Students’ Welfare lists six central clubs.', 'City University’s Directorate of Students’ Welfare lists the Central Social Welfare Club, Central Debating Club, Central Sports Club, Central Cultural Club, Central Career & Employment Club, and Central Photography & Film Society. Check the DSW page for current committee details and activities.', 'campus', array['clubs','student clubs','DSW','student welfare','central clubs']::text[], 'City University Directorate of Students’ Welfare', 'https://www.cityuniversity.ac.bd/dsw', true)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
