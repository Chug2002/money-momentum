# Tutorial deployment

Cloudflare Workers Builds is connected to Chug2002/money-momentum, production branch `main`.

- Build command: `node scripts/build-cloudflare-demo.mjs`
- Deploy command: `npx wrangler deploy --config cloudflare/wrangler.jsonc`
- Root directory: `/`
- Preview builds: disabled
- Published tutorial: https://money-momentum.budgetstudio.workers.dev/

Commits merged into main automatically build and deploy the tutorial. The dedicated configuration uses only the ASSETS binding and fictional session data. Do not replace it with the private Sites Worker configuration or attach personal databases, bank credentials, or authentication secrets.

The signed-in personal app and its existing database remain separate. GitHub contains source code, not saved financial records.

## Shared entry point

The root URL now offers the tutorial at /demo and real-account login at /account. The login route opens the existing protected Sites app, preserving its identity, saved records, access policy, and Plaid integration. The Cloudflare Worker itself serves the welcome page and demo; it does not host private APIs or collect bank credentials. This is a shared entry point, not a database or authentication migration.
