# Login Layout Polish

## Intent
Polish grid, alignment, spacing, and responsive behavior on the existing login screen without changing the navy/lime palette, copy, authentication demo flow, RBAC mapping, or form behavior.

## Goals
- Make the split layout feel balanced at desktop widths.
- Align brand, value proposition, ledger, and footer consistently in the showcase panel.
- Give the form panel a clearer vertical rhythm and stable readable width.
- Preserve compact tablet/mobile layouts without overflow or clipped controls.
- Keep keyboard focus, labels, role selection, validation, and password toggle behavior unchanged.

## Non-goals
- No color-token changes.
- No new components, dependencies, routes, or authentication logic.
- No copy or data changes.

## Approach
Keep the current two-column layout. Adjust only existing CSS grid tracks, panel padding, max widths, gaps, and responsive breakpoints. Use existing design tokens and existing class names. Treat the current mobile stacked layout as the fallback, with spacing refinements only.

## Verification
Run `npm run build`, `npm run check`, then verify the login screen at desktop and mobile widths, including role switching, validation, password toggle, and successful login.
