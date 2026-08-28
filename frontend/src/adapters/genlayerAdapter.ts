import { chains, createClient } from "genlayer-js";
import { CalldataAddress } from "genlayer-js/types";
import type {
  AddStepInput,
  CreateWorkflowInput,
  CreditsView,
  StepClass,
  StepActionInput,
  StepSummary,
  SubmitEvidenceInput,
  TraceSettleAdapter,
  TransactionResult,
  WorkflowStatus,
  WorkflowSummary
} from "../domain/types";
import { createBrowserWalletProvider, type Eip1193Provider } from "./wallet";

export const GEN = 10n ** 18n;
const genLayerEvmChainId = 4221;

type ContractRead = Record<string, unknown>;

interface GenLayerClientLike {
  readContract(args: Record<string, unknown>): Promise<unknown>;
  writeContract(args: Record<string, unknown>): Promise<`0x${string}` | string>;
  waitForTransactionReceipt(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface AdapterOptions {
  address: `0x${string}`;
  account?: `0x${string}`;
  provider?: Eip1193Provider;
  genlayerRpcUrl?: string;
  evmRpcUrl?: string;
  client?: GenLayerClientLike;
}

interface TraceSettleChainOptions {
  genlayerRpcUrl: string;
  evmRpcUrl: string;
}

export function createTraceSettleChain(options: TraceSettleChainOptions) {
  return {
    ...chains.studionet,
    id: genLayerEvmChainId,
    rpcUrls: {
      default: {
        http: [options.genlayerRpcUrl]
      }
    },
    evmRpcUrls: {
      default: {
        http: [options.evmRpcUrl]
      }
    }
  };
}

function createSdkClient(options: AdapterOptions): GenLayerClientLike {
  return createClient({
    chain: createTraceSettleChain({
      genlayerRpcUrl: options.genlayerRpcUrl ?? "/genlayer-rpc",
      evmRpcUrl: options.evmRpcUrl ?? "https://rpc.testnet-chain.genlayer.com"
    }),
    endpoint: options.genlayerRpcUrl ?? "/genlayer-rpc",
    account: options.account,
    provider: options.provider ? (createBrowserWalletProvider(options.provider) as never) : undefined
  }) as unknown as GenLayerClientLike;
}

function asRecord(value: unknown): ContractRead {
  return typeof value === "object" && value !== null ? (value as ContractRead) : {};
}

function genFromBaseUnits(value: unknown): number {
  if (typeof value !== "string" || value.length === 0) {
    return 0;
  }
  return Number(BigInt(value) / GEN);
}

function calldataAddress(address: string): CalldataAddress {
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)?.map((item) => Number.parseInt(item, 16)) ?? []);
  return new CalldataAddress(bytes);
}

function toWorkflowSummary(id: string, raw: ContractRead): WorkflowSummary | undefined {
  if (Object.keys(raw).length === 0) {
    return undefined;
  }
  return {
    id,
    objective: String(raw.objective ?? ""),
    sponsor: String(raw.sponsor ?? ""),
    sponsorLabel: "Sponsor",
    role: "observer",
    status: String(raw.status ?? "DRAFT") as WorkflowStatus,
    poolGen: genFromBaseUnits(raw.pool),
    nextAction: "Reload canonical contract state after every finalized transaction.",
    consequence:
      raw.settled === true
        ? "Workflow has settled onchain."
        : "No finalized settlement consequence is shown yet.",
    steps: []
  };
}

