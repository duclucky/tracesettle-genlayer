# TraceSettle Terranova Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Terranova editorial glass visual system across the TraceSettle React dApp while preserving all wallet, RPC, contract, route, and transaction behavior.

**Architecture:** Keep `AppShell` as the route and wallet context boundary. Add a reusable navigation drawer and semantic visual tokens in the existing CSS, then update page markup only where a visual composition needs a new wrapper or decorative layer. Existing adapters and domain types remain the sole data and transaction boundaries.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Phosphor icons, Vitest, existing `genlayer-js` adapter, CSS media queries.

## Global Constraints

- Keep the active Studionet contract `0xC125348c60768552Aa51D9E8d00a59e326958a17`; do not deploy or alter contract source as part of this visual work.
- Keep EVM wallet discovery, centered wallet-selection modal, account disconnect, network switching, RPC proxy, canonical reads, write methods, and finality handling unchanged.
- Use the approved Terranova direction: warm off-white canvas, near-black ink, restrained iridescent atmosphere, hairline borders, glass panels, chamfered primary CTA, and editorial sans plus mono data text.
- Internal routes may scroll; only Home is a full-viewport hero composition.
- Preserve honest live/preview/error copy and never add simulated balances, gas, fees, transactions, or finality.
- Do not add a UI framework, icon package, video dependency, or other frontend dependency.
- Preserve keyboard focus visibility, semantic labels, touch targets of at least 44px, reduced-motion behavior, and no horizontal overflow at 375px, 768px, 1024px, and wide desktop widths.
- Every behavior change gets a focused frontend test before implementation, followed by `npm run check`.

---

### Task 1: Add Terranova design tokens and base surface system

**Files:**
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: existing classes `.app-shell`, `.topbar`, `.page`, `.panel`, `.button`, `.notice`, `.badge`, and `.mono`.
- Produces: semantic CSS variables and reusable visual classes for later tasks.

- [ ] **Step 1: Write the failing smoke test**

Add this assertion to the existing route render test:

```tsx
expect(screen.getByRole("main")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Settle the failed workflow" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test**

```powershell
cd frontend
npm test -- --run src/App.test.tsx -t "route map"
```

Expected: the current route test passes before the token change.

- [ ] **Step 3: Add the semantic token layer**

At the top of `frontend/src/styles.css`, define:

```css
:root {
  color-scheme: light;
  --canvas: #f4f1ea;
  --canvas-deep: #e8e5dc;
  --surface: rgb(255 255 255 / 0.72);
  --surface-strong: rgb(255 255 255 / 0.9);
  --ink: #0e1110;
  --muted: #56605b;
  --line: rgb(14 17 16 / 0.16);
  --line-strong: rgb(14 17 16 / 0.3);
  --moss: #315f4b;
  --moss-soft: #dcebe2;
  --amber: #8b5e13;
  --amber-soft: #f5e8c5;
  --coral: #a63e3e;
  --coral-soft: #f4d9d7;
  --focus: #176b73;
  --shadow-soft: 0 18px 60px rgb(14 17 16 / 0.08);
  --radius-card: 28px;
  --radius-control: 12px;
  --motion-fast: 180ms;
  --motion-standard: 260ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  font-family: Inter, "Helvetica Neue", Arial, sans-serif;
  background: var(--canvas);
  color: var(--ink);
}
```

Update global background, typography, focus ring, panels, notices, buttons, badges, and form controls to use these variables. Keep `.mono` for addresses, hashes, contract IDs, and GEN amounts.

- [ ] **Step 4: Run the focused test**

```powershell
npm test -- --run src/App.test.tsx -t "route map"
```

Expected: PASS with unchanged route content and no TypeScript errors.

- [ ] **Step 5: Commit the token system**

```powershell
git add frontend/src/styles.css frontend/src/App.test.tsx
git commit -m "style: add Terranova visual tokens"
```

### Task 2: Replace the top navigation with the Terranova menu drawer

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: existing `navItems`, `WalletSessionProvider`, and `WalletStatus`.
- Produces: a `Menu` button, a dismissible `app-menu` drawer, and unchanged route links.

- [ ] **Step 1: Write failing interaction tests**

```tsx
it("opens the Terranova navigation drawer and preserves route links", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Menu" }));
  expect(screen.getByRole("dialog", { name: "Primary navigation" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Workflows" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close menu" }));
  expect(screen.queryByRole("dialog", { name: "Primary navigation" })).not.toBeInTheDocument();
});

