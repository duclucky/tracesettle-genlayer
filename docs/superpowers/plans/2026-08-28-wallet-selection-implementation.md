# Wallet Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an EVM wallet-kit-style selection modal, explicit provider choice, and account disconnect flow to the TraceSettle frontend.

**Architecture:** Keep wallet detection in `frontend/src/adapters/wallet.ts`, keep visible session state in `frontend/src/components/WalletStatus.tsx`, and keep write controls using the selected EIP-1193 provider plus the existing GenLayer adapter. Preserve the existing light operations visual system and canonical read/write separation.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, genlayer-js, EIP-1193 wallet providers, EIP-6963 provider announcements.

## Global Constraints

- No simulated wallet, balance, fee, gas, signature, finality, or canonical state.
- Do not auto-select the first detected provider after the user clicks `Connect wallet`.
- User must explicitly choose from a centered wallet modal when one or more wallets are available.
- Disconnect must clear selected provider and account from visible UI state.
- Writes must call `wallet_switchEthereumChain` or `wallet_addEthereumChain` before submitting a transaction.
- IC reads remain on `VITE_GENLAYER_RPC_URL` or `/genlayer-rpc`; wallet writes remain on `VITE_EVM_RPC_URL`.
- Run targeted tests after every task, then run `npm run check` before claiming completion.

---

### Task 1: Multi-wallet discovery API

**Files:**
- Modify: `frontend/src/adapters/wallet.ts`
- Modify: `frontend/src/adapters/wallet.test.ts`

**Interfaces:**
- Produces: `WalletCandidate` with `{ id: string; label: string; provider: Eip1193Provider }`
- Produces: `discoverInjectedWallets(source: WalletEnvironment, announcementWaitMs?: number): Promise<WalletCandidate[]>`
- Preserves: `discoverInjectedWallet(...)` returning the first candidate or missing status for read-only fallback callers.

- [ ] **Step 1: Write failing tests**

Add tests proving that EIP-6963 plus fallback providers produce multiple candidates and duplicate provider objects are removed.

```ts
it("discovers multiple selectable EVM wallet candidates", async () => {
  const okx = { request: vi.fn() };
  const rabby = { request: vi.fn() };
  const target = new EventTarget() as WalletEnvironment;
  target.rabby = rabby;
  target.addEventListener?.("eip6963:requestProvider", () => {
    target.dispatchEvent?.(
      new CustomEvent("eip6963:announceProvider", {
        detail: { info: { name: "OKX Wallet" }, provider: okx }
      })
    );
  });

  await expect(discoverInjectedWallets(target, 0)).resolves.toEqual([
    expect.objectContaining({ label: "OKX Wallet", provider: okx }),
    expect.objectContaining({ label: "Rabby", provider: rabby })
  ]);
});

it("deduplicates wallet candidates by provider object", async () => {
  const provider = { request: vi.fn() };

  await expect(
    discoverInjectedWallets({
      ethereum: { providers: [provider, provider] },
      okxwallet: { ethereum: provider }
    }, 0)
  ).resolves.toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend run test -- wallet.test.ts`

Expected: FAIL because `discoverInjectedWallets` is not exported.

- [ ] **Step 3: Implement candidate discovery**

Add `WalletCandidate`, provider dedupe, EIP-6963 collection, and fallback collection. Keep existing functions compatible by mapping the first candidate to the older `WalletDetection` shape.

- [ ] **Step 4: Run wallet tests**

Run: `npm --prefix frontend run test -- wallet.test.ts`

Expected: PASS.

---

### Task 2: Wallet modal and disconnect UI

