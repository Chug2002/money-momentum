# Money Momentum notifications

## Standalone Cloudflare Worker

The current `cloudflare/wrangler.jsonc` schedules an hourly Worker cron. `cloudflare/full-worker.ts` invokes authentication cleanup and the internal notification handlers using that deployment's D1 binding. It initializes the job capability when needed and uses it internally; no capability value is returned to the browser or committed to source.

Keep `PUSH_PRIVATE_JWK` protected and the matching `PUSH_PUBLIC_KEY` in runtime configuration. Do not casually rotate the VAPID pair while devices are subscribed. The standalone deployment uses its own existing keys and subscriptions.

Users choose notification types and register devices under Settings → Manage notifications. Permission is requested only when they press Enable. Lock-screen financial details are off by default. Live delivery requires a subscribed device and the user's permission. The implementation and mocked protocol tests do not prove delivery to every real device.

The job updates authorized bank connections, establishes a baseline without treating old transactions as new, and evaluates opted-in alerts. Pending transactions and card refunds/payments are not classified as new bank income. Notification work does not initiate a payment.

Daily summaries and motivation use the saved time zone and selected hours. Budget thresholds deduplicate at the implemented 80% and 100% levels. The event UI displays recent user-owned history; the job retains it for the configured retention window. Removing a device unregisters that device without changing another user's settings.

Category rules are defined in `app/money-rules.ts`. When changing them, run `node scripts/generate-money-rules.cjs`, review the generated browser/validation changes, and run the appropriate tests. The framework build invokes that generator; the standalone asset build copies the maintained generated browser source.

## Separate historical Sites deployment

The older ChatGPT-hosted app has its own runtime, access policy, database, and service-access scheduling arrangement. It is separate from the standalone Worker cron. Do not use a standalone setup change to alter that Site's audience, schedules, credentials, records, or subscriptions.

See [SECURITY.md](SECURITY.md) for trust boundaries and [docs/VERIFICATION.md](docs/VERIFICATION.md) for live checks still requiring account-holder action.
