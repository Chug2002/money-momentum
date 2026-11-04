# Money Momentum

A personal finance portfolio project with account tracking, cash-flow forecasts, bill calendars, debt planning, and optional read-only Plaid connections. Built using React, TypeScript, Vinext, and Cloudflare Workers/D1.

The included November 2026 budget is a fictional simulation. Manual entries and connected-bank data are separate. This repository contains source and tests, not production databases, bank credentials, or account exports.

## Features

- Shared desktop and phone screens for Dashboard, Cards, Bills, Debt, Credit, Trends, and Calendar.
- An optional eight-step tour with Skip, Back, and replay controls.
- An interactive sample-data demo isolated from private financial records.
- A home-screen app experience and customizable themes.
- Income, spending, transfers, credit payments, and per-account running balances.
- Bill calendars, cash cushion forecasts, debt payoff estimates, and manual credit-score tracking.
- Versioned account saves with conflict handling across devices.
- Optional Plaid account linking, transaction synchronization, and disconnect cleanup.
- Optional consent-based Web Push, daily summaries, and budget alerts.
- A device PIN privacy screen with inactivity locking.

## Architecture

`public/` contains the browser interface and calculations. `app/` contains server routes and validation. Cloudflare D1 stores user-scoped records; `drizzle/` contains migrations. Plaid calls and bank-token encryption run server-side. Hosted authentication comes from the Sites gateway.

| Area | Technology |
| --- | --- |
| Interface | HTML/CSS, JavaScript, React framework shell |
| Server | TypeScript, Vinext, Cloudflare Workers |
| Storage | D1/SQLite, Drizzle schema and migrations |
| Banking | Optional Plaid Transactions integration |
| Notifications | Web Push and VAPID |
| Tests | Node assertions, isolated SQLite, mocked services |

## Local setup

Use Node.js 24 or newer for the complete test suite, which uses built-in SQLite.

```sh
npm ci
npm test
npm run dev
```

Open the loopback URL printed by the server. The development adapter simulates sign-in at `/signin-with-chatgpt?return_to=/`; this is for local development only. Apply the SQL migrations in `drizzle/` to a configured local D1 database to exercise account saves. The hosting manifest declares `DB` without a production project ID.

Bank linking and push delivery require separate service configuration. See [PLAID_SETUP.md](PLAID_SETUP.md), [NOTIFICATIONS.md](NOTIFICATIONS.md), and [SECURITY.md](SECURITY.md). Tests use fake banks and do not connect to real accounts.

```sh
npm run build
```

Build the independent public Cloudflare demo with `node scripts/build-cloudflare-demo.mjs`, then deploy using `cloudflare/wrangler.jsonc`. Its `/account` entry currently links to the protected private app; migrating private bank access requires separate verified authentication and database setup.

Production deployment requires a trusted authentication gateway, database bindings, and managed runtime secrets. A custom domain also requires updated allowed origins and a Plaid redirect URI.

## Security and limitations

The code implements authenticated API checks, user-scoped parameterized database queries, origin checks for writes, validation, AES-GCM protection of Plaid tokens, and salted PBKDF2 device-PIN hashing. The PIN is a browser privacy screen, not encryption of financial records. See [SECURITY.md](SECURITY.md).

This is a portfolio project, not a certified financial product. Tests do not establish production readiness or regulatory compliance. No independent security audit was performed during repository preparation.

## Review guide

Start with `public/phone-core.js` for calculations, `app/api/log/route.ts` for versioned saves, `app/plaid-server.ts` for bank-token handling, and `test-plaid.cjs` / `test-log.cjs` for authorization and isolation tests. Starter and vendor notices are retained.

The public demo uses the same application screens with fictional current-month data and separate session storage. Production bank credentials, live databases, deployment identities, and original private Git history are excluded.
