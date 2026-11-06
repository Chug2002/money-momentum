# Plaid setup for the standalone app

The app supports read-only supported bank/credit accounts and Transactions. It does not initiate payments or transfers. Cloning source does not grant live Plaid access; the account holder must authorize every bank connection.

## Runtime configuration

1. Configure an approved Plaid app and the required Transactions access. Use isolated Sandbox credentials for development, or approved production credentials for the live app.
2. In Plaid **Build → API → Allowed redirect URIs**, add the exact configured return URL. For the current standalone app it is:

   ```text
   https://money-momentum.budgetstudio.workers.dev/account
   ```

   Registering only the homepage ending in `/` does not register `/account`. Keep addresses required by other existing deployments.
3. Save `PLAID_CLIENT_ID`, `PLAID_SECRET`, and the stable `PLAID_TOKEN_ENCRYPTION_KEY` directly in protected Cloudflare runtime secrets. The encryption key is 32 cryptographically random bytes represented by 64 hex characters. Do not put values in chat, source, client JavaScript, or build logs.
4. Set `PLAID_ENV` to the matching environment and `PLAID_REDIRECT_URI` to the registered return URL. Keep the database and encryption key associated with their own deployment. Never copy credentials or bank records from another hosted app as a shortcut.
5. Deploy or save the runtime configuration. A configured flag only confirms required settings are present; it does not itself prove the provider accepted them.
6. Sign in, choose **Cards → Connect bank**, and let the account holder complete Plaid/bank authorization. Verify expected accounts appear, then refresh. A new connection's history may take time to prepare.

## Troubleshooting

| Error | Check |
|---|---|
| `INVALID_FIELD` mentioning a redirect | Exact allowed return URL, including `/account`; the app recognizes both `redirect_uri` and `redirect URI` wording |
| `INVALID_API_KEYS` or `UNAUTHORIZED_ENVIRONMENT` | Client ID, secret, and environment match; do not repeatedly retry a bank password |
| `PRODUCT_NOT_ENABLED` or `INVALID_PRODUCT` | Approved Transactions product access |
| `INVALID_LINK_CUSTOMIZATION` or `USER_SETUP_REQUIRED` | Plaid's Link/use-case setup |
| `INVALID_LINK_TOKEN` | Start a fresh linking attempt; expired browser link state is discarded |
| `INVALID_OAUTH_STATE` | Start a fresh connection and check the redirect/session flow |
| `INSTITUTION_DOWN` or `INSTITUTION_NOT_RESPONDING` | Try the bank again later |
| `ITEM_LOGIN_REQUIRED` | Existing connection requires a fresh bank authorization; review the app's reconnect guidance |

Do not publish raw provider responses, tokens, account data, or credentials when reporting an error. A validated error code and provider support reference, where available, are more appropriate diagnostics.

## Data behavior

Account and transaction data is filtered by the signed-in owner. Durable access tokens are exchanged and encrypted server-side. Bank data stays separate from the manual log. The browser refreshes stale connected data while visible and on appropriate return/online events, with a five-minute cooldown; it is not a continuous real-time feed. The UI displays up to 1,000 recent transactions across linked accounts.

Disconnect revokes the Plaid item and removes its stored bank data. It does not close the bank account, send a payment, or remove the manual plan. Only disconnect an actual connection when the account holder intends that action.

Financial schema files live in `drizzle/`, and the standalone authentication schema is `cloudflare/auth-schema.sql`. See [deployment instructions](docs/DEPLOYMENT.md) and [verification evidence](docs/VERIFICATION.md).

Provider references: [Plaid Link token API](https://plaid.com/docs/api/link/) and [OAuth setup](https://plaid.com/docs/link/oauth/).