it("closes the navigation drawer with Escape", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Menu" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "Primary navigation" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new tests and confirm they fail**

```powershell
npm test -- --run src/App.test.tsx -t "Terranova navigation drawer|Escape"
```

Expected: FAIL because the current shell has no Menu button or drawer.

- [ ] **Step 3: Implement drawer state and markup**

In `AppShell.tsx`, add state and Escape handling:

```tsx
const [menuOpen, setMenuOpen] = useState(false);

useEffect(() => {
  if (!menuOpen) return;
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") setMenuOpen(false);
  };
  window.addEventListener("keydown", closeOnEscape);
  return () => window.removeEventListener("keydown", closeOnEscape);
}, [menuOpen]);
```

Render a button named `Menu`, a conditional backdrop, and an aside with `role="dialog"`, `aria-label="Primary navigation"`, a `Close menu` button, and the existing five `NavLink`s. Close the drawer after a link click. Keep `WalletStatus` outside the drawer.

- [ ] **Step 4: Add drawer styling and reduced-motion fallback**

Add `.menu-trigger`, `.menu-backdrop`, `.app-menu`, `.app-menu.open`, `.app-menu__link`, and `.menu-close` styles. Use only transform and opacity for the slide, and set transition duration to `0ms` in the reduced-motion media query. Keep focus-visible outlines at least 3px.

- [ ] **Step 5: Run the interaction tests**

```powershell
npm test -- --run src/App.test.tsx -t "Terranova navigation drawer|Escape"
```

Expected: both tests PASS.

- [ ] **Step 6: Commit the navigation shell**

```powershell
git add frontend/src/components/AppShell.tsx frontend/src/styles.css frontend/src/App.test.tsx
git commit -m "feat: add Terranova navigation drawer"
```

### Task 3: Recompose Home as the Terranova hero

**Files:**
- Modify: `frontend/src/pages/EntryPage.tsx`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: existing sponsor/provider links and copy.
- Produces: `.hero-page`, `.hero-copy`, `.hero-signal-card`, and a decorative SVG waveform with no new data source.

- [ ] **Step 1: Write the failing Home composition test**

```tsx
it("renders the Terranova hero composition without changing product CTAs", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Settle the failed workflow" })).toBeInTheDocument();
  expect(screen.getByText("Canonical workflow signal")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Create workflow/ })).toHaveAttribute("href", "/workflows/new");
  expect(screen.getByRole("link", { name: /Open inbox/ })).toHaveAttribute("href", "/workflows");
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```powershell
npm test -- --run src/App.test.tsx -t "Terranova hero composition"
```

Expected: FAIL because the current Home has no signal card.

- [ ] **Step 3: Implement the Home markup**

Keep the existing copy and links, then add this non-claiming signal card:

```tsx
<aside className="hero-signal-card" aria-label="Canonical workflow signal">
  <div className="signal-card__head">
    <span>Canonical workflow signal</span>
    <span className="mono">//01</span>
  </div>
  <p>Evidence first. Settlement final.</p>
  <p className="muted">Open the inbox to read the deployed contract state.</p>
  <svg className="signal-wave" viewBox="0 0 220 50" aria-hidden="true">...</svg>
</aside>
```

Do not display a fabricated status, balance, transaction identifier, or simulated finality.

- [ ] **Step 4: Add hero layout styles**

Use a diagonal two-column composition from 768px upward, stack copy before the card on mobile, and apply a restrained radial iridescent background only as decoration. Keep text contrast on the canvas.

- [ ] **Step 5: Run Home tests and build**

```powershell
npm test -- --run src/App.test.tsx -t "Terranova hero composition"
npm run build --prefix frontend
```

Expected: test PASS and Vite production build PASS.

- [ ] **Step 6: Commit the Home composition**

```powershell
git add frontend/src/pages/EntryPage.tsx frontend/src/styles.css frontend/src/App.test.tsx
git commit -m "style: recompose home as Terranova hero"

### Task 4: Apply the shared editorial layout to internal pages

**Files:**
- Modify: `frontend/src/pages/WorkflowInboxPage.tsx`
- Modify: `frontend/src/pages/WorkflowRoomPage.tsx`
- Modify: `frontend/src/pages/EvidenceSubmissionPage.tsx`
- Modify: `frontend/src/pages/NewWorkflowPage.tsx`
- Modify: `frontend/src/pages/CreditsPage.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/pages/HelpPage.tsx`
- Modify: `frontend/src/components/WorkflowList.tsx`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/App.test.tsx` and `frontend/src/FormFlows.test.tsx`

**Interfaces:**
- Consumes: existing page state, adapter calls, route paths, and action components.
- Produces: `.editorial-grid`, `.glass-panel`, `.timeline-rail`, `.ledger-row`, and `.read-only-panel` classes without changing props or adapter signatures.

- [ ] **Step 1: Add failing class and behavior assertions**

For each route, assert its existing heading plus one semantic visual hook. For example:

```tsx
expect(screen.getByRole("heading", { name: "Workflow inbox" })).toBeInTheDocument();
expect(screen.getByText("Contract read")).toBeInTheDocument();
expect(screen.getByRole("generic", { name: "Workflow filters" })).toBeInTheDocument();
```

For the form route, retain the existing submit button and validation assertion. The tests must prove visual wrappers do not remove live actions.

- [ ] **Step 2: Run route and form tests before markup changes**

```powershell
npm test -- --run src/App.test.tsx src/FormFlows.test.tsx
```

Expected: current tests PASS.

- [ ] **Step 3: Add presentational wrappers and class names**

Wrap existing panels with the named classes while preserving every child control, handler, label, route link, status string, adapter call, and `LiveTraceSettleAction` prop. Keep loading/error/preview notices in their current DOM order. Do not move canonical data into CSS or local storage.

- [ ] **Step 4: Style the shared internal layouts**

Add these concrete rules in `styles.css`:

```css
.editorial-grid { display: grid; gap: 24px; }
.glass-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-card); box-shadow: var(--shadow-soft); backdrop-filter: blur(18px); }
.timeline-rail { border-inline-start: 1px solid var(--line-strong); padding-inline-start: 20px; }
.ledger-row { display: grid; gap: 8px; border-block-end: 1px solid var(--line); padding: 16px 0; }
.read-only-panel { overflow-wrap: anywhere; }
@media (min-width: 768px) { .editorial-grid.two { grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); } }
```

Use status tones with text/icon pairing, preserve GEN labels, and keep one primary action per screen.

- [ ] **Step 5: Run all route and form tests**

```powershell
npm test -- --run src/App.test.tsx src/FormFlows.test.tsx
```

Expected: selected tests PASS with unchanged route behavior.

- [ ] **Step 6: Commit internal page styling**

```powershell
git add frontend/src/pages frontend/src/components/WorkflowList.tsx frontend/src/styles.css frontend/src/App.test.tsx frontend/src/FormFlows.test.tsx
git commit -m "style: apply Terranova editorial layouts"
```

### Task 5: Polish wallet, transaction, and status components without changing behavior

**Files:**
- Modify: `frontend/src/components/WalletStatus.tsx`
- Modify: `frontend/src/components/LiveTraceSettleAction.tsx`
- Modify: `frontend/src/components/TransactionState.tsx`
- Modify: `frontend/src/components/StatusBadge.tsx`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/App.test.tsx` and `frontend/src/FormFlows.test.tsx`

