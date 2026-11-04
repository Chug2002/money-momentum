# Security model

## Implemented controls

- Hosted access is governed by the Sites access policy. Application routes reject requests without a gateway-provided user identity.
- Financial records and bank connections are queried using the authenticated user ID and parameterized SQL. Ownership is checked before bank synchronization or disconnection.
- Mutating user requests check Origin against the configured application address. Sensitive API responses use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Server validation constrains log structures, collection sizes, supported actions, and bank-link requests. Version checks prevent silent overwriting of another device's save.
- Plaid access tokens use AES-GCM with random 96-bit IVs, a 256-bit key, and user/item identifiers as authenticated additional data. Keys and Plaid secrets belong in server runtime configuration.
- Linking sessions are user-scoped, expire, and can be claimed once. Link-token creation has a per-user limit; synchronization uses a lease and minimum interval.
- PIN hashing uses random salts and PBKDF2-SHA-256 with 310,000 iterations. Browser code adds retry delays and inactivity locking.
- Push code restricts endpoints, requires consent, scopes subscriptions by user, and defaults to private lock-screen payloads. Scheduled jobs require a separate capability.

## Trust boundaries and limitations

Identity headers are trusted because the Sites gateway supplies them. Do not expose this Worker directly on another host and accept arbitrary client-provided identity headers. Another host needs equivalent authentication and header stripping or verification.

The PIN and retry counter are enforced in browser JavaScript/storage and can be bypassed by someone controlling that browser. Local financial records are not encrypted by the PIN. AES-GCM described above protects bank tokens, not all financial fields or backups.

Origin checks currently name the existing `chatgpt.site` origin. A custom domain requires reviewed changes in log, Plaid, and notification code, corresponding tests, and Plaid's registered redirect URI. Domain validation must complete before using the new address.

No independent penetration test, dependency vulnerability audit, regulatory assessment, or live bank authorization test was completed for this repository preparation. Tests use mocked services and isolated databases. General abuse controls, retention, recovery, access logging, and browser storage warrant further production review.

## Secrets and reporting

Never commit `.env` files, `.dev.vars`, private keys, production exports, push subscriptions, or real bank tokens. This copy excludes local credentials, generated output, runtime databases, production deployment metadata, and original Git history. `.env.example` contains variable names only.

If a secret is published, revoke or rotate it; removing it from the latest commit does not remove history. Use a private repository security advisory when available. Do not disclose credentials or financial records in public issues.
