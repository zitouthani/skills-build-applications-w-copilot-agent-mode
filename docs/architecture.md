# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Keep each responsibility in its existing tier; the browser must not access MongoDB directly, and the API remains unauthenticated for this exercise.

- Presentation tier decision: Build each capability as a React page that uses the shared API client for relative `/api` requests. Every page exposes accessible loading, empty, success, and error states; keep data fetching and rendering in the presentation tier.
- Logic tier decision: Keep HTTP parsing and status codes in Express routes and put input validation and business behavior in explicit service functions. Return deliberate 4xx errors for invalid input, missing records, or malformed IDs rather than leaking Mongoose cast errors as 500s.
- Data tier decision: Use Mongoose schemas to require and validate persisted fields. Keep demo seed data idempotent with upserts, preserving unrelated user data and reconciling a seeded user's former team membership when needed.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate IDs and confirm both records exist before creating an activity. Default points to minutes and the occurrence time to now when omitted; return the stored activity with its references, points, and timestamp.
- Team management approach: Require a non-empty name and mascot, validate that submitted member IDs identify existing users, and default missing members to an empty list. Return the created team and list stored teams without changing submitted names or mascots.
- Leaderboard approach: Sum activity points by team, include teams with no activities at zero points, sort by total points descending with a stable name tie-break, and assign 1-based ranks.
- Workout suggestions approach: Find the user by email and derive the preferred workout focus from their fitness goal and recorded activity. Rank matching workouts first and include a short reason; return 404 for an unknown email.

## Test plan

Run the focused tier tests first, then builds. Data or API failures indicate a persistence/schema or service/route contract regression; frontend failures identify missing request, presentation, or state behavior. A build failure indicates a type-check or production-bundling problem. Latest verification:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — passed (5 tests).
- API tier: `npm run test:api --prefix octofit-tracker/backend` — passed (4 tests).
- Presentation tier: `npm test --prefix octofit-tracker/frontend` — passed (15 tests); all four pages fetch and render API data with accessible loading, empty, success, and error states.
- Backend type-check: `npm run build --prefix octofit-tracker/backend` — passed.
- Frontend type-check and production build: `npm run build --prefix octofit-tracker/frontend` — passed.
