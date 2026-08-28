# TraceSettle Terranova Visual System

**Date:** 2026-08-28  
**Status:** Approved design, implementation pending  
**Scope:** Product-wide frontend visual redesign with no contract or wallet behavior changes

## Intent

Apply the Terranova visual language to the complete TraceSettle Projects-track dApp while preserving every existing product capability: EVM wallet discovery and selection, account disconnect, GenLayer IC reads through the same-origin proxy, real wallet writes, transaction lifecycle states, canonical state reloads, and the active Studionet contract at `0xC125348c60768552Aa51D9E8d00a59e326958a17`.

The result should feel like an editorial Swiss instrument: light, spacious, geometric, high-contrast, and quietly iridescent. Home receives the strongest Terranova treatment. Internal screens use the same tokens and glass surfaces, but remain readable and scrollable for forms and long workflow states.

## Visual system

- Canvas: warm off-white `#F4F1EA` with restrained iridescent silver/green atmosphere.
- Ink: near-black `#0E1110` for primary text and controls.
- Semantic accents: moss for finalized/success, amber for pending/retryable, coral for failed/destructive, and blue-green for interactive focus/links.
- Typography: lightweight editorial sans for display headings, readable sans for body copy, and a monospace face only for wallet addresses, hashes, contract IDs, and GEN amounts.
- Shape language: hairline borders, large but consistent radii, chamfered primary CTA detail, minimal shadow, and translucent white glass surfaces.
- Icon language: existing Phosphor outline icons, consistent stroke weight, no emoji or raster UI icons.
- Tokens are defined in `frontend/src/styles.css`; components consume semantic variables rather than screen-specific raw colors.

## App shell and navigation

`AppShell` remains the route and wallet context boundary. Its topbar becomes a lightweight editorial bar with:

1. TraceSettle brand mark and home link.
2. A Menu control that opens a right-side glass drawer containing the five existing destinations.
3. The existing wallet status pill on the right.

The drawer is available at every route, uses `role="dialog"` semantics when open, provides a visible close control and Escape dismissal, preserves the active route indicator, and keeps logout inside the existing account menu. The drawer and wallet modal must retain keyboard focus visibility and never cover the focused control without a dismissal path.

Internal routes remain normal document flows and may scroll. Only the Home composition is full-viewport. The responsive breakpoint remains mobile-first, with the two-column layouts collapsing at approximately 768px and touch targets at least 44px.

## Page compositions

### Home

Use a hero split on a diagonal visual axis. The left side contains the existing sponsor/provider message and primary CTAs. The right side contains a glass “Latest workflow signal” card showing canonical status, pool amount, and a restrained waveform. The iridescent atmosphere is decorative; all product claims remain sourced from existing UI state and no simulated values are introduced.

### Workflow inbox

Keep the canonical read notice prominent. Render filters as accessible pressed chips and each workflow as an editorial glass row/card containing status, role, pool, objective, and Open action. Loading, empty, and RPC error states occupy a stable panel with an explicit retry path. Preview rows remain labeled when live configuration is unavailable.

### Workflow room

Keep the existing two-column desktop structure. The left column becomes a dependency/timeline rail for steps. The right column becomes the floating “Next legal action” panel. Transaction state remains visually separate from workflow state. Mobile order is timeline first, actions second.

### Evidence submission

Use one large form panel for URL, digest, provenance context, and submit controls. Dependencies and the step promise appear in a read-only evidence rail beneath or beside the form. Field labels, helper text, inline errors, and transaction feedback remain visible without relying on color.

### Credits

Make the canonical GEN balance the visual anchor. Credit lines become ledger rows with clear workflow IDs and statuses. “Submit withdrawal” is the only primary action; “Read canonical credits” is secondary. No simulated balance, gas, fee, or finality is added.

### Settings and Help

Use compact glass panels with the same spacing and type tokens. Contract address and RPC endpoints are read-only mono content. Verification guidance remains plain-language and keeps the existing honest-limit copy.

## Interaction and motion

- Primary buttons use a subtle chamfer/outline treatment; secondary buttons use hairline borders.
- Hover and pressed states change opacity, border, or elevation without shifting layout bounds.
- Async controls are disabled while busy and show the existing lifecycle text.
- Wallet selection remains a centered modal listing detected EVM wallets. Account address remains clickable and Disconnect clears the UI session and disables writes until reconnection.
- Loading uses stable skeleton/notice space. RPC failures display a cause and retry affordance; they never silently fall back to preview data in live mode.
- Motion is limited to the menu slide, one card entrance, and status transitions. Use transform/opacity only, keep transitions interruptible, and honor `prefers-reduced-motion` by disabling decorative movement and showing the final state.

## Data and behavior boundaries

No adapter, ABI, contract method, RPC URL, wallet provider, contract address, GEN denomination, or transaction-finality rule changes as part of the visual redesign. Existing components continue to call the same adapter methods and reload canonical state after finalized writes. CSS and markup changes must not create a second source of truth or expose raw storage/validator internals in the primary surface.

## Verification plan

1. Add or update frontend tests for drawer open/close, active navigation, wallet modal visibility, disconnect/write gating, responsive-safe labels, and preserved transaction feedback.
2. Run `npm run check` and confirm contract lint, 20 direct tests, deployment/config tests, all frontend tests, TypeScript, and production build pass.
3. Run the local app in Chrome at the existing configured environment and verify every route has no browser `Failed to fetch`, unknown RPC, or console errors.
4. Check 375px mobile, 768px tablet, 1024px desktop, and a wide desktop viewport. Confirm no horizontal overflow and visible focus rings.
5. Check `prefers-reduced-motion` and verify the menu/modal remain keyboard operable.
6. Review the final diff for accidental contract, deployment, secret, or generated-file changes.

## Explicit non-goals

- No new contract deployment.
- No change to the active deployed contract or its evidence.
- No new UI framework or dependency.
- No simulated wallet transactions, balances, gas, fees, or finality.
- No forced full-screen/no-scroll constraint on internal dApp routes.
- No claim that a fresh remediated-contract browser write has been completed until a user-signed run exists.
