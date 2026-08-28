# TraceSettle Wallet Selection Design

Date: 2026-08-28

## Scope

Upgrade the existing TraceSettle frontend wallet connection flow so it behaves like an EVM wallet kit while preserving the current product visual language. This spec covers browser wallet detection, wallet selection, logout, and network switching before writes. It does not redesign the app, change contract behavior, or add a new user role.

## Goals

- Detect EVM wallet extensions from the current browser instead of assuming a single injected provider.
- Let the user explicitly choose the wallet used for login and write transactions.
- Keep connected wallet state visible and reversible with a clear disconnect action.
- Keep GenLayer Intelligent Contract reads on the configured IC RPC path and wallet writes on the configured EVM wallet RPC path.
- Preserve honest UI states for missing wallets, rejected wallet prompts, wrong network, pending finality, failed transactions, and canonical state reloads.

## Non-goals

- No simulated wallet, balance, fee, gas, signature, or canonical state.
- No MetaMask-only flow.
- No auto-selection of the first detected provider when the user clicks connect.
- No persistence of a selected wallet as canonical contract state.

## Architecture

Wallet detection will return a list of selectable EVM wallet candidates. The detector will prefer EIP-6963 announcements, then include injected fallbacks such as `window.ethereum.providers`, `window.ethereum`, OKX, Rabby, Coinbase Wallet, Brave, MetaMask-compatible providers, and compatible nested `ethereum` providers. Duplicate provider objects will be removed.

`WalletStatus` will own the visible wallet session state for the topbar. It will open a centered selection modal when the user clicks `Connect wallet`. Selecting a wallet calls `eth_requestAccounts` only on that provider. The selected provider and account are then used by wallet-gated write controls through the existing adapter path.

Existing public reads may still call `eth_accounts` to derive role labels when a wallet is already authorized, but this must not open a wallet prompt. Writes continue to call `wallet_switchEthereumChain` or `wallet_addEthereumChain` before transaction submission.

## Components

- `wallet.ts`: expose multi-wallet discovery while keeping single-provider helpers for existing reads and tests.
- `WalletStatus.tsx`: render connect button, selection modal, connected address button, account menu, and disconnect action.
- `LiveTraceSettleAction.tsx`: use the selected wallet path for write submission and preserve network switching before writes.
- Existing pages: preserve current layout and canonical reload behavior.

## Visual design

The modal uses the existing TraceSettle light operations style: white surface, subtle border, muted backdrop, clear heading, stacked wallet buttons, concise help text, and a cancel button. The connected address remains in the topbar as a compact button. Clicking it opens a small account menu with the shortened address, network readiness copy, and `Disconnect wallet`.

Accessibility requirements:

- Modal has dialog semantics and an accessible title.
- Wallet options are buttons with wallet names.
- Focus styles remain visible.
- Escape or Cancel closes the modal without changing account state.
- Disconnect clears selected provider and account from UI state.

## Data flow

1. User clicks `Connect wallet`.
2. App discovers available EVM providers.
3. App opens the wallet selection modal.
4. User selects one wallet.
5. App calls `eth_requestAccounts` on only that selected provider.
6. On success, topbar shows the shortened address.
7. Before any write, app switches or adds the GenLayer EVM chain using the configured EVM RPC URL.
8. After finality or timeout, app refreshes canonical contract views and shows the actual transaction state.
9. User can click the address and disconnect, which clears UI wallet state and disables future writes until reconnect.

## Error handling

- No detected wallet: show `No browser wallet detected`.
- User rejects selection: show the provider error message.
- Wallet returns no account: show `Wallet did not return an account`.
- Network switch/add fails: show the provider error and submit no transaction.
- Finality timeout: preserve submitted transaction hash, state that finality was not confirmed, and require canonical reload before relying on state.

## Tests

Add or update frontend tests to prove:

- The connect flow shows a modal with multiple detected EVM wallets.
- Selecting one wallet calls `eth_requestAccounts` only on that selected provider.
- The topbar address button opens an account menu.
- Disconnect clears the visible account and returns to `Connect wallet`.
- Write controls still switch or add the GenLayer EVM chain before transaction submission.
- Missing wallet and rejected wallet states remain honest and are not simulated.

## Acceptance

The wallet upgrade is complete only when the targeted tests pass, `npm run check` passes, local browser QA shows no frontend RPC `Failed to fetch` blocker, and Chrome QA confirms the production app can display wallet selection, connect the selected wallet, disconnect, read canonical state, and submit the explicitly authorized demo transaction path.
