# A test-first change in the real application

## Requirement

When a bank-link attempt fails, show a safe, actionable explanation rather than losing the provider's useful error code. Expired attempts must not retain stale OAuth/link state. Human-readable Plaid redirect errors should identify the exact configuration action.

## Red: demonstrate the bugs

Commit `db4dbb0` added tests before the implementation changed.

`node test-bank-link-feedback.cjs` failed with:

```text
expired Link token tells the person how to retry
actual: Bank linking was not completed. Please try again.
```

`node test-plaid.cjs` also failed when the fake provider returned `INVALID_FIELD` with “the provided redirect URI is not valid.” The old mapping recognized `redirect_uri` but missed `redirect URI` and returned a generic service error.

These were behavior assertion failures, not syntax errors.

## Green: implement the required behavior

- The Link exit handler maps known codes to next actions and includes only a validated code.
- It does not copy arbitrary provider display text into the UI.
- A closed attempt clears browser linking state and releases the Link instance.
- Ordinary cancellation remains a neutral “No new bank was connected” message.
- The API's redirect detection recognizes spaces, hyphens, and underscores, then gives the configured return URL.

The focused bank tests passed after these changes, as did the refresh tests. The full suite and Worker packaging run as separate release checks.

## Production configuration is separate from code

The owner's actual Plaid allowlist had the homepage but not `/account`. Adding that approved return path allowed the live app to open Plaid Link. The owner then completed bank authorization on their phone, and the signed-in app loaded the connection and completed a refresh. The error-message tests did not themselves configure the external provider or perform that authorization.

## Practice explaining this

1. What requirement did each assertion express?
2. Why was it useful to observe the original failure before changing the code?
3. Why avoid displaying the entire provider response?
4. What did the automated tests prove, and what required a live user flow?
5. Why is a successful Link window still different from a completed bank connection?

This change was developed with AI assistance. Use the history and tests to understand and reproduce the process before describing it as independent work.
