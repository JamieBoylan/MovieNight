# 🎬 Movie Night

Letterboxd, but it's just your group chat. Anyone can make a free
account, create a group, invite friends by link, log the movies you
watch together, and rate them — with aggregate stats, leaderboards, and
fully custom fun fields (Bechdel test, "who fell asleep," "Corv Cameo,"
whatever your group tracks) that you define yourself, no code required.

Built with Next.js 14 (App Router), Prisma, and Tailwind CSS. Real
accounts (email + password, hashed with bcrypt), sessions stored in the
database so they're instantly revocable. Groups are invite-link only —
there's no public directory, so a group is only findable by someone who
has its link.

## ⚠️ About this codebase

This was hand-written directly rather than scaffolded and test-run,
because the environment it was built in had no network access to npm
(no `npm install`, no build step could be run there). The code follows
standard, well-worn Next.js/Prisma patterns throughout, but **you are
the first one to actually run it** — see "If something breaks" below
before assuming a report of an issue is something you did wrong.

## Getting started

You'll need [Node.js](https://nodejs.org) 18.18+ installed (20 LTS
recommended), and a free Postgres database — see the deployment guide
below for how to get one from Neon in about a minute. There's no local
database file to worry about; local dev and production both point at
the same Postgres connection string.

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment file, then paste your Neon connection
#    string into DATABASE_URL
cp .env.example .env

# 3. Create the tables in your database
npm run db:push

# 4. (Optional but recommended) load demo data from a real spreadsheet
#    so you can see the app populated on first run
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an
account. If you ran the seed step, you can instead log in as one of the
demo members and see the group already populated:

```
jamie@example.com    (owner)
corvus@example.com
leo@example.com
bella@example.com
anikin@example.com

password for all of them: movienight1
```

## How it works

- **Real accounts** — sign up with an email and password. Sessions are
  random tokens stored (hashed) in the database and set as an httpOnly
  cookie, so logging out (or you deleting the session row) invalidates
  it immediately — no JWTs to worry about expiring on their own.
- **Groups are invite-link only** — creating a group makes you its
  owner. Share the group's URL and anyone who signs up (or logs in) and
  opens it gets a "Join this group" screen before they can see or rate
  anything. There's no public directory of groups.
- **Roles** — the owner can edit the group's name/tagline, remove
  members, and delete the group. Everyone (owner included) can log
  movie nights, rate them, and add custom fields. Non-owners can leave
  a group; the owner has to delete it instead of leaving.
- **Custom fields** — from a group's Settings page, add any extra
  field you want to track: yes/no, free text, a number, or a pick-one
  list. Each field is scoped either to the whole movie night (like a
  Bechdel test) or to each person's individual rating (like "would
  recommend to a stranger").
- **Stats** — the Stats page computes group averages, a leaderboard
  (harshest critic, easiest to please, sleepiest, best/bravest picker,
  most up for a rewatch), and calls out the most divisive pick and the
  highest/lowest rated movies.
- **Live IMDb search** — set `OMDB_API_KEY` in `.env` (a free key from
  [omdbapi.com](https://www.omdbapi.com/apikey.aspx)) and the "Log a
  movie night" title field becomes a search-as-you-type box: matches
  show up with poster thumbnails as you type, and picking one
  auto-fills the title, year, runtime, IMDb rating, and poster art. If
  you skip the picker and just type a title by hand, it still tries a
  one-shot lookup on submit. Without a key, everything still works —
  you just fill those fields in yourself.

## Project structure

```
app/
  page.tsx                  Homepage — marketing (logged out) or your groups + create/join (logged in)
  actions.ts                 Auth (signup/login/logout) + create/find-group actions
  login/page.tsx              Log in
  signup/page.tsx              Sign up
  g/[slug]/
    layout.tsx                Auth gate, "join this group" gate, header/nav
    page.tsx                   Movie feed (dashboard)
    actions.ts                  All server actions for a group (auth-checked)
    new/page.tsx                Log a movie night
    movie/[movieId]/page.tsx    Movie detail + rating form
    stats/page.tsx               Leaderboard & aggregate stats
    settings/page.tsx            Group/member management, custom fields
components/         Shared UI (forms, cards, badges)
lib/
  auth.ts             Password hashing, sessions, requireMember()/requireOwner() guards
  db.ts               Prisma client
  stats.ts             Stats math
  utils.ts, omdb.ts    Formatting helpers, optional IMDb lookup
prisma/
  schema.prisma       Data model (User, Session, Group, Member, Movie, Rating, CustomField…)
  seed.ts              Demo data loader
```

## Deploying it live (Vercel + Neon)

1. Push this code to a GitHub repository.
2. Create a free [Neon](https://neon.tech) Postgres database — easiest
   done from inside Vercel (Storage → Marketplace → Neon), which
   provisions it and wires up `DATABASE_URL` automatically.
3. Import the GitHub repo as a new Vercel project. Vercel detects
   Next.js automatically; no build config changes needed (`postinstall`
   already runs `prisma generate`, and `secure` session cookies kick in
   automatically once `NODE_ENV=production`, which Vercel sets for you).
4. Add `OMDB_API_KEY` as an environment variable too if you're using it.
5. Once `DATABASE_URL` is set (locally in `.env`, and in Vercel), run
   `npx prisma db push` once to create the tables in Neon, and
   optionally `npm run db:seed` to load the demo group.
6. Deploy. Vercel gives you a `*.vercel.app` URL — that's your live site.

Both Vercel's Hobby plan and Neon's Free plan are $0/month with no
credit card required, and comfortably cover a friend-group app like
this one.

## Known limitations (v1)

- **No "forgot password" flow.** Resetting a password would need a
  transactional email service (e.g. Resend), which wasn't part of this
  round — if someone forgets theirs today, the only fix is deleting and
  re-creating their account. Worth adding before this gets real signups
  you'd be annoyed to lose.
- **No rate limiting** on login/signup — fine for a friend-group launch,
  not yet hardened against someone hammering the login form.
- **No email verification** — signup trusts whatever email address is
  typed in.

## If something breaks

Since this wasn't test-run before landing in your hands, here's how to
get unstuck quickly:

- **`npm install` fails** — make sure you're on Node 18.18+ (`node -v`).
- **Prisma errors on `db:push`** — delete `prisma/dev.db*` and
  `node_modules/.prisma`, then run `npm install` and `npm run db:push`
  again.
- **A page throws an error** — the terminal running `npm run dev` will
  show the actual stack trace, which is the fastest way to tell me
  (or another AI) exactly what broke and where.
- **Styling looks unstyled** — make sure `npm install` finished
  cleanly; Tailwind needs its dependencies present to generate CSS.

Everything here uses ordinary, well-documented Next.js/Prisma patterns,
so most issues should be quick to fix with the error message in hand.
