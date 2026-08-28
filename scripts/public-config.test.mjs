import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";

test(".env.example keeps browser wallet traffic on the Studionet EVM RPC", () => {
  const envExample = readFileSync(resolve(".env.example"), "utf8");

  assert.match(envExample, /^VITE_EVM_RPC_URL=https:\/\/studio\.genlayer\.com\/api$/m);
  assert.doesNotMatch(envExample, /^VITE_EVM_RPC_URL=https:\/\/rpc\.testnet-chain\.genlayer\.com$/m);
});
