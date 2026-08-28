import { useEffect, useState } from "react";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { discoverAuthorizedWallet, type WalletEnvironment } from "../adapters/wallet";
import { WorkflowList } from "../components/WorkflowList";
import { workflows } from "../domain/fixtures";
import type { WorkflowStatus, WorkflowSummary } from "../domain/types";

const filters = ["All", "Active", "Needs action", "Retryable", "Settled", "Cancelled"] as const;
type WorkflowFilter = (typeof filters)[number];

const filterStatuses: Record<WorkflowFilter, WorkflowStatus[]> = {
  All: ["DRAFT", "OPEN", "EVIDENCE_LOCKED", "REVIEW_PENDING", "RETRYABLE", "SETTLED", "CANCELLED"],
  Active: ["DRAFT", "OPEN", "EVIDENCE_LOCKED", "REVIEW_PENDING", "RETRYABLE"],
  "Needs action": ["DRAFT", "OPEN", "EVIDENCE_LOCKED", "RETRYABLE"],
  Retryable: ["RETRYABLE"],
  Settled: ["SETTLED"],
  Cancelled: ["CANCELLED"]
};

export function WorkflowInboxPage() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const [items, setItems] = useState<WorkflowSummary[]>(
    runtime.mode === "live" ? [] : workflows
  );
  const [activeFilter, setActiveFilter] = useState<WorkflowFilter>("All");
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical contract workflows..." : runtime.reason
  );

  useEffect(() => {
    let disposed = false;
    const contractAddress = runtime.contractAddress;
    if (runtime.mode !== "live" || !contractAddress) {
      setItems(workflows);
      setReadState(`${runtime.reason}. Showing labeled preview rows.`);
      return () => {
        disposed = true;
      };
    }

    const environment =
      typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment);
    discoverAuthorizedWallet(environment)
      .then((wallet) =>
        createGenLayerTraceSettleAdapter({
          address: contractAddress,
          account: wallet.address,
          provider: wallet.provider,
          genlayerRpcUrl: runtime.genlayerRpcUrl,
          evmRpcUrl: runtime.evmRpcUrl
        }).listWorkflows(wallet.address ?? "")
      )
      .then((canonicalWorkflows) => {
        if (disposed) {
          return;
        }
        setItems(canonicalWorkflows);
        setReadState("Loaded canonical workflow IDs and summaries from contract views.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setItems([]);
        setReadState(error instanceof Error ? error.message : "Canonical workflow read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [
    runtime.contractAddress,
    runtime.evmRpcUrl,
    runtime.genlayerRpcUrl,
    runtime.mode,
    runtime.reason
  ]);

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">Canonical workflow reads</span>
        <h1>Workflow inbox</h1>
        <p className="lead">
          Review workflows from canonical contract views when a deployed address is configured.
          Preview rows are isolated dev data and labeled as such.
        </p>
      </div>

      <div className="stack">
        <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
          <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
          <p>{readState}</p>
        </aside>
        <div className="filters" aria-label="Workflow filters">
          {filters.map((filter) => (
            <button
              className={`filter-chip${activeFilter === filter ? " active" : ""}`}
              type="button"
              key={filter}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <WorkflowList
          workflows={items.filter((workflow) =>
            filterStatuses[activeFilter].includes(workflow.status)
          )}
        />
      </div>
    </section>
  );
}
