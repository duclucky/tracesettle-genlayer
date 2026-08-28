import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { isActionVisible } from "../adapters/contractAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { discoverAuthorizedWallet, type WalletEnvironment } from "../adapters/wallet";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { StatusBadge } from "../components/StatusBadge";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";
import type { WorkflowSummary } from "../domain/types";

export function WorkflowRoomPage() {
  const { workflowId } = useParams();
  const runtime = resolveRuntimeConfig(import.meta.env);
  const previewWorkflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const [workflow, setWorkflow] = useState<WorkflowSummary | undefined>(
    runtime.mode === "live" ? undefined : previewWorkflow
  );
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical workflow..." : runtime.reason
  );
  const [newStepId, setNewStepId] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [newPromise, setNewPromise] = useState("");
  const [newDependencies, setNewDependencies] = useState("");
  const [newFeeWeight, setNewFeeWeight] = useState("1");

  async function refreshCanonicalWorkflow() {
    if (runtime.mode !== "live" || !runtime.contractAddress || !workflowId) {
      return;
    }
    const environment =
      typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment);
    const wallet = await discoverAuthorizedWallet(environment);
    const canonicalWorkflow = await createGenLayerTraceSettleAdapter({
      address: runtime.contractAddress,
      account: wallet.address,
      provider: wallet.provider,
      genlayerRpcUrl: runtime.genlayerRpcUrl,
      evmRpcUrl: runtime.evmRpcUrl
    }).getWorkflow(workflowId);
    if (!canonicalWorkflow) {
      setWorkflow(undefined);
      setReadState("Workflow was not found in canonical contract state.");
      return;
    }
    setWorkflow(canonicalWorkflow);
    setReadState("Reloaded canonical workflow state after finality.");
  }

  useEffect(() => {
    let disposed = false;
    const contractAddress = runtime.contractAddress;
    if (runtime.mode !== "live" || !contractAddress || !workflowId) {
      setWorkflow(previewWorkflow);
      setReadState(`${runtime.reason}. Showing labeled preview workflow.`);
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
        }).getWorkflow(workflowId)
      )
      .then((canonicalWorkflow) => {
        if (disposed) {
          return;
        }
        if (canonicalWorkflow) {
          setWorkflow(canonicalWorkflow);
          setReadState("Loaded canonical workflow and step views from the contract.");
          return;
        }
        setReadState("Workflow was not found in canonical contract state.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setReadState(error instanceof Error ? error.message : "Canonical workflow read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [
    previewWorkflow,
    runtime.contractAddress,
    runtime.evmRpcUrl,
    runtime.genlayerRpcUrl,
    runtime.mode,
    runtime.reason,
    workflowId
  ]);

  const feeWeight = Number(newFeeWeight);
  const addStepValid =
    newStepId.trim().length > 0 &&
    /^0x[0-9a-f]{40}$/i.test(newProvider.trim()) &&
    newPromise.trim().length > 0 &&
    Number.isInteger(feeWeight) &&
    feeWeight > 0;

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">
          {workflow ? `Workflow ${workflow.id}` : "Canonical workflow"}
        </span>
        <h1>Workflow room</h1>
        <p className="lead">
          {workflow?.objective ?? "Waiting for canonical workflow state."}
        </p>
      </div>

      {workflow ? (
        <div className="grid two">
        <section className="panel stack">
          <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
            <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
            <p>{readState}</p>
          </aside>
          <div className="row-meta">
            <StatusBadge status={workflow.status} />
            <span className="badge">{workflow.poolGen} GEN pool</span>
            <span className="badge">{workflow.role}</span>
          </div>
          <h2>Provider path</h2>
          <div className="step-list">
            {workflow.steps.map((step) => (
              <article className="step-item stack" key={step.id}>
                <div className="row-meta">
                  <span className="mono">{step.id}</span>
                  <span className="badge">{step.accepted ? "Accepted" : "Needs acceptance"}</span>
                </div>
                <h3>{step.title}</h3>
                <p className="muted">{step.promise}</p>
                {step.dependencies.length > 0 && (
                  <p className="muted">Depends on {step.dependencies.join(", ")}</p>
                )}
                <Link className="button secondary" to={`/workflows/${workflow.id}/evidence/${step.id}`}>
                  Open evidence
                </Link>
              </article>
            ))}
          </div>
        </section>

        <aside className="stack">
          <section className="panel stack">
            <h2>Next legal action</h2>
            <p>{workflow.nextAction}</p>
            <div className="actions">
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "addStep"
              }) && (
                <form className="field-grid" onSubmit={(event) => event.preventDefault()}>
                  <label>
                    Step ID
                    <input
                      required
                      value={newStepId}
                      onChange={(event) => setNewStepId(event.target.value)}
                    />
                  </label>
                  <label>
                    Provider address
                    <input
                      className="mono"
                      required
                      pattern="0x[0-9a-fA-F]{40}"
                      value={newProvider}
                      onChange={(event) => setNewProvider(event.target.value)}
                    />
                  </label>
                  <label>
                    Step promise
                    <textarea
                      required
                      value={newPromise}
                      onChange={(event) => setNewPromise(event.target.value)}
                    />
                  </label>
                  <label>
                    Dependencies
                    <input
                      placeholder="step-plan,step-build"
                      value={newDependencies}
                      onChange={(event) => setNewDependencies(event.target.value)}
                    />
                  </label>
                  <label>
                    Fee weight
                    <input
                      min="1"
                      required
                      step="1"
                      type="number"
                      value={newFeeWeight}
                      onChange={(event) => setNewFeeWeight(event.target.value)}
                    />
                  </label>
                  <LiveTraceSettleAction
                    className="button secondary"
                    disabled={!addStepValid}
                    onCanonicalReload={refreshCanonicalWorkflow}
                    action={(adapter) =>
                      adapter.addStep({
                        workflowId: workflow.id,
                        stepId: newStepId.trim(),
                        provider: newProvider.trim(),
                        promise: newPromise.trim(),
                        dependencies: newDependencies
                          .split(",")
                          .map((dependency) => dependency.trim())
                          .filter(Boolean),
                        feeWeight
                      })
                    }
                  >
                    Add provider step
                  </LiveTraceSettleAction>
                </form>
              )}
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "activateWorkflow"
              }) && (
                <LiveTraceSettleAction
                  className="button primary"
                  disabled={workflow.steps.length === 0}
                  onCanonicalReload={refreshCanonicalWorkflow}
                  action={(adapter) => adapter.activateWorkflow(workflow.id)}
                >
                  Activate workflow
                </LiveTraceSettleAction>
              )}
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "lockEvidence"
              }) && (
                <LiveTraceSettleAction
                  className="button primary"
                  onCanonicalReload={refreshCanonicalWorkflow}
                  action={(adapter) => adapter.lockEvidence(workflow.id)}
                >
                  Lock evidence
                </LiveTraceSettleAction>
              )}
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "requestReview"
              }) && workflow.status === "EVIDENCE_LOCKED" && (
                <LiveTraceSettleAction
                  className="button secondary"
                  onCanonicalReload={refreshCanonicalWorkflow}
                  action={(adapter) => adapter.requestReview(workflow.id)}
                >
                  Request review
                </LiveTraceSettleAction>
              )}
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "retryReview"
              }) && (
                <LiveTraceSettleAction
                  className="button secondary"
                  onCanonicalReload={refreshCanonicalWorkflow}
                  action={(adapter) => adapter.retryReview(workflow.id)}
                >
                  Retry review
                </LiveTraceSettleAction>
              )}
              {isActionVisible({
                role: workflow.role,
                status: workflow.status,
                action: "cancelWorkflow"
              }) && (
                <LiveTraceSettleAction
                  className="button danger"
                  onCanonicalReload={refreshCanonicalWorkflow}
                  action={(adapter) => adapter.cancelWorkflow(workflow.id)}
                >
                  Cancel safely
                </LiveTraceSettleAction>
              )}
            </div>
          </section>
          <TransactionState stage={workflow.status === "RETRYABLE" ? "retryable" : "idle"} />
          <details className="panel">
            <summary>Verification details</summary>
            <p className="muted">
              Raw attempt IDs, evidence digests, and Explorer links stay here so the main
              workflow remains user-focused.
            </p>
          </details>
        </aside>
        </div>
      ) : (
        <aside className="notice" aria-live="polite">
          <strong>Contract read</strong>
          <p>{readState}</p>
        </aside>
      )}
    </section>
  );
}
