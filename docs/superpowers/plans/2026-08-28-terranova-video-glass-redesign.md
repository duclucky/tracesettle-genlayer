# Terranova Video Glass Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Terranova full-bleed video and liquid-glass visual reference to the existing TraceSettle React frontend without changing contract behavior.

**Architecture:** The app shell owns the fixed video backdrop, filter definitions, menu chrome, and wallet status. The landing route owns the hero composition and a focused glass signal card component that draws the shell video into a canvas. Existing workflow routes keep their data and actions while inheriting the updated visual tokens.

**Tech Stack:** React 19.2, Vite, TypeScript, Vitest, Testing Library, Phosphor icons, CSS.

## Global Constraints

- Do not change, deploy, or redeploy any GenLayer contract.
- Do not replace the React app with the vanilla five-file reference.
- Keep existing wallet detection, wallet selection, account menu, disconnect, live transaction, and canonical read behavior.
- Use the exact video URL from the reference.
- Do not add Three.js, WebGPU, WebGL, TSL, lil-gui, OrbitControls, or new visual framework dependencies.
- Run `npm run check` after frontend changes.
- Browser QA must check 375px, 768px, and desktop widths for no horizontal overflow and clean console.

---

### Task 1: Add Visual Contract Tests

**Files:**
- Modify: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: existing `AppRoutes`.
- Produces: tests that require background video, liquid-glass filter, glass card, and preserved TraceSettle CTAs.

- [ ] **Step 1: Write failing tests**

Add assertions that the root route renders a background video with the Terranova URL, includes `liquid-glass-refraction`, renders the glass card, and keeps `/workflows/new` and `/workflows` links.

- [ ] **Step 2: Run focused test to verify failure**

Run: `npm --prefix frontend test -- App.test.tsx`

Expected before implementation: failure because the new video and filter are missing.

- [ ] **Step 3: Stop and implement Task 2 after the failing reason is confirmed**

No production code in this task.

### Task 2: Add Shell Video And Glass Card Component

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/GlassSignalCard.tsx`
- Modify: `frontend/src/pages/EntryPage.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Produces: `GlassSignalCard` React component with no props.
- Produces: shell-level `video#app-bg-video` and SVG `filter#liquid-glass-refraction`.

- [ ] **Step 1: Implement the shell background**

Place the fixed video and off-screen SVG filter before the header in `AppShell`.

- [ ] **Step 2: Implement `GlassSignalCard`**

Use `requestAnimationFrame`, `getBoundingClientRect`, `document.documentElement.clientWidth`, `document.documentElement.clientHeight`, `video.videoWidth`, `video.videoHeight`, and `ctx.drawImage` with `object-fit: cover` math. Bail safely when video or canvas are unavailable.

- [ ] **Step 3: Recompose landing hero**

Use the glass card, vertical rules, bottom diagonal layout, and chamfered CTAs while preserving route destinations.

- [ ] **Step 4: Run focused test**

Run: `npm --prefix frontend test -- App.test.tsx`

Expected after implementation: App tests pass.

### Task 3: Polish Responsive App Surfaces

**Files:**
- Modify: `frontend/src/styles.css`
- Modify only if tests require it: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: existing classes from all internal pages.
- Produces: no horizontal overflow, visible focus, reduced-motion support, internal page readability.

- [ ] **Step 1: Update CSS tokens and layouts**

Apply the video-glass theme to landing and internal pages, keep text contrast, keep workflow pages scrollable, and keep wallet status visible.

- [ ] **Step 2: Run full local verification**

Run: `npm run check`

Expected: contract lint, direct tests, deployment/config tests, frontend tests, TypeScript, and production build pass.

### Task 4: Browser QA

**Files:**
- No required source edits unless QA exposes a defect.

**Interfaces:**
- Consumes: local Vite app.
- Produces: browser proof of visual and interaction behavior.

- [ ] **Step 1: Start or reuse local dev server**

Run: `npm --prefix frontend run dev -- --port 5173`.

- [ ] **Step 2: Verify in browser**

Check `/`, `/workflows`, `/credits`, and `/settings` at 375px, 768px, and desktop width. Verify no horizontal overflow, clean console, menu open/close, visible video, glass card present, wallet control visible.

- [ ] **Step 3: Final review**

Run `git status --short`, review changed files, and confirm no contract, deployment, secret, or unrelated file was modified.

## Self Review

- Every spec requirement maps to a task.
- No placeholder tasks remain.
- The plan uses existing React project structure.
- The plan does not authorize deployment or contract mutation.