**Files:**
- Modify: `frontend/src/components/WalletStatus.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: `discoverInjectedWallets(...)`
- Uses: `connectInjectedWallet(provider)`
- Produces visible controls:
  - `button` named `Connect wallet`
  - `dialog` named `Connect wallet`
  - wallet option buttons named by wallet label
  - connected address button named by shortened address
  - `button` named `Disconnect wallet`

- [ ] **Step 1: Write failing tests**

Add tests proving modal choice and logout.

```tsx
it("opens wallet selection and connects only the chosen provider", async () => {
  const okxRequest = vi.fn(async ({ method }: { method: string }) =>
    method === "eth_requestAccounts" ? ["0x1111111111111111111111111111111111111111"] : []
  );
  const rabbyRequest = vi.fn(async ({ method }: { method: string }) =>
    method === "eth_requestAccounts" ? ["0x2222222222222222222222222222222222222222"] : []
  );
  const target = new EventTarget() as WalletEnvironment;
  target.rabby = { request: rabbyRequest };
  target.addEventListener?.("eip6963:requestProvider", () => {
    target.dispatchEvent?.(
      new CustomEvent("eip6963:announceProvider", {
        detail: { info: { name: "OKX Wallet" }, provider: { request: okxRequest } }
      })
    );
  });
  vi.stubGlobal("addEventListener", target.addEventListener.bind(target));
  vi.stubGlobal("removeEventListener", target.removeEventListener.bind(target));
  vi.stubGlobal("dispatchEvent", target.dispatchEvent.bind(target));
  vi.stubGlobal("rabby", target.rabby);

  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/"]}><AppRoutes /></MemoryRouter>);
  await user.click(screen.getByRole("button", { name: "Connect wallet" }));
  expect(await screen.findByRole("dialog", { name: "Connect wallet" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Rabby" }));
  expect(rabbyRequest).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  expect(okxRequest).not.toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  expect(await screen.findByRole("button", { name: "0x2222...2222" })).toBeInTheDocument();
});

it("disconnects the visible wallet from the account menu", async () => {
  const request = vi.fn(async ({ method }: { method: string }) =>
    method === "eth_accounts" ? ["0xC495ef51618D03267A1f227aFe5b27B38c748272"] : []
  );
  vi.stubGlobal("ethereum", { request });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/"]}><AppRoutes /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "0xC495...8272" }));
  await user.click(screen.getByRole("button", { name: "Disconnect wallet" }));
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend run test -- App.test.tsx`

Expected: FAIL because no wallet modal or disconnect menu exists.

- [ ] **Step 3: Implement UI**

Use `useState` for candidates, modal open state, selected address, status message, and account menu state. Render a centered `role="dialog"` modal and a small account menu under the address button. Do not persist the selected wallet to local storage.

- [ ] **Step 4: Add CSS**

Add `.modal-backdrop`, `.wallet-modal`, `.wallet-options`, `.wallet-option`, and `.account-menu` styles using the existing color, radius, border, and focus conventions.

- [ ] **Step 5: Run app tests**

Run: `npm --prefix frontend run test -- App.test.tsx`

Expected: PASS.

---

### Task 3: Preserve wallet write network safety

**Files:**
- Modify: `frontend/src/components/LiveTraceSettleAction.tsx`
- Modify: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: multi-wallet candidate picker when write controls need a wallet.
- Preserves: `ensureGenLayerEvmNetwork(provider, runtime.evmRpcUrl)` before every write.

- [ ] **Step 1: Write or update failing test**

Add a test showing a write action still calls `wallet_switchEthereumChain` before `eth_sendTransaction` through the selected provider. Use the existing create workflow flow and stub provider methods.

- [ ] **Step 2: Run test to verify failure or current behavior**

Run: `npm --prefix frontend run test -- App.test.tsx`

Expected: PASS only if the write path already uses the selected provider and switches network; otherwise FAIL until implementation is adjusted.

- [ ] **Step 3: Implement minimal write path adjustment if needed**

If `LiveTraceSettleAction` still auto-selects a single provider, change it to use the same candidate discovery and explicit selection flow, or to consume the selected provider from the shared wallet state if introduced during Task 2. Keep the existing finality and canonical reload handling.

- [ ] **Step 4: Run targeted frontend tests**

Run: `npm --prefix frontend run test -- App.test.tsx wallet.test.ts genlayerAdapter.test.ts`

Expected: PASS.

---

### Task 4: Full verification checkpoint

**Files:**
- No source edits unless a check exposes a blocker.

**Interfaces:**
- Verifies all prior tasks.

- [ ] **Step 1: Run full project check**

Run: `npm run check`

Expected:

```text
genvm-lint check passes
direct-mode tests pass
frontend TypeScript passes
production frontend build completes
```

- [ ] **Step 2: Review diff**

Run: `git status --short`

Expected: only intended contract, tests, frontend, docs plan/spec changes.

Run: `git diff --stat`

Expected: no secrets, generated build artifacts, ignored `.env`, or unrelated files.

---

## Self-review

- Spec coverage: wallet detection, modal selection, logout, network switch, honest errors, and tests are covered by Tasks 1 through 4.
- Placeholder scan: no deferred implementation markers are allowed in task steps.
- Type consistency: `WalletCandidate`, `discoverInjectedWallets`, `Eip1193Provider`, `WalletEnvironment`, and existing adapter helpers are the shared interface names.
