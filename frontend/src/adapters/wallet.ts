import { chains } from "genlayer-js";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
}

const genLayerEvmChainId = `0x${chains.studionet.id.toString(16)}`;
const fallbackGenLayerGasPrice = "0xb2d05e0";
const minimumGenLayerGasPrice = BigInt(fallbackGenLayerGasPrice);

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
  seenWallets: Set<string>,
  provider: Eip1193Provider | undefined,
  label: string
) {
  if (!provider || seenProviders.includes(provider)) {
    return;
  }
  const walletIdentity = knownWalletIdentity(label);
  if (walletIdentity && seenWallets.has(walletIdentity)) {
    return;
  }
  seenProviders.push(provider);
  if (walletIdentity) {
    seenWallets.add(walletIdentity);
  }
  candidates.push({
    id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${candidates.length + 1}`,
    label,
    provider
  });
}

function knownWalletIdentity(label: string): string | undefined {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (normalized === "okx" || normalized === "okx wallet") {
    return "okx";
  }
  if (normalized === "metamask" || normalized === "meta mask") {
    return "metamask";
  }
  if (normalized === "rabby" || normalized === "rabby wallet") {
    return "rabby";
  }
  if (normalized === "coinbase" || normalized === "coinbase wallet") {
    return "coinbase";
  }
  if (normalized === "brave" || normalized === "brave wallet") {
    return "brave";
  }
  if (normalized === "phantom" || normalized === "phantom wallet") {
    return "phantom";
  }
  return undefined;
}

function isTransactionRequest(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveHexQuantity(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value) && BigInt(value) > 0n;
}

function needsGasPriceNormalization(value: unknown): boolean {
  if (!isPositiveHexQuantity(value)) {
    return true;
  }
  return BigInt(value) < minimumGenLayerGasPrice;
}

function hasEip1559FeeFields(transaction: Record<string, unknown>): boolean {
  return "maxFeePerGas" in transaction || "maxPriorityFeePerGas" in transaction;
}

async function currentGasPrice(provider: Eip1193Provider): Promise<`0x${string}`> {
  try {
    const gasPrice = await provider.request({ method: "eth_gasPrice" });
    if (isPositiveHexQuantity(gasPrice) && BigInt(gasPrice) >= minimumGenLayerGasPrice) {
      return gasPrice;
    }
  } catch {
    return fallbackGenLayerGasPrice;
  }
  return fallbackGenLayerGasPrice;
}

function retryAfterMs(cause: unknown): number | undefined {
  const message = cause instanceof Error ? cause.message : objectProperty(cause, "message");
  const code = objectProperty(cause, "code");
  const looksLikeCapacityError =
    code === -32005 ||
    code === "-32005" ||
    (typeof message === "string" &&
      /gas rate limit exceeded|node is at capacity/i.test(message));
  if (!looksLikeCapacityError) {
    return undefined;
  }

  const dataRetryAfter = objectProperty(objectProperty(cause, "data"), "retryAfterMs");
  const parsedDataDelay =
    typeof dataRetryAfter === "string" || typeof dataRetryAfter === "number"
      ? Number(dataRetryAfter)
      : Number.NaN;
  const parsedMessageDelay =
    typeof message === "string" ? Number(message.match(/retry in ~?(\d+)ms/i)?.[1]) : Number.NaN;
  const delayMs = Number.isFinite(parsedDataDelay)
    ? parsedDataDelay
    : Number.isFinite(parsedMessageDelay)
      ? parsedMessageDelay
      : 750;
  return Math.max(0, Math.min(delayMs, 3000));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithGasRateRetry(
  provider: Eip1193Provider,
  args: { method: string; params?: unknown[] | Record<string, unknown> },
  retries = 2
): Promise<unknown> {
  try {
    return await provider.request(args);
  } catch (cause) {
    const delayMs = retryAfterMs(cause);
    if (delayMs === undefined || retries <= 0) {
      throw cause;
    }
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    return requestWithGasRateRetry(provider, args, retries - 1);
  }
}

export function createBrowserWalletProvider(provider: Eip1193Provider): Eip1193Provider {
  return {
    async request(args) {
      if (
        args.method !== "eth_sendTransaction" ||
        !Array.isArray(args.params) ||
        !isTransactionRequest(args.params[0])
      ) {
        return provider.request(args);
      }

      const [transaction, ...rest] = args.params;
      let normalizedTransaction = transaction;
      if (hasEip1559FeeFields(transaction)) {
        if (
          needsGasPriceNormalization(transaction.maxFeePerGas) ||
          needsGasPriceNormalization(transaction.maxPriorityFeePerGas)
        ) {
          const gasPrice = await currentGasPrice(provider);
          const { gasPrice: _legacyGasPrice, ...transactionWithoutLegacyGasPrice } = transaction;
          normalizedTransaction = {
            ...transactionWithoutLegacyGasPrice,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice
          };
        }
      } else if (needsGasPriceNormalization(transaction.gasPrice)) {
        normalizedTransaction = {
          ...transaction,
          gasPrice: await currentGasPrice(provider)
        };
      }
      return requestWithGasRateRetry(provider, {
        ...args,
        params: [normalizedTransaction, ...rest]
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
  const seenWallets = new Set<string>();
  const providerList = objectProperty(source.ethereum, "providers");
  if (Array.isArray(providerList)) {
    for (const candidate of providerList) {
      const provider = asProvider(candidate);
      addCandidate(candidates, seenProviders, seenWallets, provider, providerLabel(candidate));
    }
  }

  addCandidate(
    candidates,
    seenProviders,
    seenWallets,
    asProvider(source.ethereum),
    providerLabel(source.ethereum)
  );

  const walletSpecificCandidates: Array<[unknown, string]> = [
    [source.okxwallet, "OKX Wallet"],
    [source.phantom, "Phantom"],
    [source.rabby, "Rabby"],
    [source.coinbaseWalletExtension, "Coinbase Wallet"]
  ];

  for (const [candidate, label] of walletSpecificCandidates) {
    const provider = asProvider(objectProperty(candidate, "ethereum")) ?? asProvider(candidate);
    addCandidate(candidates, seenProviders, seenWallets, provider, label);
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
  announcementWaitMs = 600
): Promise<WalletCandidate[]> {
  if (!source.addEventListener || !source.dispatchEvent) {
    return fallbackWalletCandidates(source);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const announcedCandidates: WalletCandidate[] = [];
    const seenProviders: Eip1193Provider[] = [];
    const seenWallets = new Set<string>();

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
        addCandidate(
          announcedCandidates,
          seenProviders,
          seenWallets,
          candidate.provider,
          candidate.label
        );
      }
      resolve(announcedCandidates);
    };

    const handleAnnouncement: EventListener = (event) => {
      const result = candidateFromAnnouncement(event);
      if (result) {
        addCandidate(announcedCandidates, seenProviders, seenWallets, result.provider, result.label);
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

function isMissingChainError(cause: unknown): boolean {
  const code = objectProperty(cause, "code");
  if (code === 4902 || code === "4902") {
    return true;
  }
  const message = cause instanceof Error ? cause.message : objectProperty(cause, "message");
  return (
    typeof message === "string" &&
    /unrecognized chain|unknown chain|chain id .*not.*found|try adding the chain/i.test(message)
  );
}

function isAlreadyAddedChainNotice(cause: unknown): boolean {
  const message = cause instanceof Error ? cause.message : objectProperty(cause, "message");
  return typeof message === "string" && /already (added|exists)|chain.*already/i.test(message);
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
  rpcUrl = "https://studio.genlayer.com/api"
): Promise<void> {
  const chainParams = {
    chainId: genLayerEvmChainId,
    chainName: "GenLayer Studionet",
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    rpcUrls: [rpcUrl],
    blockExplorerUrls: ["https://explorer-studio.genlayer.com/"]
  };

  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams]
    });
  } catch (cause) {
    if (!isAlreadyAddedChainNotice(cause)) {
      throw cause;
    }
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: genLayerEvmChainId }]
    });
  } catch (cause) {
    if (!isMissingChainError(cause)) {
      throw cause;
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams]
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: genLayerEvmChainId }]
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