**Interfaces:**
- Consumes: current wallet session, modal, action stages, and status mapping.
- Produces: clearer visual states with the same text, callbacks, and adapter behavior.

- [ ] **Step 1: Add failing assertions for preserved wallet/action semantics**

Assert that the connected address remains a button, Disconnect exists inside the account menu, the wallet selector remains a dialog, and live write controls are disabled while disconnected or busy.

- [ ] **Step 2: Run focused tests and confirm baseline**

```powershell
npm test -- --run src/App.test.tsx src/FormFlows.test.tsx -t "wallet|transaction|write|disconnect|connect"
```

Expected: baseline PASS.

- [ ] **Step 3: Apply component classes and CSS states**

Add only styling hooks. Keep `aria-expanded`, `aria-modal`, `aria-live`, `disabled`, and all existing lifecycle messages. Style the wallet pill, account menu, centered modal, status badges, transaction rail, focus ring, hover, pressed, disabled, success, retryable, and failure states with semantic tokens.

- [ ] **Step 4: Add reduced-motion rules**

Use `@media (prefers-reduced-motion: reduce)` to remove drawer/card transforms and set transition durations to zero while retaining visible final states.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- --run src/App.test.tsx src/FormFlows.test.tsx -t "wallet|transaction|write|disconnect|connect"
```

Expected: PASS.

- [ ] **Step 6: Commit component polish**

```powershell
git add frontend/src/components frontend/src/styles.css frontend/src/App.test.tsx frontend/src/FormFlows.test.tsx
git commit -m "style: polish wallet and lifecycle states"
```

### Task 6: Responsive and accessibility verification

**Files:**
- Modify: `frontend/src/styles.css` only when verification finds a concrete issue.
- Test: Chrome-local browser verification and all frontend tests.

**Interfaces:**
- Consumes: completed visual shell and all routes.
- Produces: evidence that visual changes do not regress navigation, wallet gating, canonical reads, or accessibility.

- [ ] **Step 1: Run the full local check**

```powershell
$env:PYTHONUTF8='1'; npm run check
```

Expected: contract lint PASS, 20 direct tests PASS, 3 deployment/config tests PASS, all frontend tests PASS, TypeScript PASS, and production build PASS.

- [ ] **Step 2: Start the local frontend**

```powershell
npm run dev --prefix frontend
```

Expected: Vite serves `http://127.0.0.1:5173`.

