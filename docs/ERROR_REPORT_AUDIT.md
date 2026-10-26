# Error-report audit — 2026-10-26

Reviewed all five saved report groups in the test browser: google.connect / Settings (5 occurrences) and google.sync / Settings (40), Today (1), Index (2), Search (9). Sync reports were dated October 13–14; the latest connection report was October 25 local time. All had lost their exception type and source frames after reopening. Their individual original causes cannot be reconstructed, and the reports have been retained as history.

Changes:
- Normal authorization expiry now pauses sync with a reconnect instruction rather than adding an application error report. Local edits remain queued.
- Google sign-in now distinguishes a closed popup, denied consent, failed popup opening, timeout, unavailable library and rejected OAuth setup. Cancellation/denied consent remain clear statuses rather than bug reports.
- Persisted reports retain only allowlisted exception types, safe Daybook source-frame paths and fixed diagnostic categories. Raw exception text, account identifiers, credentials and journal contents remain excluded. Legacy missing details are not invented.
- Reinitializing report storage no longer duplicates the report list. The list now labels reports as history and shows local last-seen timestamps.

Google’s documented callback error types: https://developers.google.com/identity/oauth2/web/reference/js-reference

Validation: full suite 275 tests passed before a structural helper move; final focused suite 39 tests passed; browser bridge simulation covers success, timeout/late callback, cancellation, blocked popup, denied access, setup errors and library failures. Final analyzer clean. Historical reports do not prove a current service outage or a repaired remote-account problem.
