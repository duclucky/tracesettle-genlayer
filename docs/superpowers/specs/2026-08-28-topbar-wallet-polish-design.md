# TraceSettle Topbar Wallet Polish Design

## Goal

Improve the deployed TraceSettle frontend quality by replacing the weak logo, exposing primary navigation outside the desktop menu, tightening landing typography and layout, and making wallet disconnect stay disconnected until the user explicitly reconnects.

## Scope

- Keep the existing React and Vite frontend.
- Keep every current route, contract read path, wallet write path, and transaction state surface.
- Do not change, deploy, or redeploy the GenLayer contract.
- Keep the active contract address unchanged: `0xC125348c60768552Aa51D9E8d00a59e326958a17`.
- Do not introduce local storage as canonical contract state.

## Visual Direction

Use the verified UI skill result: Enterprise Gateway structure with Minimalism and Swiss Style. The page should feel like a high-trust workflow settlement product, not a generic glass demo. The video remains present, but typography, spacing, surface opacity, and card sizing must keep the product message readable.

The new logo is a small inline SVG mark, not an external image. It should combine a settlement ledger motif with the TraceSettle initials and use the product green and ink palette. It must remain crisp at small sizes and include visible text beside the mark.

## Navigation

On desktop and tablet widths, the top-level routes are visible in the topbar: Home, Workflows, Credits, Settings, and Help. The menu drawer is retained only as a narrow-screen fallback. This follows the UI skill navigation guidance that primary navigation should not be hidden in a drawer on wide screens.

## Wallet Disconnect

Disconnect clears the selected wallet session and suppresses automatic restore for the current page session. If the provider still returns accounts through `eth_accounts`, the app must not reconnect immediately after the user's explicit disconnect. The user can reconnect by pressing Connect wallet and choosing a provider again.

## Testing

- Add a route test proving topbar navigation links are visible without opening a menu.
- Add a logo test proving the new mark is rendered with an accessible brand link.
- Add a regression test proving disconnect is sticky when the provider still returns an authorized account.
- Keep existing tests for wallet detection, chosen-provider connection, restored authorized wallet, and route coverage.

## Self Review

- No placeholders remain.
- The scope is frontend-only.
- Contract deployment is explicitly excluded.
- The design addresses all three user-reported issues.
