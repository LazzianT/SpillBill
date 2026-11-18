# Demo Login Passwords Design

**Intent:** Use known demo passwords in the SQL seed for dashboard testing.

**Goals:** Set `admin.sales` to `sales123` and `admin.accounting` to `finance123` by changing their password hashes only.

**Non-goals:** No login implementation, username, role, or seed re-run behavior changes.

**Approaches:** (1) Change hashes only, preserving `INSERT IGNORE` semantics; selected because user explicitly asked to change passwords only. (2) Add update-on-rerun behavior; rejected because it changes more than the requested hashes.

**Constraints:** Store bcrypt hashes, never plaintext. Verify hashes against each password.
