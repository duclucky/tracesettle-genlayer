import { useState } from "react";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  discoverInjectedWallet,
  type WalletEnvironment,
  walletRequestErrorMessage
} from "../adapters/wallet";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";
import { credits } from "../domain/fixtures";
import type { CreditsView } from "../domain/types";

const emptyCredits: CreditsView = {
  address: "",
  totalAvailableGen: 0,
  lines: []
};

export function CreditsPage() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const [view, setView] = useState<CreditsView>(
    runtime.mode === "live" ? emptyCredits : credits
  );
  const [readState, setReadState] = useState(
    runtime.mode === "live"
      ? "Connect a browser wallet to read canonical credit for that account."
      : `${runtime.reason}. Showing labeled preview credits.`
  );

  async function loadCredits() {
    if (runtime.mode !== "live" || !runtime.contractAddress) {
      setReadState(`${runtime.reason}. Configure a deployed contract before reading credits.`);
      return;
    }
    try {
      const detection = await discoverInjectedWallet(
        typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment)
      );
      if (!detection.provider) {
        setReadState("No browser wallet detected. Canonical credit read needs an account.");
        return;
      }
      const wallet = await connectInjectedWallet(detection.provider);
      if (!wallet.address) {
        setReadState("Wallet did not return an account. No canonical credit read was made.");
        return;
      }
      const adapter = createGenLayerTraceSettleAdapter({
        address: runtime.contractAddress,
        account: wallet.address,
        provider: detection.provider,
        genlayerRpcUrl: runtime.genlayerRpcUrl,
        evmRpcUrl: runtime.evmRpcUrl
      });
      setView(await adapter.getCredits(wallet.address));
      setReadState("Loaded canonical credit from contract view for the connected wallet.");
    } catch (cause) {
      setReadState(walletRequestErrorMessage(cause, "Canonical credit read failed"));
    }
  }

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">Canonical credit ledger</span>
        <h1>Credits</h1>
        <p className="lead">
          Withdrawable GEN appears only after canonical contract reads. This screen does
          not show simulated wallet balances, gas, or fees.
        </p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
            <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
            <p>{readState}</p>
          </aside>
          <h2>{view.totalAvailableGen} GEN available</h2>
          <div className="credit-list">
            {view.lines.map((line) => (
              <article className="credit-line" key={`${line.workflowId}-${line.reason}`}>
                <h3>{line.reason}</h3>
                <p className="muted">
                  {line.workflowId} - {line.amountGen} GEN - {line.status}
                </p>
              </article>
            ))}
          </div>
          <LiveTraceSettleAction
            className="button primary"
            disabled={view.totalAvailableGen <= 0}
            onCanonicalReload={loadCredits}
            action={(adapter, account) => adapter.withdrawCredit(account)}
          >
            Submit withdrawal
          </LiveTraceSettleAction>
          <button className="button secondary" type="button" onClick={loadCredits}>
            Read canonical credits
          </button>
        </section>
        <TransactionState />
      </div>
    </section>
  );
}