- [ ] **Step 3: Verify Chrome routes and wallet UX**

Use the existing Chrome control session to check `/`, `/workflows`, `/workflows/new`, `/workflows/<canonical-id>`, `/workflows/<canonical-id>/evidence/<step-id>`, `/credits`, `/settings`, and `/help`. At each route verify:

```text
No browser Failed to fetch text
No Unknown RPC text
No console error entries
Main heading is visible
Menu opens and closes with click and Escape
Connected address opens account menu
Disconnect clears the UI wallet session and disables writes
```

Wait long enough for canonical reads to settle. Treat canonical contract responses as authoritative and do not replace a slow read with fixture rows.

- [ ] **Step 4: Check viewport and motion matrix**

At 375px, 768px, 1024px, and wide desktop widths verify no horizontal overflow, readable body text, 44px targets, visible focus rings, and the mobile single-column order. With reduced motion enabled, verify the menu and cards show final states without movement.

- [ ] **Step 5: Review the final diff**

```powershell
git diff --check
git status --short
git diff --stat
```

Confirm no contract, deployment evidence, secret, generated `dist`, or stale contract address files changed. Confirm `frontend/.env` still points to `0xC125348c60768552Aa51D9E8d00a59e326958a17` and remains ignored.

- [ ] **Step 6: Commit only verified visual changes**

```powershell
git add frontend/src frontend/src/styles.css
git commit -m "style: complete Terranova frontend refresh"
```

Do not push or deploy without explicit action-time authorization.
```
