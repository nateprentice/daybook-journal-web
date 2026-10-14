# Journal practice red-team checks

Fixed:
- Retained daily-log links now say Completed or Crossed out when appropriate, rather than implying that a stopped task is still scheduled.
- Word exports limited to an earlier log retain the moved entry's annotations even when its current date is outside the exported range.
- Bullet key uses an explicit accessible button instead of a disclosure whose action was missing from web accessibility controls.

Additional adversarial coverage rejects concurrent reflection changes rather than overwriting newer content. Full suite: 253 tests passed. Existing checks include backup/restore, storage failures, offline/reconnect, conflict recovery, safe transport retries, 1,000-entry scale and large-text layouts. Physical-device and cold-offline website checks remain release limitations.
