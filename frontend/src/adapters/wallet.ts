export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
}

const genLayerEvmChainId = "0x107d";

export interface WalletEnvironment {
  ethereum?: unknown;
  okxwallet?: unknown;
  phantom?: unknown;
  rabby?: unknown;
  coinbaseWalletExtension?: unknown;
  addEventListener?(type: string, listener: EventListener): void;
  removeEventListener?(type: string, listener: EventListener): void;
  dispatchEvent?(event: Event): boolean;
}

export type WalletDetection =
  | {
      status: "available";
      provider: Eip1193Provider;
      label: string;
    }
  | {
      status: "missing";
      provider: undefined;
      label: "No browser wallet detected";
    };

export interface WalletCandidate {
  id: string;
  label: string;
  provider: Eip1193Provider;
}

export type WalletConnection =
  | {
      status: "connected";
      address: `0x${string}`;
    }
  | {
      status: "rejected";
      address: undefined;
    };

function asProvider(candidate: unknown): Eip1193Provider | undefined {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "request" in candidate &&
    typeof candidate.request === "function"
  ) {
    return candidate as Eip1193Provider;
  }
  return undefined;
}

function objectProperty(candidate: unknown, property: string): unknown {
  if (typeof candidate !== "object" || candidate === null || !(property in candidate)) {
    return undefined;
  }
  return (candidate as Record<string, unknown>)[property];
}

function available(provider: Eip1193Provider, label: string): WalletDetection {
  return { status: "available", provider, label };
}

function detectionFromCandidate(candidate: WalletCandidate): WalletDetection {
  return available(candidate.provider, `${candidate.label} available`);
}

function addCandidate(
  candidates: WalletCandidate[],
  seenProviders: Eip1193Provider[],
  provider: Eip1193Provider | undefined,
  label: string
) {
  if (!provider || seenProviders.includes(provider)) {
    return;
  }
  seenProviders.push(provider);
  candidates.push({
    id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${candidates.length + 1}`,
    label,
    provider
  });
}

function isTransactionRequest(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createBrowserWalletProvider(provider: Eip1193Provider): Eip1193Provider {
  return {
    request(args) {
      if (
        args.method !== "eth_sendTransaction" ||
        !Array.isArray(args.params) ||
        !isTransactionRequest(args.params[0]) ||
        args.params[0].gasPrice !== "0x0"
      ) {
        return provider.request(args);
      }

      const [transaction, ...rest] = args.params;
      return provider.request({
        ...args,
        params: [
          {
            ...transaction,
            gasPrice: "0x1"
          },
          ...rest
        ]
      });
    }
  };
}

export function detectInjectedWallet(source: WalletEnvironment): WalletDetection {
  const candidates = fallbackWalletCandidates(source);
  if (candidates[0]) {
    return detectionFromCandidate(candidates[0]);
  }

  return {
    status: "missing",
    provider: undefined,
    label: "No browser wallet detected"
  };
}

function fallbackWalletCandidates(source: WalletEnvironment): WalletCandidate[] {
  const candidates: WalletCandidate[] = [];
  const seenProviders: Eip1193Provider[] = [];
  const providerList = objectProperty(source.ethereum, "providers");
  if (Array.isArray(providerList)) {
    for (const candidate of providerList) {
      const provider = asProvider(candidate);
      addCandidate(candidates, seenProviders, provider, providerLabel(candidate));
    }
  }

  addCandidate(candidates, seenProviders, asProvider(source.ethereum), providerLabel(source.ethereum));

  const walletSpecificCandidates: Array<[unknown, string]> = [
    [source.okxwallet, "OKX Wallet"],
    [source.phantom, "Phantom"],
    [source.rabby, "Rabby"],
    [source.coinbaseWalletExtension, "Coinbase Wallet"]
  ];

  for (const [candidate, label] of walletSpecificCandidates) {
    const provider = asProvider(candidate) ?? asProvider(objectProperty(candidate, "ethereum"));
    addCandidate(candidates, seenProviders, provider, label);
  }

  return candidates;
}

function providerLabel(candidate: unknown): string {
  const name = objectProperty(candidate, "name");
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }
  const infoName = objectProperty(objectProperty(candidate, "info"), "name");
  if (typeof infoName === "string" && infoName.trim()) {
    return infoName.trim();
  }
  if (objectProperty(candidate, "isMetaMask") === true) {
    return "MetaMask";
  }
  if (objectProperty(candidate, "isRabby") === true) {
    return "Rabby";
  }
  if (objectProperty(candidate, "isCoinbaseWallet") === true) {
    return "Coinbase Wallet";
  }
  if (objectProperty(candidate, "isBraveWallet") === true) {
    return "Brave Wallet";
  }
  return "Browser wallet";
}

function candidateFromAnnouncement(event: Event): WalletCandidate | undefined {
  const detail = (event as CustomEvent<unknown>).detail;
  const provider = asProvider(objectProperty(detail, "provider"));
  if (!provider) {
    return undefined;
  }
  const announcedName = objectProperty(objectProperty(detail, "info"), "name");
  const label =
    typeof announcedName === "string" && announcedName.trim()
      ? announcedName.trim()
      : "Browser wallet";
  return {
    id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-announced`,
    label,
    provider
  };
}

export async function discoverInjectedWallets(
  source: WalletEnvironment,
  announcementWaitMs = 100
): Promise<WalletCandidate[]> {
  if (!source.addEventListener || !source.dispatchEvent) {
    return fallbackWalletCandidates(source);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const announcedCandidates: WalletCandidate[] = [];
    const seenProviders: Eip1193Provider[] = [];

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      source.removeEventListener?.("eip6963:announceProvider", handleAnnouncement);
      const fallbacks = fallbackWalletCandidates(source);
      for (const candidate of fallbacks) {
        addCandidate(announcedCandidates, seenProviders, candidate.provider, candidate.label);
      }
      resolve(announcedCandidates);
    };

    const handleAnnouncement: EventListener = (event) => {
      const result = candidateFromAnnouncement(event);
      if (result) {
        addCandidate(announcedCandidates, seenProviders, result.provider, result.label);
      }
    };

    source.addEventListener?.("eip6963:announceProvider", handleAnnouncement);
    try {
      source.dispatchEvent?.(new Event("eip6963:requestProvider"));
    } catch {
      resolve(fallbackWalletCandidates(source));
      return;
    }

    if (!settled) {
      timer = setTimeout(() => finish(), Math.max(0, announcementWaitMs));
    }
  });
}

