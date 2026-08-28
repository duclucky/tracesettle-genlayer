# TraceSettle Topbar Wallet Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the TraceSettle landing UI more professional, expose primary navigation in the topbar, replace the logo, and fix sticky wallet disconnect.

**Architecture:** Keep the app in the existing React component structure. Modify AppShell for brand and navigation, WalletStatus for explicit disconnect state, and styles.css for layout, typography, and responsive behavior. Tests remain in the existing Vitest and Testing Library suite.

**Tech Stack:** React, Vite, TypeScript, React Router, Vitest, Testing Library, CSS.

## Global Constraints

- Do not change, deploy, or redeploy the GenLayer contract.
- Active contract address remains `0xC125348c60768552Aa51D9E8d00a59e326958a17`.
- Preserve all existing routes and wallet transaction behavior.
- Follow TDD: write failing frontend tests before production edits.
- Do not stage unrelated dirty contract or direct test files.

---

### Task 1: Topbar Navigation and Logo

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: existing `navItems` route list in `AppShell.tsx`.
- Produces: desktop-visible `<nav aria-label="Primary">` links and a brand link with label `TraceSettle home`.

- [ ] **Step 1: Write the failing tests**

Add tests asserting that the topbar exposes Home, Workflows, Credits, Settings, and Help without opening a menu, and that the brand contains the new visual mark.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "exposes primary navigation|renders the refreshed TraceSettle logo"`

Expected: FAIL before implementation because desktop nav and the new mark are not present.

- [ ] **Step 3: Implement minimal AppShell changes**

Render the primary nav directly in the topbar for wide screens, replace the old icon-only scale mark with a custom inline SVG mark, and keep the drawer trigger as a mobile fallback.

- [ ] **Step 4: Implement minimal CSS changes**

Style topbar, brand, nav links, active state, and responsive fallback so the links are visible on desktop and the menu remains available on narrow screens.

- [ ] **Step 5: Run focused tests**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "exposes primary navigation|renders the refreshed TraceSettle logo"`

Expected: PASS.

### Task 2: Landing Typography and Layout Polish

**Files:**
- Modify: `frontend/src/pages/EntryPage.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: existing hero heading, lede, CTAs, and `GlassSignalCard`.
- Produces: the same links and copy with a cleaner product-first layout.

- [ ] **Step 1: Write or update the focused visual behavior test**

Assert that the hero still renders its canonical heading, CTAs, and signal card after the layout class changes.

- [ ] **Step 2: Run focused test**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "renders the Terranova hero composition"`

Expected: PASS before and after because functionality is preserved.

- [ ] **Step 3: Implement CSS-only visual polish**

Adjust font stack, H1 scale, line height, hero grid balance, video scrim, CTA density, and card sizing. Keep no horizontal overflow and preserve reduced-motion behavior.

- [ ] **Step 4: Run focused test again**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "renders the Terranova hero composition"`

Expected: PASS.

### Task 3: Sticky Disconnect

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/components/WalletStatus.tsx`

**Interfaces:**
- Consumes: `readAuthorizedWallet`, `setWalletSession`, and `clearWalletSession`.
- Produces: explicit disconnect suppression in the current component session until the user reconnects.

- [ ] **Step 1: Write the failing regression test**

Add a test where `eth_accounts` keeps returning an authorized account after disconnect, trigger a provider discovery event, and assert the UI stays disconnected.

- [ ] **Step 2: Run focused test to verify failure**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "does not auto-restore after explicit disconnect"`

Expected: FAIL before implementation because auto-restore can reselect the provider.

- [ ] **Step 3: Implement minimal fix**

Add a local `disconnectSuppressed` state in `WalletStatus`. Set it when disconnect is clicked. Skip automatic `eth_accounts` restore while it is true. Clear it only when the user starts a new connect flow.

- [ ] **Step 4: Run focused test**

Run: `cd frontend && npm test -- --run src/App.test.tsx -t "does not auto-restore after explicit disconnect"`

Expected: PASS.

### Task 4: Full Verification

**Files:**
- Review only changed frontend/spec/plan files.

**Interfaces:**
- Produces: command evidence for the final status.

- [ ] **Step 1: Run full frontend suite and build**

Run: `cd frontend && npm test && npm run build`

Expected: all frontend tests pass and production build exits 0.

- [ ] **Step 2: Run project check**

Run: `npm run check`

Expected: contract lint, direct tests, deployment parser tests, frontend tests, and frontend build exit 0.

- [ ] **Step 3: Review git diff**

Run: `git status --short` and `git diff -- frontend/src/App.test.tsx frontend/src/components/AppShell.tsx frontend/src/components/WalletStatus.tsx frontend/src/pages/EntryPage.tsx frontend/src/styles.css docs/superpowers/specs/2026-08-28-topbar-wallet-polish-design.md docs/superpowers/plans/2026-08-28-topbar-wallet-polish.md`

Expected: only intended frontend and documentation changes are present in the reviewed diff.
