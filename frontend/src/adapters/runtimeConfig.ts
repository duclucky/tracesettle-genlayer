export interface RuntimeConfig {
  contractAddress: `0x${string}` | undefined;
  genlayerRpcUrl: string;
  evmRpcUrl: string;
  mode: "live" | "preview";
  reason: string | undefined;
}

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const defaultGenLayerRpcUrl = "/genlayer-rpc";
const defaultEvmRpcUrl = "https://studio.genlayer.com/api";

export function isHexAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && addressPattern.test(value);
}

export function resolveRuntimeConfig(env: Record<string, unknown>): RuntimeConfig {
  const genlayerRpcUrl =
    typeof env.VITE_GENLAYER_RPC_URL === "string" && env.VITE_GENLAYER_RPC_URL.trim()
      ? env.VITE_GENLAYER_RPC_URL.trim()
      : defaultGenLayerRpcUrl;
  const evmRpcUrl =
    typeof env.VITE_EVM_RPC_URL === "string" && env.VITE_EVM_RPC_URL.trim()
      ? env.VITE_EVM_RPC_URL.trim()
      : defaultEvmRpcUrl;
  const configuredAddress = env.VITE_CONTRACT_ADDRESS;
  if (configuredAddress === undefined || configuredAddress === "") {
    return {
      contractAddress: undefined,
      genlayerRpcUrl,
      evmRpcUrl,
      mode: "preview",
      reason: "Missing VITE_CONTRACT_ADDRESS"
    };
  }
  if (!isHexAddress(configuredAddress)) {
    return {
      contractAddress: undefined,
      genlayerRpcUrl,
      evmRpcUrl,
      mode: "preview",
      reason: "Invalid VITE_CONTRACT_ADDRESS"
    };
  }
  return {
    contractAddress: configuredAddress,
    genlayerRpcUrl,
    evmRpcUrl,
    mode: "live",
    reason: undefined
  };
}
