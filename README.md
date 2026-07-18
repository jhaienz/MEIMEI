# MEI MEI

MEI MEI is a two-Round creativity and IT/CS quiz for a College of Computer Studies org
fair. Students match with one of eight **Personas**, earn a Knowledge Round **Score**, and
join two live boards.

The app runs either on Vercel or in Docker on the booth Mac, backed by one Neon Postgres
database. `CONTEXT.md` defines the domain language; `docs/adr/` records the decisions behind
it.

## Quiz flow

**Home → Name → Persona Round → Knowledge Round → Reveal → Boards**

- Home links to How to Play, Personas, and the live boards.
- The Persona Round has 12 untimed questions with no correct answers.
- The Knowledge Round has 12 timed IT/CS questions and produces the Score.
- An abandoned run writes nothing. The Reveal stays open until **DONE** is selected.

## Deploy to Vercel

1. Import this repository as a Vercel project.
2. From the Vercel Marketplace, create and connect a Neon Postgres database. Connect the
   same database to Production and Development so both receive `DATABASE_URL`.
3. Add a strong `ADMIN_PASSWORD` to both Vercel environments.
4. Pull the environment variables and seed the database once:

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run seed
```

5. Deploy from the Vercel dashboard or run:

```bash
npx vercel --prod
```

`npm run seed` creates both tables and fills the Knowledge Question pool from Open Trivia
DB. It is safe to rerun: existing question text and curation flags are preserved.

## Run locally

Local development intentionally uses the same Neon database as production.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Clear test Responses before the fair using Staff Mode.

## Run at the booth with Docker on macOS

Install Docker Desktop, create `.env.local`, and replace both placeholder values:

```bash
cp .env.example .env.local
```

Then run:

```bash
docker compose up --build -d
```

Open <http://localhost:3000> and enter full-screen mode. The container restarts unless
stopped and uses the same Neon database as Vercel and local development.

```bash
docker compose logs -f   # view logs
docker compose down      # stop after the fair
```

The image contains only the production Next.js standalone server. Run `npm run seed` before
fair day; the container does not fetch questions from Open Trivia DB.

## Admin

Open `/admin`, enter `ADMIN_PASSWORD`, then select **Clear Boards**.

- **Clear Boards** permanently removes every Response, including Names and answers.
- Knowledge Questions are never removed.
- If `ADMIN_PASSWORD` is missing or incorrect, the quiz still runs but the boards cannot be
  cleared.

## Fair-day setup

1. Start the app with `docker compose up --build -d`.
2. Enter full-screen mode.
3. Confirm the boards load and complete one test Response.
4. Clear the test Response before students begin.

The booth needs internet access because Neon is hosted.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Questions come from [Open Trivia DB](https://opentdb.com), CC BY-SA 4.0. Persona Round
wording and Knowledge Question curation still require final review by the organization.
