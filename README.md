# TraceSettle

Settle the failed workflow, not the loudest accusation.

TraceSettle is a GenLayer Projects-track application for multi-provider
workflow settlement. A sponsor funds a bounded workflow in GEN, assigned
providers post 1 GEN bonds and submit public artifact evidence with a bounded
provenance envelope, and one
Intelligent Contract asks validators to classify step satisfaction, root cause,
coverage, and the deterministic settlement consequence.

## Why GenLayer is required

A normal database or backend LLM could store workflow steps, but it would leave
one coordinator in control of blame and payout. TraceSettle puts the disputed
semantic question inside a GenLayer Intelligent Contract: validators
independently fetch the locked evidence, recompute the submitted digest, agree
on the meaning of the artifact set, and only then apply the settlement rule.
Provider-controlled artifact text is treated as untrusted input. It cannot
create policy, source authority, payout rules, or settlement destinations.

Validators inspect:

- the locked workflow objective, step promises, dependency graph, and assigned
  provider wallets;
- public HTTPS artifact URLs and SHA-256 digests submitted by the provider
  wallet before evidence lock;
- the artifact provenance envelope binding the fetched text to the canonical
  workflow objective hash, workflow ID, step ID, and provider wallet, with the
  raw content digest recomputed separately;
- whether each step is satisfied, materially faulty, downstream-blocked, or
  unverifiable;
- the exact root-cause step set, source coverage, verdict, and deterministic
  consequence class.

The finalized consequence opens canonical GEN credits, refunds, bond returns,
or forfeitures exactly once. The frontend then reloads canonical contract state
instead of treating wallet submission as success.

## Verified status

- Category: Projects
- Repository: https://github.com/duclucky/tracesettle-genlayer
- Live app: https://tracesettle-genlayer.vercel.app
- Network: Studionet
- Contract: `0xC125348c60768552Aa51D9E8d00a59e326958a17`
- Explorer: https://explorer-studio.genlayer.com/address/0xC125348c60768552Aa51D9E8d00a59e326958a17
- Deploy tx: `0x4bfd7a61a876859ea562eaa7f939bd300d054571c0e1ff0b799527cb8a627b38`
- Deployment: `FINALIZED`, `MAJORITY_AGREE`, `SUCCESS`
- Lifecycle workflow: `trace-live-20260822-a`
- Lifecycle result: `SUCCESS`
- Final verdict: `SUCCESS`
- Provider credit: `4 GEN` before withdrawal, `0 GEN` after withdrawal
- Browser-wallet workflow: prior evidence on superseded deployment; not claimed
  as remediated-contract browser write proof.
- Current local check: 1 contract, 20 direct tests, 4 deployment/config tests,
  84 frontend tests, production build passing
- Provenance remediation: deployed contract rejects missing or mismatched
  artifact provenance before settlement.
- Reviewer remediation: frontend wallet writes now switch/add Studionet chain
  `0xf22f` with RPC `https://studio.genlayer.com/api`; GenLayer IC reads use
  same-origin `/genlayer-rpc` proxy to avoid browser CORS on direct app calls.

See:

- `docs/README.md` for the full specification and gate evidence.
- `docs/evidence/studionet/deployment.json` for allowlisted deployment proof.
- `docs/evidence/studionet/lifecycle.json` for allowlisted lifecycle proof.
- `docs/evidence/studionet/frontend-live.json` for public frontend deployment proof.
- `docs/evidence/studionet/browser-wallet-lifecycle.json` for prior Chrome
  browser-wallet lifecycle proof on the superseded deployment.
- `docs/SUBMISSION.md` for copy-ready Builders submission text.

## Product surface

The Vercel app is a full Projects-track dApp, not a contract explorer. It
includes:

- entry and role selection;
- workflow inbox and detail pages;
- sponsor workflow setup;
- provider evidence submission;
- canonical credit read and withdrawal;
- wallet/network settings;
- help and verification guidance.

The browser client uses `genlayer-js`, an injected EIP-1193 wallet, Studionet,
and the deployed contract address. It does not simulate wallet signatures,
balances, gas, fees, transactions, finality, or canonical contract state.

## Build and verify

```powershell
npm install
cd frontend
npm install
cd ..
npm run check
```

`npm run check` runs:

- `genvm-lint check` against `contracts/tracesettle.py`
- direct Python tests
- deployment receipt parser tests
- frontend Vitest tests
- production frontend build

## Frontend configuration

The frontend reads:

- `VITE_CONTRACT_ADDRESS`
- `VITE_GENLAYER_RPC_URL` (default `/genlayer-rpc`)
- `VITE_EVM_RPC_URL` (default `https://studio.genlayer.com/api`)

Local development can copy `frontend/.env.example` to `frontend/.env`. Vite
proxies `/genlayer-rpc` to `https://studio.genlayer.com/api`; production Vercel
does the same via `frontend/vercel.json`.

Only public `VITE_*` values belong in frontend env files. Private keys must stay
in ignored project or parent `.env` files for deployment/lifecycle scripts.

## Studionet deployment and lifecycle

Deployment and lifecycle scripts are resumable and save only allowlisted public
evidence:

```powershell
npm run inspect:deployment
npm run deploy:studionet
npm run lifecycle:studionet
```

The scripts discover ignored local secrets from project `.env` first, then the
authorized parent workspace `.env`, and never print private key values.

## Honest limits

This repository proves local checks, provenance-gate Studionet deployment,
script-signed Studionet lifecycle evidence for that deployed revision, public
repository availability, production frontend availability, and same-origin RPC
proxy behavior. It does not claim fresh remediated browser-wallet writes, legal
arbitration, private evidence support, offchain execution proof, Portal
acceptance, CI, demo video, or external adoption.

## Copy-ready submission

**Recommended category:** Projects

**Title:** TraceSettle

**Description:**

TraceSettle is a Studionet dApp for evidence-based settlement of multi-provider AI workflows. A sponsor funds 2 GEN, providers post 1 GEN bonds and submit public artifact evidence with a provenance envelope. The Intelligent Contract fetches locked evidence, recomputes digests, treats artifact text as untrusted input, verifies binding to the canonical workflow objective, provider, and step, asks validators to classify satisfaction/root cause/coverage, and opens deterministic GEN credits/refunds/withdrawals only after settlement invariants pass. External truth claims require approved sources or signed attestations; missing proof stays retryable or unverifiable.

**Short report:**

```text
Project name: TraceSettle
Description: TraceSettle settles multi-provider workflow failures with validator judgment and GEN consequences that a normal database cannot neutrally enforce.
GitHub (public): https://github.com/duclucky/tracesettle-genlayer
Live app: https://tracesettle-genlayer.vercel.app
Contract (studionet): 0xC125348c60768552Aa51D9E8d00a59e326958a17
```