function splitIds(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toStepSummary(id: string, raw: ContractRead): StepSummary {
  return {
    id,
    title: id,
    provider: String(raw.provider ?? ""),
    providerLabel: "Provider",
    promise: String(raw.promise ?? ""),
    dependencies: splitIds(raw.dependencies),
    feeGen: 0,
    bondGen: genFromBaseUnits(raw.bond),
    accepted: raw.accepted === true,
    evidenceUrl: String(raw.evidence_url ?? "") || undefined,
    digest: String(raw.digest ?? "") || undefined,
    class: String(raw.step_class ?? "PENDING") as StepClass
  };
}

function statusName(receipt: Record<string, unknown>): string {
  return String(receipt.statusName ?? receipt.status ?? "").toUpperCase();
}

function isFinalityTimeout(cause: unknown): boolean {
  const message = cause instanceof Error ? cause.message : String(cause ?? "");
  return (
    message.includes("Timed out waiting for transaction") &&
    message.includes('to reach status "FINALIZED"')
  );
}

function isReceiptNotIndexedYet(cause: unknown): boolean {
  const message = cause instanceof Error ? cause.message : String(cause ?? "");
  return /Transaction 0x[a-fA-F0-9]+ not found/.test(message);
}

async function waitForFinality(
  client: GenLayerClientLike,
  hash: `0x${string}` | string
): Promise<TransactionResult> {
  let receipt: Record<string, unknown>;
  try {
    receipt = await client.waitForTransactionReceipt({
      hash,
      status: "FINALIZED"
    });
  } catch (cause) {
    if (isFinalityTimeout(cause)) {
      return {
        id: hash,
        submitted: true,
        finalized: false,
        message:
          "Transaction submitted; finality was not confirmed before the browser timeout. Reload canonical contract state before relying on it."
      };
    }
    if (isReceiptNotIndexedYet(cause)) {
      return {
        id: hash,
        submitted: true,
        finalized: false,
        message:
          "Transaction submitted; the receipt was not indexed yet. Reload canonical contract state before relying on it."
      };
    }
    throw cause;
  }
  const finalized = statusName(receipt) === "FINALIZED";
  return {
    id: hash,
    submitted: true,
    finalized,
    message: finalized
      ? "Transaction finalized; reload canonical contract state."
      : "Transaction accepted; wait for finality before relying on state."
  };
}

export function createGenLayerTraceSettleAdapter(options: AdapterOptions): TraceSettleAdapter {
  const client = options.client ?? createSdkClient(options);

  async function readWorkflow(id: string) {
    return asRecord(
      await client.readContract({
        address: options.address,
        functionName: "get_workflow",
        args: [id],
        jsonSafeReturn: true
      })
    );
  }

  async function readStepIds(id: string) {
    return splitIds(
      await client.readContract({
        address: options.address,
        functionName: "get_workflow_step_ids",
        args: [id],
        jsonSafeReturn: true
      })
    );
  }

  async function readStep(workflowId: string, stepId: string) {
    return toStepSummary(
      stepId,
      asRecord(
        await client.readContract({
          address: options.address,
          functionName: "get_step",
          args: [workflowId, stepId],
          jsonSafeReturn: true
        })
      )
    );
  }

  async function write(functionName: string, args: unknown[], value = 0n) {
    const hash = await client.writeContract({
      address: options.address,
      functionName,
      args,
      value
    });
    return waitForFinality(client, hash);
  }

  return {
    async listWorkflows() {
      const ids = await client.readContract({
        address: options.address,
        functionName: "list_workflows",
        args: [0, 100],
        jsonSafeReturn: true
      });
      if (!Array.isArray(ids)) {
        return [];
      }
      const workflows = await Promise.all(ids.map((id) => this.getWorkflow(String(id))));
      return workflows.filter((workflow): workflow is WorkflowSummary => workflow !== undefined);
    },
    async getWorkflow(id: string) {
      const workflow = toWorkflowSummary(id, await readWorkflow(id));
      if (!workflow) {
        return undefined;
      }
      const stepIds = await readStepIds(id);
      workflow.steps = await Promise.all(stepIds.map((stepId) => readStep(id, stepId)));
      const account = options.account?.toLowerCase();
      if (account && workflow.sponsor.toLowerCase() === account) {
        workflow.role = "sponsor";
      } else if (
        account &&
        workflow.steps.some((step) => step.provider.toLowerCase() === account)
      ) {
        workflow.role = "provider";
      }
      return workflow;
    },
    async getCredits(address: string): Promise<CreditsView> {
      const raw = asRecord(
        await client.readContract({
          address: options.address,
          functionName: "get_credit",
          args: [calldataAddress(address)],
          jsonSafeReturn: true
        })
      );
      const amountGen = genFromBaseUnits(raw.amount);
      return {
        address,
        totalAvailableGen: amountGen,
        lines:
          amountGen > 0
            ? [
                {
                  workflowId: "canonical-credit-ledger",
                  reason: "Canonical contract credit",
                  amountGen,
                  status: "available"
                }
              ]
            : []
      };
    },
    async createWorkflow(input: CreateWorkflowInput) {
      const workflowId = `trace-${Date.now().toString(36)}`;
      const result = await write(
        "create_workflow",
        [workflowId, input.objective],
        BigInt(input.poolGen) * GEN
      );
      return {
        ...result,
        message: `${result.message} Canonical workflow ID: ${workflowId}.`
      };
    },
    addStep(input: AddStepInput) {
      return write("add_step", [
        input.workflowId,
        input.stepId,
        calldataAddress(input.provider),
        input.promise,
        input.dependencies.join(","),
        input.feeWeight
      ]);
    },
    activateWorkflow(id: string) {
      return write("activate_workflow", [id]);
    },
    acceptStep(input: StepActionInput) {
      return write("accept_step", [input.workflowId, input.stepId], GEN);
    },
    submitEvidence(input: SubmitEvidenceInput) {
      return write("submit_evidence", [
        input.workflowId,
        input.stepId,
        input.artifactUrl,
        input.digest
      ]);
    },
    lockEvidence(id: string) {
      return write("lock_evidence", [id]);
    },
    requestReview(id: string) {
      return write("request_review", [id]);
    },
    retryReview(id: string) {
      return write("retry_review", [id]);
    },
    cancelWorkflow(id: string) {
      return write("cancel_workflow", [id]);
    },
    withdrawCredit() {
      return write("withdraw_credit", []);
    }
  };
}
