> **Historical document; current status updated November 6, 2026.** The standalone workers.dev app now includes public tutorial, Firebase sign-in, its own D1 database, and optional Plaid linking. The earlier tutorial-only restriction described below was superseded. No personal records or bank tokens were migrated from the separately hosted Sites app, which remains independent. Use the current README, SECURITY.md, and docs/DEPLOYMENT.md for the active configuration.

# Money Momentum source consolidation

Source inspected: Sites commit b89c6bc9000f2da3aafca8d085d86e8cc3725f8b, retrieved November 6, 2026. All 162 tracked source paths are represented in this repository. Missing UI components, hooks, examples, and npm configuration were copied. Existing matching files were retained. The GitHub app already had newer product-tour, demo-isolation, privacy-screen, and test improvements; those versions were kept instead of replacing them with older files. Package metadata, setup documentation, and ignore rules retain the repository's maintained versions.

The original Sites project ID is retained in .openai/hosting.json with its DB binding. The connected Sites account currently reports https://money-momentum.chelseahughes4057.chatgpt.site as the live URL. Earlier setup documentation refers to https://money-momentum.honeyamber64.chatgpt.site; that older hostname has not been verified as an equivalent route.

## Saved records

The existing Sites app stores signed-in manual logs, bank connections, transactions, and notification settings in its live D1 database. This consolidation does not modify that database, change identities, recreate the Site, or migrate account records. Local environment files, credentials, database files, generated builds, dependencies, and private Git history are excluded from this public repository.

GitHub stores source code, not account data. Continuing to use the same Sites app and database preserves the storage location. Browser-only changes still need a successful account save; the Daily Tracker's Download backup action provides a private manual-log backup. Keep that JSON outside this public repository. A new independent private Cloudflare deployment would require authentication, database migration, secrets, and user-ID mapping before it could replace the signed-in app.

## Tutorial-only deployment

https://money-momentum.budgetstudio.workers.dev/ is for tutorials with fictional data only. Its dedicated configuration, cloudflare/wrangler.jsonc, has no private DB binding. Its Worker denies private APIs and writes; the demo uses isolated session data. It must not become the personal finance deployment. No production deployment or database migration is performed by this source consolidation.
