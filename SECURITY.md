# Security model

Optional authenticator-app MFA is handled by Firebase Identity Platform. The server checks current provider enrollment against signed second-factor claims before issuing a session. Enrollment requests revocation of existing app sessions. See [MFA configuration, recovery, and session limits](docs/MFA.md).

## Current standalone runtime

The workers.dev app uses the Firebase-backed session layer in `cloudflare/auth.mjs` and the boundary in `cloudflare/full-worker.ts`. The old Sites gateway is not the source of identity for this standalone Worker. The separately hosted Sites deployment retains its own access configuration.

- Provider tokens are verified with RS256 keys, the expected project audience/issuer, expiry, recent authentication, and verified email. Provider lookup checks current user state before issuing a Worker session.
- The server stores a hash of a cryptographically random session value. Its host-only cookie is Secure, HttpOnly, SameSite=Lax, and limited to at most one hour. Passwords and Firebase refresh tokens are not stored by the Worker.
- `/account` and financial APIs require a valid session. Client-provided identity headers are stripped before existing handlers receive a verified identity. Account API requests must also match the originating page's account to prevent stale-tab writes into a different session.
- Mutating requests require the configured application origin. SameSite cookies and origin checks are complementary controls. Financial responses use `Cache-Control: no-store`; the Worker supplies content, frame, and referrer restrictions.
- User-scoped parameterized queries and ownership checks protect saved records, bank items, transaction synchronization, and disconnect operations. Validation limits data shapes, dates, numeric values, sizes, and permitted actions. Version checks detect conflicting saves.
- Plaid access tokens are encrypted with AES-GCM, random 96-bit IVs, a 256-bit key, and user/item identifiers as authenticated additional data. Plaid credentials and encryption keys remain in protected runtime configuration.
- Linking sessions are owned by a user, expire, and can be claimed once. Link-token creation is rate-limited per user; synchronization uses a lease and a minimum refresh interval. Known provider errors are mapped to safe messages; arbitrary provider display text is not copied into the client.
- Device draft keys are separated by account. PINs use random salts and PBKDF2-SHA-256 with 310,000 iterations; retry delays and inactivity locks run in the browser.
- Push subscriptions and events are user-scoped. Permission is opt-in; lock-screen financial detail is off by default. The scheduled notification handler requires its internal job capability.

## Important boundaries

Do not expose the existing server handlers on an alternative host while trusting arbitrary identity headers. They must remain behind the verified standalone Worker or the appropriate Sites gateway.

The PIN is a browser privacy screen, not encryption of financial records. A person controlling that browser can inspect local storage or bypass client checks. AES-GCM here protects bank access tokens, not every financial field or exported backup.

Provider account state is checked at Worker-session creation. A later provider disable/revocation does not automatically invalidate an existing D1 session on every request; it can remain valid until server revocation or expiry. Logout revokes the current device session. There is no claim of an implemented all-device logout or user-facing account deletion/recovery administration.

The signup form asks for at least 15 characters and confirmation. This client requirement is not a substitute for a provider-side password policy; Firebase's provider policy must be reviewed separately. Email delivery and provider rate limits are external dependencies.

Real bank connectivity has been checked with an account-holder-authorized connection and successful refresh. That does not establish coverage of every bank, every OAuth flow, or a security/compliance assessment. No independent penetration test, dependency audit, or regulatory review is claimed. Retention, recovery, abuse handling, provider revocation, backups, and broader monitoring remain review areas.

## Secrets and reports

Never commit passwords, `.env`/`.dev.vars`, service-account keys, private encryption/VAPID keys, session cookies, bank tokens, push subscriptions, production database exports, or personal financial screenshots. The Firebase web configuration is public client configuration and is not a service-account secret.

If confidential material is published, revoke or rotate it and review history; deleting it from the latest source alone is not sufficient. Rotation of bank encryption or VAPID material requires a plan for existing encrypted tokens/subscriptions. Do not expose credentials or financial records in public issues. Use a private security advisory or other private reporting path available to the repository owner.
