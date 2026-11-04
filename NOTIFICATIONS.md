# Money Momentum notifications

Phone delivery uses standards-based Web Push. VAPID signing material belongs in managed `PUSH_PRIVATE_JWK` (secret) and `PUSH_PUBLIC_KEY` runtime values. Do not rotate these while devices are subscribed.

The app is private. An hourly Sites cloud task calls `POST /api/notifications/job` using Sites service access plus the narrow job capability in the deployed D1 `notification_job_auth` row `primary`. Only project administrators can retrieve that capability using Sites database tools. Keep it in memory; never place it in a prompt, source file, URL, or output. `POST /api/notifications/job-init` initializes it without returning or replacing it. A job capability only runs the consent-based notification worker and returns aggregate completion counts; it does not grant access to user-facing financial APIs. Keep the Sites audience unchanged.

The task obtains the Site's current service-access bearer using `get_site`, then uses `read_database_overview` and `read_database_table_rows` to retrieve the existing capability. Call the job with `OAI-Sites-Authorization: Bearer <service access>` and `X-Notification-Job-Key: <capability>`. No visitor identity headers are invented. Do not modify user preferences or republish during a scheduled run. Report failures requiring attention; stay quiet on ordinary successful checks.

Users choose notification types and register each device under Settings → Manage notifications. iPhone Web Push requires iOS 16.4+ and the installed Home Screen app. Notification permission is requested only when the user presses Enable. Lock-screen financial details are off by default. Test delivery requires a subscribed device and user permission.

Bank updates follow Plaid's available transaction feed. The hourly task synchronizes existing authorized connections, establishes a baseline without alerting on old transactions, and sends alerts for newly observed posted bank-account transactions. Pending entries and card-account refunds/payments are not treated as bank income. No additional refresh product is enabled and no payments are initiated.

Daily summaries and motivation use each user's saved time zone and selected hours. Category-budget alerts deduplicate at 80% and 100% per category and month. Future/scheduled bills are not counted as actual spending. Event history stays private to the signed-in user; up to 50 recent events are displayed, and history is retained for 90 days. Removing a device unregisters that device without affecting other users.

`app/money-rules.ts` is the category source of truth. `scripts/generate-money-rules.cjs` regenerates matching frontend rules and validation during every build.
