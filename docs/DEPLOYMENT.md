# Build, deploy, verify, recover

## Keep the two runtimes separate

The current standalone app uses `cloudflare/wrangler.jsonc` and `cloudflare/full-worker.ts`. The retained Sites manifest/framework build belongs to the other existing deployment. A standalone change must not republish that Site, migrate its data, or reuse its runtime credentials.

## Checks before release

```sh
npm ci
npm test
npm run build:cloudflare
npm run check:cloudflare
```

The GitHub workflow performs the same test/build/packaging sequence. Its build job depends on the test job and produces a commit-named artifact. Tests use synthetic records and mocked external services.

The workflow does not deploy production. Cloudflare's connected Builds service independently deploys its production branch. Required branch checks should be configured separately if the repository owner wants merges to be technically blocked by failed checks; this documentation does not claim that branch protection is enabled.

## Required runtime settings

| Setting | Storage |
|---|---|
| `APP_ORIGIN` | Exact HTTPS origin for the deployment |
| `FIREBASE_WEB_CONFIG` | Public Firebase web configuration JSON |
| `PLAID_ENV` | `production` for approved live access; `sandbox` for isolated test-bank deployments |
| `PLAID_REDIRECT_URI` | Exact return URL, also registered in Plaid |
| `PLAID_CLIENT_ID`, `PLAID_SECRET` | Protected Cloudflare runtime secrets |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Stable 32-byte AES key encoded as 64 hex characters, protected secret |
| `PUSH_PRIVATE_JWK`, `PUSH_PUBLIC_KEY` | VAPID key pair for subscribed devices; private material stays protected |
| `DB` | D1 binding for this deployment's records |

Wrangler's `keep_vars` setting preserves dashboard-managed variables. Existing runtime secrets are managed separately. Never replace the encryption or notification keys as a troubleshooting shortcut; existing encrypted bank tokens or device subscriptions depend on them.

## Fresh local D1 schema

For a new local database, use the standalone config and execute the financial migrations in order, followed by the auth schema. `--local` is important here:

```sh
npx wrangler d1 execute money-momentum-private --local --config cloudflare/wrangler.jsonc --file drizzle/0000_vengeful_rogue.sql
npx wrangler d1 execute money-momentum-private --local --config cloudflare/wrangler.jsonc --file drizzle/0001_vengeful_guardsmen.sql
npx wrangler d1 execute money-momentum-private --local --config cloudflare/wrangler.jsonc --file drizzle/0002_dizzy_aaron_stack.sql
npx wrangler d1 execute money-momentum-private --local --config cloudflare/wrangler.jsonc --file cloudflare/auth-schema.sql
```

Production schemas are already applied to the deployed standalone database. Do not rerun historical migrations blindly against an existing remote database. Review a new migration and its recovery plan before applying it.

## Deployment path

The existing Cloudflare Builds production command is `node scripts/build-cloudflare-demo.mjs`; that file delegates to `build-cloudflare-full.mjs`. Deployment uses `npx wrangler deploy --config cloudflare/wrangler.jsonc`. The name is retained for compatibility; it is no longer a tutorial-only build.

Nonproduction branch builds use `npx wrangler versions upload --config cloudflare/wrangler.jsonc`. This uploads an undeployed Worker version using the standalone configuration; it does not promote that version to production. Preview URLs remain disabled. The default branch command failed because it did not find the configuration in the `cloudflare` directory.

An authorized maintainer can also deploy the built app with the same Wrangler config. Record the source commit and returned Worker version. A successful upload is not proof of a successful login, save, or bank authorization.

## Verify after deployment

Follow [VERIFICATION.md](VERIFICATION.md). Inspect public routes, rejected anonymous private requests, sign-out, account saves, and provider flows. Use only fictional data in published screenshots. The account holder completes passwords, bank authentication, and consent.

## Recover a bad release

1. Identify the last known working source commit and Cloudflare Worker version in deployment history.
2. Use Cloudflare's supported rollback controls for that Worker, or revert the source change through a reviewed commit and let the connected build run.
3. Do not rotate secrets or delete a database to undo a code change.
4. A code rollback does not undo schema changes or financial records. Review schema compatibility separately.
5. Repeat the live checks and document what failed, what changed, and which regression test now covers it.
