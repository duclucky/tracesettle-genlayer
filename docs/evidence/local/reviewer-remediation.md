# Reviewer remediation evidence

Captured: 2026-08-17T20:26:46+07:00

## Reviewer issue addressed

- Local frontend RPC error: browser `Failed to fetch` against the configured GenLayer RPC endpoint.
- Settlement path: validator output needed stronger invariants before funds move.

## Changes

- Frontend separates endpoints:
  - GenLayer IC reads: `VITE_GENLAYER_RPC_URL`, default `/genlayer-rpc`.
  - EVM wallet transactions for the active Studio deployment: `VITE_EVM_RPC_URL`, default `https://studio.genlayer.com/api`.
- Vite and Vercel proxy `/genlayer-rpc` to `https://studio.genlayer.com/api`, avoiding browser CORS on direct local frontend calls.
- Wallet writes now request Studionet chain `0xf22f` and add it with native currency `GEN` if the wallet does not know it.
- Settlement now validates `coverage == COMPLETE`, exact class coverage, exact root-cause-to-`MATERIAL_FAULT` match, downstream-blocked dependency relation, and fee rounding residual before/while settling.

## Verification commands and real output

```powershell
$env:PYTHONUTF8='1'; npm run check
```

```text
✓ Lint passed (3 checks)
✓ Validation passed
  Contract: TraceSettleContract
  Methods: 16 (6 view, 10 write)
20 passed in 0.07s
✔ routes production GenLayer RPC proxy before SPA deep links
Test Files  6 passed (6)
Tests  87 passed (87)
✓ built in 492ms
```

```powershell
npm run deploy:studionet
```

```text
"commit": "7da7234278ff6fa7fed8d86643cec6c269da38c2"
"source_sha256": "6c26d20f3356b8022e34ab265b818e6dc7f15763ec581404fa44e23c68ccf813"
"tx_hash": "0xd05369d098c67497776a5beb6500efc3a9f60634c60203ee01593d87de5e2f9f"
"status": "FINALIZED"
"consensus_result": "MAJORITY_AGREE"
"deployment_result": "SUCCESS"
"contract_address": "0xF6BcD69787aeef9a4a033Fa951068eFbAA8fBDe5"
```

```powershell
node scripts/lifecycle-studionet.mjs
```

```text
{"lifecycle_result":"SUCCESS","final_status":"SETTLED","verdict":"SUCCESS","provider_credit_before_withdraw_gen":"4 GEN","provider_credit_after_withdraw_gen":"0 GEN"}
```

```powershell
Invoke-WebRequest -Method Post -Uri 'http://127.0.0.1:5173/genlayer-rpc' -ContentType 'application/json' -Body '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' -UseBasicParsing
```

```text
local_proxy_status=200 body={"jsonrpc":"2.0","result":"0xf22f","id":1}
```

```powershell
Invoke-WebRequest -Method Post -Uri 'https://tracesettle-genlayer.vercel.app/genlayer-rpc' -ContentType 'application/json' -Body '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' -UseBasicParsing
```

```text
proxy_post_status=200 body={"jsonrpc":"2.0","result":"0xf22f","id":1}
```

Chrome production read-only smoke:

```text
url=https://tracesettle-genlayer.vercel.app/settings
hasNewAddress=true
hasGenLayerProxy=true
hasEvmRpc=true
errorLogs=[]
```

Chrome local smoke note:

```text
Chrome extension blocked http://127.0.0.1:5173/settings and http://localhost:5173/settings with ERR_BLOCKED_BY_CLIENT.
Local proxy behavior was therefore verified by direct HTTP request instead of claimed as Chrome-local evidence.
```
