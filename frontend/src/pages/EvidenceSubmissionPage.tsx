import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createGenLayerTraceSettleAdapter } from "../adapters/genlayerAdapter";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import { discoverAuthorizedWallet, type WalletEnvironment } from "../adapters/wallet";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";
import { workflows } from "../domain/fixtures";
import type { StepSummary, WorkflowSummary } from "../domain/types";

const defaultArtifactUrl = "https://example.com/tracesettle/trace-1001/build.json";
const defaultDigest =
  "sha256:9b4f2d49fd0c3b6e9cf38d28e7f2d0d71cb0f5e6824f519807a8fd9f2d2c36aa";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSha256Digest(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/i.test(value);
}

export function EvidenceSubmissionPage() {
  const { workflowId, stepId } = useParams();
  const runtime = resolveRuntimeConfig(import.meta.env);
  const previewWorkflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const previewStep = previewWorkflow.steps.find((item) => item.id === stepId) ?? previewWorkflow.steps[1];
  const [workflow, setWorkflow] = useState<WorkflowSummary | undefined>(
    runtime.mode === "live" ? undefined : previewWorkflow
  );
  const [step, setStep] = useState<StepSummary | undefined>(
    runtime.mode === "live" ? undefined : previewStep
  );
  const [artifactUrl, setArtifactUrl] = useState(
    runtime.mode === "live" ? "" : previewStep.evidenceUrl ?? defaultArtifactUrl
  );
  const [digest, setDigest] = useState(
    runtime.mode === "live" ? "" : previewStep.digest ?? defaultDigest
  );
  const [readState, setReadState] = useState(
    runtime.mode === "live" ? "Loading canonical step..." : runtime.reason
  );
  const [currentAccount, setCurrentAccount] = useState<`0x${string}` | undefined>();

  useEffect(() => {
    let disposed = false;
    const contractAddress = runtime.contractAddress;
    if (runtime.mode !== "live" || !contractAddress || !workflowId || !stepId) {
      setWorkflow(previewWorkflow);
      setStep(previewStep);
      setArtifactUrl(previewStep.evidenceUrl ?? defaultArtifactUrl);
      setDigest(previewStep.digest ?? defaultDigest);
      setReadState(`${runtime.reason}. Showing labeled preview evidence fields.`);
      return () => {
        disposed = true;
      };
    }

    const environment =
      typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment);
    discoverAuthorizedWallet(environment)
      .then(async (wallet) => ({
        wallet,
        canonicalWorkflow: await createGenLayerTraceSettleAdapter({
          address: contractAddress,
          account: wallet.address,
          provider: wallet.provider,
          genlayerRpcUrl: runtime.genlayerRpcUrl,
          evmRpcUrl: runtime.evmRpcUrl
        }).getWorkflow(workflowId)
      }))
      .then(({ wallet, canonicalWorkflow }) => {
        if (disposed) {
          return;
        }
        setCurrentAccount(wallet.address);
        if (!canonicalWorkflow) {
          setReadState("Workflow was not found in canonical contract state.");
          return;
        }
        const canonicalStep = canonicalWorkflow.steps.find((item) => item.id === stepId);
        setWorkflow(canonicalWorkflow);
        if (canonicalStep) {
          setStep(canonicalStep);
          setArtifactUrl(canonicalStep.evidenceUrl ?? defaultArtifactUrl);
          setDigest(canonicalStep.digest ?? defaultDigest);
          setReadState("Loaded canonical step state from contract views.");
          return;
        }
        setReadState("Step was not found in canonical contract state.");
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }
        setReadState(error instanceof Error ? error.message : "Canonical step read failed.");
      });

    return () => {
      disposed = true;
    };
  }, [
    previewStep,
    previewWorkflow,
    runtime.contractAddress,
    runtime.evmRpcUrl,
    runtime.genlayerRpcUrl,
    runtime.mode,
    runtime.reason,
    stepId,
    workflowId
  ]);

  const evidenceValid = isHttpsUrl(artifactUrl.trim()) && isSha256Digest(digest.trim());
  const canActOnStep =
    runtime.mode === "preview"
      ? true
      : Boolean(
          currentAccount && step?.provider.toLowerCase() === currentAccount.toLowerCase()
        );

  async function refreshCanonicalStep() {
    if (runtime.mode !== "live" || !runtime.contractAddress || !workflowId || !stepId) {
      return;
    }
    try {
      const environment =
        typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment);
      const wallet = await discoverAuthorizedWallet(environment);
      setCurrentAccount(wallet.address);
      const canonicalWorkflow = await createGenLayerTraceSettleAdapter({
        address: runtime.contractAddress,
        account: wallet.address,
        provider: wallet.provider,
        genlayerRpcUrl: runtime.genlayerRpcUrl,
        evmRpcUrl: runtime.evmRpcUrl
      }).getWorkflow(workflowId);
      if (!canonicalWorkflow) {
        setReadState("Workflow was not found in canonical contract state.");
        return;
      }
      const canonicalStep = canonicalWorkflow.steps.find((item) => item.id === stepId);
      setWorkflow(canonicalWorkflow);
      if (!canonicalStep) {
        setReadState("Step was not found in canonical contract state.");
        return;
      }
      setStep(canonicalStep);
      setArtifactUrl(canonicalStep.evidenceUrl ?? defaultArtifactUrl);
      setDigest(canonicalStep.digest ?? defaultDigest);
      setReadState("Reloaded canonical step state after finality.");
    } catch (error: unknown) {
      setReadState(error instanceof Error ? error.message : "Canonical step reload failed.");
    }
  }

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">{step?.providerLabel ?? "Canonical provider step"}</span>
        <h1>Submit evidence</h1>
        <p className="lead">
          Submit the artifact URL and digest for the locked provider step. Success is not
          shown until the wallet transaction finalizes and canonical state reloads.
        </p>
      </div>

      {workflow && step ? (
        <div className="grid two">
        <form className="form-panel field-grid" onSubmit={(event) => event.preventDefault()}>
          <aside className={runtime.mode === "live" ? "notice" : "notice danger-note"}>
            <strong>{runtime.mode === "live" ? "Contract read" : "Preview read"}</strong>
            <p>{readState}</p>
          </aside>
          <label>
            Artifact URL
            <input
              name="artifactUrl"
              type="url"
              required
              disabled={!canActOnStep}
              value={artifactUrl}
              onChange={(event) => setArtifactUrl(event.target.value)}
            />
          </label>
          <label>
            Artifact digest
            <input
              className="mono"
              name="digest"
              required
              disabled={!canActOnStep}
              pattern="sha256:[0-9a-fA-F]{64}"
              value={digest}
              onChange={(event) => setDigest(event.target.value)}
            />
          </label>
          {!canActOnStep && (
            <p className="muted">
              This step is read-only because the connected account is not its provider.
            </p>
          )}
          {canActOnStep && !step.accepted && (
            <LiveTraceSettleAction
              className="button secondary"
              onCanonicalReload={refreshCanonicalStep}
              action={(adapter) =>
                adapter.acceptStep({ workflowId: workflow.id, stepId: step.id })
              }
            >
              Accept step with 1 GEN
            </LiveTraceSettleAction>
          )}
          {canActOnStep && (
            <LiveTraceSettleAction
              className="button primary"
              disabled={!step.accepted || !evidenceValid}
              onCanonicalReload={refreshCanonicalStep}
              action={(adapter) =>
                adapter.submitEvidence({
                  workflowId: workflow.id,
                  stepId: step.id,
                  artifactUrl: artifactUrl.trim(),
                  digest: digest.trim()
                })
              }
            >
              Submit evidence transaction
            </LiveTraceSettleAction>
          )}
        </form>

        <aside className="stack">
          <section className="panel stack">
            <h2>Step promise</h2>
            <p>{step.promise}</p>
            <p className="muted">
              Dependencies: {step.dependencies.length > 0 ? step.dependencies.join(", ") : "none"}
            </p>
          </section>
          <TransactionState />
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
