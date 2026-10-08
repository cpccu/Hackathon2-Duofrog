# CampusOS

**One campus. Everything students need.**

CampusOS is a student workspace for City University in Dhaka. It brings campus events, study resources, university guidance, official notices, and student support into one searchable, authenticated application instead of scattering them across social groups, chat threads, forms, and notice boards.

**Live app:** [hackathon2-duofrog-ochre.vercel.app](https://hackathon2-duofrog-ochre.vercel.app)<br />
**Source:** [cpccu/Hackathon2-Duofrog](https://github.com/cpccu/Hackathon2-Duofrog)

## What students can do

CampusOS includes four end-to-end campus modules:

- **Club & Event Engine:** Browse and search events from campus clubs, view event details, RSVP, retrieve a private registration QR code, and let organizers check attendees in.
- **Resource Hub:** Browse and search course and department materials. Administrators can upload supported files to private Supabase Storage; signed-in students can access resources through the app.
- **Smart Helpdesk:** Search source-linked university guidance and published shuttle route information from one place. Timings are shown only when the university publishes them.
- **Lost & Found and Complaint Box:** Post and search lost or found items, attach photos, mark a post resolved, and submit a private complaint whose status can be followed in the app.

The app also includes searchable official notices with private file attachments and an administrator area for campus content and user-role management.

## A day at City University

A first-year student can use CampusOS to find verified central clubs published by the Directorate of Students’ Welfare, then use one searchable workspace for events, course materials, university guidance, and student support rather than checking separate social groups, chat threads, forms, and notice boards. Before an exam, they can search the Resource Hub for course notes or past papers. If a class or campus service update is added as a notice, it is searchable alongside helpdesk guidance; the Notices page also links directly to City University’s live notice board so students can verify the latest deadlines. A student who loses an ID card can post its location and date, then check the same board for a match.

## City University sources and data freshness

- The Club Directory shows the six central clubs named by the [Directorate of Students’ Welfare](https://www.cityuniversity.ac.bd/dsw). This verified list links to the university page for committee details.
- The Notices page links to the [official university notice board](https://www.cityuniversity.ac.bd/all-notice), where current academic calendars and announcements are published. CampusOS does not claim its curated notice list is a complete or real-time mirror.
- Helpdesk answers link to their official university sources. For transport, the published guidance avoids inventing route stops and times that City University does not provide on its source page.
- Six DSW-listed central clubs are represented as sourced directory records; their cards link back to the university page. Other club profiles and event listings may be student or organizer submissions and are not independently verified. Only the original CampusOS demo events are marked **Sample**; students should confirm schedules with organizers and official university channels.
- Notices sourced from the official university notice board include a direct source link. The published helpdesk also covers the official theory-course mark breakdown, incomplete grades, make-up exams, and retake policy, with reminders to check current course and department instructions.

## Technology

- Next.js App Router 16 and React 19
- JavaScript and Tailwind CSS 4
- Supabase Auth, Postgres, Row Level Security, and private Storage
- `@supabase/ssr` for cookie-based server and browser clients
- Vercel for hosting and GitHub integration for source control and deployments

## Run locally

Requirements: Node.js 24.x and npm.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/cpccu/Hackathon2-Duofrog.git
   cd Hackathon2-Duofrog
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   The publishable key is designed for browser use. Never put a Supabase secret or service-role key in a browser variable or commit one to Git. `.env.local` is ignored by Git; `.env.example` contains placeholders only.

3. Apply the SQL files in `supabase/migrations/` to your Supabase project in timestamp order. For a fresh project, use the Supabase SQL Editor and stop if a migration reports an error before proceeding. The migrations create profiles, resources, clubs and events, event registration and QR check-in, the helpdesk, notices, Lost & Found, complaints, and administrator functions and policies.
4. In Supabase Auth, set the Site URL to the deployed app URL. Add the local and production callback URLs ending in `/auth/callback` to the allowed redirect URLs. Configure email confirmation to match the sign-up flow you want to demo.
5. To enable **Continue with Google**, create a Web OAuth client in Google Cloud Console. Add the production app URL and `http://localhost:3000` as authorized JavaScript origins. Add `https://brdirpmkyrkaqguiyabj.supabase.co/auth/v1/callback` as an authorized redirect URI in Google. In Supabase Dashboard, open **Authentication → Sign In / Providers → Google**, enable Google, and enter the OAuth client ID and secret. In Supabase **Authentication → URL Configuration**, allow `https://hackathon2-duofrog-ochre.vercel.app/auth/callback` and `http://localhost:3000/auth/callback` as redirect URLs. Keep the Google client secret in Supabase provider settings; it does not belong in `.env.local`, Vercel environment variables, or this repository.
6. Start the app:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000). Create an account through the sign-up page; the repository does not include shared demo credentials.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative | Legacy browser-safe key for older Supabase projects |

Set the same public URL and key in Vercel's Development, Preview, and Production environments. These values are intended for client use; database access is protected by Supabase Row Level Security. Keep secret keys out of the repository and client bundle.

## Roles and content setup

New sign-ups receive the student role from a database trigger. The signup form cannot grant administrator access. Promote an administrator only through a trusted Supabase database operator session after verifying the profile ID. To enable club event management, assign a club's `manager_id` to an existing profile through a trusted operator session. Uploaded resources and official notice attachments are managed by administrators; Lost & Found posts are available to authenticated students.

The Club & Event Engine migration adds starter club and event records only when the club directory is empty. The follow-up verified-content migration adds DSW central clubs idempotently, labels only known original demo event fixtures as samples, and adds source-linked university guidance and notices. Student submissions are not replaced. There are no shared demo accounts; judges can create their own account on the live app.

## Commands

```bash
npm run dev     # local development
npm run lint    # lint source files
npm run build   # production build
npm run start   # serve a production build
```

## Hackathon submission checklist

- **Live app:** [https://hackathon2-duofrog-ochre.vercel.app](https://hackathon2-duofrog-ochre.vercel.app)
- **CPCCU repository:** [https://github.com/cpccu/Hackathon2-Duofrog](https://github.com/cpccu/Hackathon2-Duofrog)
- **Demo account:** Create an account on the live app; no shared password is published.
- **Presentation and demo video:** Add the public viewer link here after uploading the video. The walkthrough should cover the problem, solution, live demo, features, and technical implementation.
- **Submission form:** Include the team details, project description, modules, live link, repository, account access instructions, technology stack, video link, and this documentation link.
