# Terranova Video Glass Redesign

## Goal

Rework the TraceSettle frontend visual system to follow the attached Terranova video and liquid-glass reference while preserving every existing product route, wallet flow, transaction action, and canonical contract read path.

## Scope

- Keep the app as the existing React and Vite frontend.
- Do not replace the app with the vanilla five-file reference implementation.
- Do not change, deploy, or redeploy any GenLayer contract.
- Keep the active contract address outside this visual change: `0xC125348c60768552Aa51D9E8d00a59e326958a17`.
- Do not deploy Vercel unless separately authorized after verification.

## Visual Direction

The first screen should use the reference's full-bleed bright video, fine black navigation, diagonal hero composition, chamfered calls to action, vertical rules on tablet and desktop, and a live liquid-glass signal card. Product copy remains TraceSettle-specific: the app settles failed agent workflows from bounded evidence and canonical contract state.

Internal workflow screens should inherit the same visual language without becoming marketing pages. They remain operational screens with scrollable content, clear forms, visible status, wallet controls, and transaction feedback.

## Functional Invariants

- The wallet selector still detects browser EVM wallets and lets the user choose.
- The connected account remains clickable and exposes disconnect.
- All existing routes remain reachable: `/`, `/workflows`, `/workflows/new`, workflow room, evidence submission, `/credits`, `/settings`, and `/help`.
- Live action buttons remain controlled by configured contract address and wallet connection.
- Browser-visible RPC behavior is not altered by the visual layer.
- No local storage is introduced as canonical contract state.

## Implementation Model

- Add a fixed background video inside the React app shell using the exact Terranova video URL from the reference.
- Add the liquid-glass SVG filter once in the app shell.
- Add a React glass card component that draws the background video into a canvas every animation frame and aligns the duplicate to the viewport.
- Style the landing route with the reference's menu, vertical rules, bottom hero row, chamfered buttons, and glass card.
- Restyle internal pages with restrained liquid-glass surfaces while keeping app density and scroll behavior.
- Respect reduced motion by disabling non-essential transitions and the card entrance animation.

## Verification

- Add frontend tests for the background video, SVG filter, glass card, route preservation, and drawer behavior.
- Run focused frontend tests before implementation and after implementation.
- Run `npm run check` from the project root.
- Run browser QA at small mobile, tablet, and desktop widths, checking no horizontal overflow, clean console, visible video, menu open and close, and wallet control visibility.

## Self Review

- No placeholders remain.
- The spec preserves the app and only changes presentation.
- The visual reference is adapted where it conflicts with TraceSettle product requirements.
- Deployment and contract changes are explicitly out of scope.
