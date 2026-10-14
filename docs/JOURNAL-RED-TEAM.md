# Journal practice red-team checks

Fixed four findings:
- Earlier daily-log links now describe Completed or Crossed out status instead of implying an active schedule.
- Date-limited Word exports keep moved entries' annotations when their current date is outside the export range.
- Bullet key is an explicit accessible button.
- Monthly commitments review excludes completed tasks while retaining them in monthly and daily history.

Concurrent reflection edits are rejected rather than overwriting newer text. Full suite: 254 tests passed, including backups, restore, storage failures, offline/reconnect simulations, conflict recovery, transport retries, 1,000-entry scale and large-text phone checks.

Live Google reconnect loaded the 1,022-entry test journal and finished Up to date. Live monthly review navigation and cancellation were checked without changing entries.

Cold offline website startup, physical native-device testing and broader multi-device live conflict tests remain unfinished. This remains a prototype for a one-month trial.