export async function discoverInjectedWallet(
  source: WalletEnvironment,
  announcementWaitMs = 100
): Promise<WalletDetection> {
  const candidates = await discoverInjectedWallets(source, announcementWaitMs);
  if (candidates[0]) {
    return detectionFromCandidate(candidates[0]);
  }
  return {
    status: "missing",
    provider: undefined,
    label: "No browser wallet detected"
  };
}

export function walletRequestErrorMessage(
  cause: unknown,
  fallback = "Wallet request failed"
): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message.trim();
  }
  const providerMessage = objectProperty(cause, "message");
  if (typeof providerMessage === "string" && providerMessage.trim()) {
    return providerMessage.trim();
  }
  const providerCode = objectProperty(cause, "code");
  if (typeof providerCode === "number" || typeof providerCode === "string") {
    return `${fallback} (code ${providerCode})`;
  }
  return fallback;
}

export async function connectInjectedWallet(provider: Eip1193Provider): Promise<WalletConnection> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (Array.isArray(accounts) && typeof accounts[0] === "string") {
    return {
      status: "connected",
      address: accounts[0] as `0x${string}`
    };
  }
  return {
    status: "rejected",
    address: undefined
  };
}

export async function ensureGenLayerEvmNetwork(
  provider: Eip1193Provider,
  rpcUrl = "https://rpc.testnet-chain.genlayer.com"
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: genLayerEvmChainId }]
    });
  } catch (cause) {
    const code = objectProperty(cause, "code");
    if (code !== 4902 && code !== "4902") {
      throw cause;
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: genLayerEvmChainId,
          chainName: "GenLayer EVM",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: ["https://explorer.testnet-chain.genlayer.com/"]
        }
      ]
    });
  }
}

export async function readAuthorizedWallet(provider: Eip1193Provider): Promise<WalletConnection> {
  const accounts = await provider.request({ method: "eth_accounts" });
  if (Array.isArray(accounts) && typeof accounts[0] === "string") {
    return {
      status: "connected",
      address: accounts[0] as `0x${string}`
    };
  }
  return {
    status: "rejected",
    address: undefined
  };
}

export async function discoverAuthorizedWallet(source: WalletEnvironment): Promise<{
  provider?: Eip1193Provider;
  address?: `0x${string}`;
}> {
  const detection = await discoverInjectedWallet(source);
  if (!detection.provider) {
    return {};
  }
  let connection: WalletConnection;
  try {
    connection = await readAuthorizedWallet(detection.provider);
  } catch {
    connection = { status: "rejected", address: undefined };
  }
  return {
    provider: detection.provider,
    address: connection.address
  };
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
