# Standalone application architecture

## Browser responsibilities

`public/phone-app.js`, `phone-core.js`, and `tracker.js` display and calculate the plan. `device-settings.js` coordinates saving and conflict handling. Before those clients load on `/account`, `account-storage.js` scopes device storage by the server-rendered account identity and attaches that originating identity to account API calls. This prevents an old tab's drafts from being saved into a different account after a sign-in change.

Browser calculations improve usability; server validation remains necessary. A browser can forge a header, edit storage, or bypass a client-side rule.

## Identity and sessions

1. The Firebase SDK performs Google or email/password authentication. Passwords go to Firebase, not a Worker password database.
2. The browser sends its ID token to `POST /api/auth/session`.
3. `cloudflare/auth.mjs` verifies RS256 signature, project audience, issuer, expiration, recent authentication, verified email, and current provider user state.
4. A random session value is issued as a Secure, HttpOnly, SameSite=Lax, host-only cookie. D1 stores its hash, account ID, and expiry. Lifetime is no greater than the remaining ID-token lifetime or one hour.
5. Protected page/API requests resolve that session. A session is not refreshed automatically by a background Firebase refresh token on the server.
6. Logout deletes the stored session and expires the browser cookie. A regular form submission returns to `/login`.

Two different email identities are distinct accounts. This project does not automatically transfer records between them.

## Worker and data boundary

`cloudflare/full-worker.ts` serves `/`, `/demo`, `/login`, and `/signup` publicly. `/account` and financial APIs require a session. Non-auth account APIs additionally require the originating account identity, and mutating requests must match the configured application origin.

The Worker strips client-supplied identity headers before invoking the existing handlers with its server-verified identity. Its API origin check is not a replacement for ownership checks in database queries.

`app/api/log/route.ts` validates the bundle and writes with an expected version. A conflict returns HTTP 409 with the current server version. One person's update does not authorize access to another person's records.

| D1 data | Ownership/use |
|---|---|
| `auth_users`, `auth_sessions`, `auth_rates` | Provider identity, hashed limited-lifetime sessions, rate buckets |
| `manual_logs` | Validated saved plan keyed by user ID and version |
| `plaid_sessions` | User-owned, expiring, single-use linking attempts |
| `plaid_items`, `plaid_transactions` | User-filtered bank connection metadata and data |
| Notification tables | User preferences, devices, events, and internal job capability |

## Banking boundary

The browser asks the Worker for a temporary Plaid Link token. It never receives the Plaid client secret. The Worker sends an anonymous stable identifier rather than the user's email as Plaid's `client_user_id`.

The configured OAuth redirect must exactly match an allowed redirect in Plaid. After the person authorizes a bank, the browser returns a temporary public token. The Worker claims the owned linking session, exchanges the token, encrypts the durable access token with AES-GCM, and scopes subsequent data queries to the authenticated owner.

Closed or failed Link attempts discard browser linking state. Known Link errors give a next action and safe error code; arbitrary provider display messages are not copied into the UI. API redirect errors recognize both `redirect_uri` and human-readable `redirect URI` wording.

The app reads supported account and transaction data. It does not initiate transfers, bill payments, or card payments. Manual entries representing a payment are records of an event, not payment instructions.

## Build and operation

The standalone Worker imports TypeScript server handlers directly. Static assets are copied to `dist/cloudflare-full`, and Firebase's browser module is bundled. Deployment binds D1, assets, public runtime settings, and protected secrets. This is one Worker deployment with multiple routes; it is not a collection of independently deployed microservices.

An hourly Worker cron performs session/rate cleanup and the consent-based notification job. See the deployment and notification guides. The older Sites deployment has a separate runtime and is not modified by deploying this Worker.
