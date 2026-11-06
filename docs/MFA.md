# Authenticator-app protection

Money Momentum supports optional Firebase TOTP MFA for verified email/password and Google accounts. Enrolled accounts must supply an authenticator code at every new Firebase sign-in. Accounts that have not enrolled continue to sign in normally. A Google account's own two-step verification is separate from this app's Firebase MFA.

## Set up your own account

1. Open `/login?security=1`, or choose **Set up authenticator protection** in the private app. Setup requires a fresh sign-in; an existing app cookie alone cannot enroll an authenticator.
2. Keep **Set up an authenticator app after signing in** checked, and sign in to the exact account you want to protect.
3. Check the email displayed on the setup screen. Scan the QR code in your authenticator app, or enter the setup key manually. Keep this key and QR code private.
4. Enter the current six-digit code and choose **Confirm and enable MFA**. Displaying a QR code alone does not enable protection.
5. Sign in again and supply a fresh authenticator code. Only this completed sign-in opens a new app session.

Cancel clears the temporary setup screen and signs out of the Firebase client. After successful enrollment, canceling or closing the page does not undo enrollment.

## How it connects

The browser uses Firebase's SDK to generate enrollment material, confirm a code, and resolve a second-factor challenge. QR generation runs locally in the bundled `qrcode` library; no QR service receives the setup URI. Firebase stores and verifies the enrollment. Money Momentum's database does not store authenticator secrets or codes, and its APIs receive only the signed Firebase ID token.

The Worker verifies that token, then looks up the provider's current account state. If the provider reports enrolled factors, a session is issued only when the signed `firebase.sign_in_second_factor` is `totp` and `firebase.second_factor_identifier` matches a current TOTP enrollment. This also rejects a signed password-only token obtained before enrollment. Hiding a button is not enforcement.

After enrollment, the browser asks the Worker to revoke that account's existing app sessions. The endpoint checks a recent signed identity, verified email, current provider state, origin, and rate limit; it can only revoke sessions for that identity. It never grants access. If revocation fails, the setup screen warns that older app sessions may remain valid for their existing lifetime, up to one hour. Existing cookies are not continuously rechecked against Firebase. Other accounts' sessions are unaffected.

## Recovery and limits

Keep access to your authenticator and any secure backup it supports. The app does not generate recovery codes or provide a self-service MFA removal endpoint. If you lose every enrolled authenticator, contact the app owner, who must verify ownership before resetting the enrollment using Firebase's supported administration controls. A password reset does not remove MFA. Do not disable MFA based only on a claimed email address.

The app does not support SMS second factors or automatically enroll anyone. Setup and entering real codes are account-holder actions. Never put setup keys, codes, QR images, credentials, or financial records in chat, screenshots, GitHub, or the learns workshop.

## Project configuration

- Firebase Authentication must be upgraded to Identity Platform. This project's owner approved the irreversible upgrade while remaining on the no-cost Spark plan, which has a 3,000 daily-active-user limit.
- Enable TOTP in the provider's project configuration; keep SMS disabled. Use one adjacent time window on either side of the current window for clock drift.
- Set the public UI capability flag `FIREBASE_TOTP_MFA=enabled` only after provider configuration succeeds. This flag reveals enrollment UI; it does not enforce the second factor or contain a secret.
- No D1 schema changes, service-account key, or new app-side encryption key are needed.

## Verification

`test-cloudflare-auth-service.cjs` first reproduced a bypass with a signed first-factor-only token (commit `b1a332f`, expected 401, observed 200). It now checks rejection of missing, wrong, and unsupported second-factor claims, accepts a matching signed TOTP claim, and checks enrollment-session revocation.

`test-firebase-mfa.cjs` uses synthetic SDK responses and a fake setup key. It checks email and Google challenges, no early session, malformed and wrong code handling, retry, setup confirmation, cancellation, cleanup, and optional enrollment. These checks do not prove live Firebase enrollment or a real authenticator works. Record the account holder's enrollment and fresh MFA sign-in separately in `VERIFICATION.md`.

Sources: [Firebase TOTP MFA](https://firebase.google.com/docs/auth/web/totp-mfa), [Identity Platform TOTP configuration](https://docs.cloud.google.com/identity-platform/docs/admin/enabling-totp-mfa).
