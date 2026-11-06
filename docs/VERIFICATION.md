# Verification evidence and remaining checks

Updated November 6, 2026. This separates automated evidence from actual provider/user flows. It is not a security audit or a claim that every listed flow has been completed live.

## Automated evidence

`npm test` discovers test files in the repository. The original calculation/UI tests are joined by Firebase verification, account storage, Worker boundary, provider error, and session-to-database integration tests.

| Behavior | Evidence |
|---|---|
| Signed identity, verified email, project/audience, recent auth | `test-cloudflare-auth-service.cjs` uses signed local RSA tokens and a provider lookup mock |
| Password confirmation, verification delivery failure, resend behavior | `test-firebase-login.cjs` with a fake Firebase client |
| Session → Worker → save route → D1-shaped SQLite | `test-cloudflare-account-integration.cjs` with synthetic Alice/Bob accounts |
| Per-user records, stale-tab writes, version conflict, logout revocation | Integration test above; no personal records are written |
| Header spoofing and cross-origin writes | `test-cloudflare-full.cjs`, integration test, save-route tests |
| Isolated device drafts and bank OAuth state | `test-account-storage.cjs` |
| Bank token encryption, ownership, one-time exchange, sync and disconnect | `test-plaid.cjs`, using fake banks only |
| Plaid redirect wording, actionable Link exits, stale-state cleanup | `test-plaid.cjs`, `test-bank-link-feedback.cjs` |
| Freshness, cooldown, visibility, no overlapping refresh | `test-bank-auto-refresh.cjs` |
| Independent sample-data tutorial | `test-demo-isolation.cjs`, live demo review |

The CI build then bundles the standalone browser assets and verifies the Worker with Wrangler `--dry-run`. Its artifact is a packaged code version, not a database backup.

## Live observations

- Public welcome, tutorial, and login pages returned successfully.
- Signed-out `/account` redirects to login; anonymous financial APIs return 401.
- Signup shows password confirmation. Live browser sign-out returned to `/login` without the earlier API error.
- The account holder reported sign-in working. A signed-in account displayed “Saved account log loaded.” The account holder later confirmed that an intended manual-plan edit remained after saving and reopening the app on their phone. The persisted values were not copied into this record.
- Plaid's allowlist originally contained only the standalone homepage. The account return path `/account` was added with the owner's explicit approval, retaining the existing address.
- After that correction, the app opened production Plaid Link. The account holder completed bank authorization on their phone; the signed-in app then displayed the connection and account cards. A manual refresh returned “Bank data refreshed.” No balances, transaction details, bank names, or private screenshots were copied into this documentation.
- The tutorial screenshots in `docs/images/` use fictional data.

## Account-holder acceptance checklist

Authenticator MFA: Identity Platform was upgraded with owner approval while retaining Spark, and project configuration returned enabled TOTP with one adjacent interval. Synthetic MFA client and signed server-policy tests pass. Real account-holder enrollment and fresh MFA sign-in remain to be completed; project-level configuration does not mean an account is enrolled.

- [ ] Authenticator setup: scan the private QR code, confirm a current code, then complete a fresh MFA sign-in.
- [ ] Authenticator failure: a wrong code does not open the planner; a current valid code succeeds.

Complete these in the actual app and record the outcome privately; avoid putting financial records or screenshots in public issues.

- [ ] New email account: create, receive verification email, verify, then sign in.
- [ ] Existing Google account: sign in and see the intended account.
- [x] Manual save: make an intended real edit, see “Saved,” reopen the app, and confirm it remains.
- [ ] Second device: confirm the same signed-in account sees the saved edit.
- [ ] Concurrent edit: confirm a conflict prompts a choice instead of silently overwriting.
- [ ] Sign out: return to login and confirm the account is protected when revisited.
- [x] Bank authorization: account holder completes Plaid, then sees the expected institution and accounts.
- [x] Bank refresh: new connection retrieves data or explains a preparation delay honestly.
- [ ] OAuth return: a supported bank returns to the signed-in account page.
- [ ] Notifications, if enabled: device permission, actual delivery, and privacy settings work.
- [ ] Disconnect, when intentionally requested: connection access and saved bank data are removed while the manual plan remains.

Different email identities are different accounts. Do not expect an email/password account and a Google account with different addresses to share records.

## Known limitations

Financial data is not guaranteed to be current. Manual credit-score entries are not a bureau integration. Automated tests do not exercise real Firebase mail delivery, bank authentication, or push delivery. Browser PIN checks do not encrypt local data. Account recovery, abuse handling, retention, dependency review, and broader security testing need continued review before wider use.
