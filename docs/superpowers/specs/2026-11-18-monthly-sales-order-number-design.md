# Monthly Sales Order Number Design

- **Intent:** Give each new Sales Order a readable number, `SO-YYYY-MM-XXXX`; sequence resets by order date month.
- **Goal:** Generate the next number from the highest existing number for that month. Keep `order_number` unique; handle concurrent collisions by retrying generation after a duplicate-key failure.
- **Non-goals:** Renumber existing SOs, change payment/invoice numbering, introduce a counter table.
- **Approaches:** (1) Database counter row: concurrency-safe, adds schema. (2) Highest number + 1: minimal schema/code, selected; requires unique-key collision retry under concurrency.
- **Constraints:** Use the validated `orderDate` month; generate only for new SOs. Editing a Draft must preserve its existing number. Existing unique index remains the final collision guard.
- **Builder call:** Query the highest matching monthly number within the creation transaction, increment its four-digit suffix, zero-pad; reject/flag exhaustion past `9999` rather than emit malformed IDs. Test first number, increment, month reset, and duplicate-key retry.
