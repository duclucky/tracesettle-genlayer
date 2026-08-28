import { describe, expect, it, vi } from "vitest";
import {
  connectInjectedWallet,
  createBrowserWalletProvider,
  detectInjectedWallet,
  discoverAuthorizedWallet,
  discoverInjectedWallet,
  discoverInjectedWallets,
  ensureGenLayerEvmNetwork,
  readAuthorizedWallet,
  shortenAddress,
  type WalletEnvironment,
  walletRequestErrorMessage
} from "./wallet";

describe("wallet adapter", () => {
  it("reports missing browser wallet honestly", () => {
    expect(detectInjectedWallet({})).toEqual({
      status: "missing",
      provider: undefined,
      label: "No browser wallet detected"
    });
  });

  it("detects an injected EIP-1193 wallet provider", () => {
    const provider = { request: vi.fn() };

    expect(detectInjectedWallet({ ethereum: provider })).toEqual({
      status: "available",
      provider,
      label: "Browser wallet available"
    });
  });

  it("discovers a provider announced through EIP-6963", async () => {
    const provider = { request: vi.fn() };
    const target = new EventTarget();
    target.addEventListener("eip6963:requestProvider", () => {
      target.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info: { name: "OKX Wallet" }, provider }
        })
      );
    });

    await expect(
      discoverInjectedWallet(target as WalletEnvironment, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "OKX Wallet available"
    });
  });

  it("uses a valid multi-provider fallback", async () => {
    const provider = { request: vi.fn() };

    await expect(
      discoverInjectedWallet({ ethereum: { providers: [{}, provider] } }, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "Browser wallet available"
    });
  });

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

  it("waits long enough for browser wallets that announce EIP-6963 providers late", async () => {
    vi.useFakeTimers();
    try {
      const okx = { request: vi.fn() };
      const rabby = { request: vi.fn() };
      const target = new EventTarget() as WalletEnvironment;
      target.addEventListener?.("eip6963:requestProvider", () => {
        setTimeout(() => {
          target.dispatchEvent?.(
            new CustomEvent("eip6963:announceProvider", {
              detail: { info: { name: "OKX Wallet" }, provider: okx }
            })
          );
        }, 250);
        setTimeout(() => {
          target.dispatchEvent?.(
            new CustomEvent("eip6963:announceProvider", {
              detail: { info: { name: "Rabby Wallet" }, provider: rabby }
            })
          );
        }, 450);
      });

      const discovery = discoverInjectedWallets(target);
      await vi.advanceTimersByTimeAsync(600);

      await expect(discovery).resolves.toEqual([
        expect.objectContaining({ label: "OKX Wallet", provider: okx }),
        expect.objectContaining({ label: "Rabby Wallet", provider: rabby })
      ]);
    } finally {
      vi.useRealTimers();
    }
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

  it("deduplicates the same wallet exposed through EIP-6963 and legacy globals", async () => {
    const announcedOkx = { request: vi.fn() };
    const legacyOkx = { request: vi.fn() };
    const target = new EventTarget() as WalletEnvironment;
    target.okxwallet = { ethereum: legacyOkx };
    target.addEventListener?.("eip6963:requestProvider", () => {
      target.dispatchEvent?.(
        new CustomEvent("eip6963:announceProvider", {
          detail: {
            info: { name: "OKX Wallet", rdns: "com.okx.wallet" },
            provider: announcedOkx
          }
        })
      );
    });

    await expect(discoverInjectedWallets(target, 0)).resolves.toEqual([
      expect.objectContaining({ label: "OKX Wallet", provider: announcedOkx })
    ]);
  });

  it("uses a wallet-specific nested EIP-1193 provider", async () => {
    const provider = { request: vi.fn() };

    await expect(
      discoverInjectedWallet({ okxwallet: { ethereum: provider } }, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "OKX Wallet available"
    });
  });

  it("ignores invalid announced and legacy candidates", async () => {
    const target = new EventTarget() as WalletEnvironment;
    target.ethereum = {};
    target.phantom = { ethereum: {} };
    target.addEventListener?.("eip6963:requestProvider", () => {
      target.dispatchEvent?.(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info: { name: "Fake Wallet" }, provider: {} }
        })
      );
    });

    await expect(discoverInjectedWallet(target, 0)).resolves.toEqual({
      status: "missing",
      provider: undefined,
      label: "No browser wallet detected"
    });
  });

  it("requests accounts from the selected wallet", async () => {
    const request = vi.fn().mockResolvedValue(["0x1234567890123456789012345678901234567890"]);

    await expect(connectInjectedWallet({ request })).resolves.toEqual({
      address: "0x1234567890123456789012345678901234567890",
      status: "connected"
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("normalizes zero gas price to the current chain gas price before wallet prompts", async () => {
    const requests: Array<{ method: string; params?: unknown[] | Record<string, unknown> }> = [];
    const provider = {
      request: vi.fn(async (args: { method: string; params?: unknown[] | Record<string, unknown> }) => {
        requests.push(args);
        if (args.method === "eth_gasPrice") {
          return "0xb2d05e0";
        }
        return "0xabc";
      })
    };
    const compatibleProvider = createBrowserWalletProvider(provider);

    await compatibleProvider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          gas: "0x30d40",
          gasPrice: "0x0",
          value: "0x0"
        }
      ]
    });

    expect(requests[0]).toEqual({ method: "eth_gasPrice" });
    expect(requests[1].params).toEqual([
      expect.objectContaining({
        gasPrice: "0xb2d05e0"
      })
    ]);
  });

  it("normalizes below-minimum gas price before wallet prompts", async () => {
    const requests: Array<{ method: string; params?: unknown[] | Record<string, unknown> }> = [];
    const provider = {
      request: vi.fn(async (args: { method: string; params?: unknown[] | Record<string, unknown> }) => {
        requests.push(args);
        if (args.method === "eth_gasPrice") {
          return "0xb2d05e0";
        }
        return "0xabc";
      })
    };
    const compatibleProvider = createBrowserWalletProvider(provider);

    await compatibleProvider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          gas: "0x7a120",
          gasPrice: "0x1",
          value: "0x0"
        }
      ]
    });

    expect(requests[1].params).toEqual([
      expect.objectContaining({
        gasPrice: "0xb2d05e0"
      })
    ]);
  });

  it("normalizes below-minimum EIP-1559 fee caps without adding legacy gas price", async () => {
    const requests: Array<{ method: string; params?: unknown[] | Record<string, unknown> }> = [];
    const provider = {
      request: vi.fn(async (args: { method: string; params?: unknown[] | Record<string, unknown> }) => {
        requests.push(args);
        if (args.method === "eth_gasPrice") {
          return "0xb2d05e0";
        }
        return "0xabc";
      })
    };
    const compatibleProvider = createBrowserWalletProvider(provider);

    await compatibleProvider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          gas: "0x7a120",
          maxFeePerGas: "0x1",
          maxPriorityFeePerGas: "0x1",
          value: "0x0"
        }
      ]
    });

    expect(requests[1].params).toEqual([
      expect.not.objectContaining({
        gasPrice: expect.anything()
      })
    ]);
    expect(requests[1].params).toEqual([
      expect.objectContaining({
        maxFeePerGas: "0xb2d05e0",
        maxPriorityFeePerGas: "0xb2d05e0"
      })
    ]);
  });

  it("retries transient GenLayer RPC gas-rate capacity errors once the wallet request is ready", async () => {
    const requests: Array<{ method: string; params?: unknown[] | Record<string, unknown> }> = [];
    const provider = {
      request: vi.fn(async (args: { method: string; params?: unknown[] | Record<string, unknown> }) => {
        requests.push(args);
        if (args.method === "eth_gasPrice") {
          return "0xb2d05e0";
        }
        if (args.method === "eth_sendTransaction" && requests.length === 2) {
          throw {
            code: -32005,
            message: "transaction gas rate limit exceeded: node is at capacity, retry in ~0ms",
            data: { retryAfterMs: "0" }
          };
        }
        return "0xabc";
      })
    };
    const compatibleProvider = createBrowserWalletProvider(provider);

    await expect(
      compatibleProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: "0x1111111111111111111111111111111111111111",
            to: "0x2222222222222222222222222222222222222222",
            gas: "0x7a120",
            gasPrice: "0x1",
            value: "0x0"
          }
        ]
      })
    ).resolves.toBe("0xabc");

    expect(requests.filter((request) => request.method === "eth_sendTransaction")).toHaveLength(2);
  });

  it("switches browser wallets to the GenLayer Studionet chain before writes", async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await ensureGenLayerEvmNetwork({ request });

    expect(request).toHaveBeenCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf22f" }]
    });
  });

  it("adds the GenLayer Studionet chain with the Studionet RPC by default when missing", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce({ code: 4902, message: "unknown chain" })
      .mockResolvedValueOnce(undefined);

    await ensureGenLayerEvmNetwork({ request });

    expect(request).toHaveBeenNthCalledWith(2, {
      method: "wallet_addEthereumChain",
      params: [
        expect.objectContaining({
          chainId: "0xf22f",
          chainName: "GenLayer Studionet",
          rpcUrls: ["https://studio.genlayer.com/api"],
          blockExplorerUrls: ["https://explorer-studio.genlayer.com/"]
        })
      ]
    });
  });

  it("keeps a configured wallet RPC override when the wallet reports an unrecognized chain by message", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'Unrecognized chain ID "0xf22f". Try adding the chain using wallet_switchEthereumChain first.'
        )
      )
      .mockResolvedValueOnce(undefined);

    await ensureGenLayerEvmNetwork({ request }, "https://example.com/evm");

    expect(request).toHaveBeenNthCalledWith(2, {
      method: "wallet_addEthereumChain",
      params: [
        expect.objectContaining({
          chainId: "0xf22f",
          rpcUrls: ["https://example.com/evm"]
        })
      ]
    });
  });

  it("reads an already-authorized account without requesting a connection", async () => {
    const request = vi.fn().mockResolvedValue(["0x1234567890123456789012345678901234567890"]);

    await expect(readAuthorizedWallet({ request })).resolves.toEqual({
      address: "0x1234567890123456789012345678901234567890",
      status: "connected"
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_accounts" });
  });

  it("keeps public canonical reads available when account discovery is rejected", async () => {
    const provider = { request: vi.fn().mockRejectedValue({ code: 4100 }) };

    await expect(discoverAuthorizedWallet({ ethereum: provider })).resolves.toEqual({
      provider,
      address: undefined
    });
  });

  it("does not accept an empty wallet response as a connected state", async () => {
    const request = vi.fn().mockResolvedValue([]);

    await expect(connectInjectedWallet({ request })).resolves.toEqual({
      address: undefined,
      status: "rejected"
    });
  });

  it("preserves a plain EIP-1193 provider error message", () => {
    expect(
      walletRequestErrorMessage({ code: 4001, message: "User rejected the request" })
    ).toBe("User rejected the request");
  });

  it("shortens addresses only for display", () => {
    expect(shortenAddress("0x1234567890123456789012345678901234567890")).toBe("0x1234...7890");
  });
});
