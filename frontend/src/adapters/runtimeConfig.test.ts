import { describe, expect, it } from "vitest";
import { resolveRuntimeConfig } from "./runtimeConfig";

describe("runtime config", () => {
  it("marks the frontend as preview-only until a deployed contract address is configured", () => {
    expect(resolveRuntimeConfig({})).toEqual({
      contractAddress: undefined,
      genlayerRpcUrl: "/genlayer-rpc",
      evmRpcUrl: "https://studio.genlayer.com/api",
      mode: "preview",
      reason: "Missing VITE_CONTRACT_ADDRESS"
    });
  });

  it("accepts a configured contract address for live mode", () => {
    expect(
      resolveRuntimeConfig({
        VITE_CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890"
      })
    ).toEqual({
      contractAddress: "0x1234567890123456789012345678901234567890",
      genlayerRpcUrl: "/genlayer-rpc",
      evmRpcUrl: "https://studio.genlayer.com/api",
      mode: "live",
      reason: undefined
    });
  });

  it("defaults local browser reads through a same-origin proxy and wallet traffic through the same Studionet RPC family", () => {
    expect(
      resolveRuntimeConfig({
        VITE_CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890"
      })
    ).toMatchObject({
      genlayerRpcUrl: "/genlayer-rpc",
      evmRpcUrl: "https://studio.genlayer.com/api"
    });
  });

  it("accepts explicit public RPC overrides without private configuration", () => {
    expect(
      resolveRuntimeConfig({
        VITE_CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890",
        VITE_GENLAYER_RPC_URL: "https://example.com/genlayer",
        VITE_EVM_RPC_URL: "https://example.com/evm"
      })
    ).toMatchObject({
      genlayerRpcUrl: "https://example.com/genlayer",
      evmRpcUrl: "https://example.com/evm"
    });
  });

  it("rejects malformed contract addresses instead of silently using fixture state", () => {
    expect(resolveRuntimeConfig({ VITE_CONTRACT_ADDRESS: "trace-1001" })).toEqual({
      contractAddress: undefined,
      genlayerRpcUrl: "/genlayer-rpc",
      evmRpcUrl: "https://studio.genlayer.com/api",
      mode: "preview",
      reason: "Invalid VITE_CONTRACT_ADDRESS"
    });
  });
});
