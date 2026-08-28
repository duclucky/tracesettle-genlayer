import { useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  ensureGenLayerEvmNetwork,
  walletRequestErrorMessage
} from "../adapters/wallet";
import type { TraceSettleAdapter, TransactionResult } from "../domain/types";
import { TransactionState, type TransactionStage } from "./TransactionState";
import { useWalletSession } from "./WalletSessionContext";

interface LiveTraceSettleActionProps {
  children: string;
  className: string;
  disabled?: boolean;
  action(adapter: TraceSettleAdapter, account: `0x${string}`): Promise<TransactionResult>;
  onCanonicalReload?: () => Promise<void> | void;
}

function classifyResult(result: TransactionResult): TransactionStage {
  if (result.finalized) {
    return "finalized";
  }
  if (result.submitted) {
    return "submitted";
  }
  return "failed";
}

export function LiveTraceSettleAction({
  children,
  className,
  disabled = false,
  action,
  onCanonicalReload
}: LiveTraceSettleActionProps) {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const { address, provider } = useWalletSession();
  const needsConnectedWallet = runtime.mode === "live" && (!address || !provider);
  const [stage, setStage] = useState<TransactionStage>("idle");
  const [message, setMessage] = useState<string>(
    needsConnectedWallet
      ? "Connect wallet before signing. No transaction has been submitted."
      : "No transaction has been signed from this control."
  );
  const busy = stage === "wallet" || stage === "submitted";

  async function runAction() {
    if (runtime.mode !== "live" || !runtime.contractAddress) {
      setStage("failed");
      setMessage(`${runtime.reason}. Configure a deployed contract before signing.`);
      return;
    }

    if (!address || !provider) {
      setStage("failed");
      setMessage("Connect wallet before signing. No transaction was submitted.");
      return;
    }

    try {
      await ensureGenLayerEvmNetwork(provider, runtime.evmRpcUrl);
      setStage("wallet");
      setMessage("Approve or reject the request in your wallet. No transaction is claimed yet.");
      const { createGenLayerTraceSettleAdapter } = await import("../adapters/genlayerAdapter");
      const adapter = createGenLayerTraceSettleAdapter({
        address: runtime.contractAddress,
        account: address,
        provider,
        genlayerRpcUrl: runtime.genlayerRpcUrl,
        evmRpcUrl: runtime.evmRpcUrl
      });
      const result = await action(adapter, address);
      setStage(classifyResult(result));
      setMessage(result.message);
      if (result.finalized) {
        await onCanonicalReload?.();
      }
    } catch (cause) {
      setStage("failed");
      setMessage(walletRequestErrorMessage(cause, "Transaction failed before finality"));
    }
  }

  return (
    <div className="stack">
      <button
        className={className}
        type="button"
        onClick={runAction}
        disabled={disabled || busy || needsConnectedWallet}
      >
        {children}
      </button>
      <TransactionState stage={stage} message={message} />
    </div>
  );
}
