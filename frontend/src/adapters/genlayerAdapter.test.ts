import { afterEach, describe, expect, it, vi } from "vitest";
import { GEN, createGenLayerTraceSettleAdapter, createTraceSettleChain } from "./genlayerAdapter";

function createClientStub() {
  return {
    readContract: vi.fn(),
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn()
  };
}

describe("GenLayer TraceSettle adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the GenLayer IC RPC and EVM wallet RPC as separate chain endpoints", () => {
    expect(
      createTraceSettleChain({
        genlayerRpcUrl: "/genlayer-rpc",
        evmRpcUrl: "https://rpc.testnet-chain.genlayer.com"
      })
    ).toMatchObject({
      id: 4221,
      rpcUrls: { default: { http: ["/genlayer-rpc"] } },
      evmRpcUrls: { default: { http: ["https://rpc.testnet-chain.genlayer.com"] } }
    });
  });

  it("derives the sponsor role from the connected canonical account", async () => {
    const client = createClientStub();
    client.readContract
      .mockResolvedValueOnce({
        objective: "Sponsor-owned workflow",
        sponsor: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        status: "DRAFT",
        pool: "2000000000000000000"
      })
      .mockResolvedValueOnce("");
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      client
    });

    await expect(adapter.getWorkflow("trace-sponsor")).resolves.toMatchObject({
      role: "sponsor"
    });
  });

  it("reads canonical workflow state from the configured contract", async () => {
    const client = createClientStub();
    client.readContract
      .mockResolvedValueOnce({
        objective: "Ship a bounded workflow",
        sponsor: "0x1111111111111111111111111111111111111111",
        status: "OPEN",
        pool: "2000000000000000000",
        settled: false,
        cancelled: false
      })
      .mockResolvedValueOnce("step-plan,step-build")
      .mockResolvedValueOnce({
        provider: "0x3333333333333333333333333333333333333333",
        promise: "Plan the workflow",
        dependencies: "",
        bond: "1000000000000000000",
        accepted: true,
        evidence_url: "https://example.com/plan.json",
        digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        step_class: "SATISFIED"
      })
      .mockResolvedValueOnce({
        provider: "0x4444444444444444444444444444444444444444",
        promise: "Build the workflow",
        dependencies: "step-plan",
        bond: "0",
        accepted: false,
        evidence_url: "",
        digest: "",
        step_class: "PENDING"
      });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x3333333333333333333333333333333333333333",
      client
    });

    await expect(adapter.getWorkflow("trace-1")).resolves.toMatchObject({
      id: "trace-1",
      objective: "Ship a bounded workflow",
      role: "provider",
      status: "OPEN",
      poolGen: 2
    });
    expect(client.readContract).toHaveBeenNthCalledWith(1, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_workflow",
      args: ["trace-1"],
      jsonSafeReturn: true
    });
    expect(client.readContract).toHaveBeenNthCalledWith(2, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_workflow_step_ids",
      args: ["trace-1"],
      jsonSafeReturn: true
    });
    expect(client.readContract).toHaveBeenNthCalledWith(3, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_step",
      args: ["trace-1", "step-plan"],
      jsonSafeReturn: true
    });
  });

  it("submits create workflow with exactly 2 GEN and waits for finality", async () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xabc");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(
      adapter.createWorkflow({
        objective: "Ship a bounded workflow",
        poolGen: 2
      })
    ).resolves.toEqual({
      id: "0xabc",
      submitted: true,
      finalized: true,
      message:
        "Transaction finalized; reload canonical contract state. Canonical workflow ID: trace-9ix."
    });
    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "0x1234567890123456789012345678901234567890",
        functionName: "create_workflow",
        value: 2n * GEN
      })
    );
    expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: "0xabc",
      status: "FINALIZED"
    });
  });

  it("adds a typed provider step without attaching GEN", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xadd");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await adapter.addStep({
      workflowId: "trace-1",
      stepId: "step-build",
      provider: "0x3333333333333333333333333333333333333333",
      promise: "Build the artifact",
      dependencies: ["step-plan"],
      feeWeight: 2
    });

    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "add_step",
        value: 0n,
        args: [
          "trace-1",
          "step-build",
          expect.anything(),
          "Build the artifact",
          "step-plan",
          2
        ]
      })
    );
  });

  it("activates a configured draft workflow without attaching GEN", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xactivate");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await adapter.activateWorkflow("trace-1");

    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "activate_workflow",
        args: ["trace-1"],
        value: 0n
      })
    );
  });

  it("keeps accepted-but-not-finalized transactions visibly incomplete", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xdef");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "ACCEPTED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(adapter.lockEvidence("trace-1")).resolves.toEqual({
      id: "0xdef",
      submitted: true,
      finalized: false,
      message: "Transaction accepted; wait for finality before relying on state."
    });
  });

  it("does not mark a submitted transaction failed when finality polling times out", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xtimeout");
    client.waitForTransactionReceipt.mockRejectedValue(
      new Error(
        'Timed out waiting for transaction 0xtimeout to reach status "FINALIZED" (current status: 5).'
      )
    );
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(adapter.withdrawCredit("0x2222222222222222222222222222222222222222")).resolves.toEqual({
      id: "0xtimeout",
      submitted: true,
      finalized: false,
      message:
        "Transaction submitted; finality was not confirmed before the browser timeout. Reload canonical contract state before relying on it."
    });
  });

  it("does not mark a submitted transaction failed when the receipt is not indexed yet", async () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xabcdef");
    client.waitForTransactionReceipt.mockRejectedValue(
      new Error(
        "Requested resource not found. Details: Transaction 0xabcdef not found Version: viem@2.55.13"
      )
    );
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(
      adapter.createWorkflow({
        objective: "Ship a bounded workflow",
        poolGen: 2
      })
    ).resolves.toEqual({
      id: "0xabcdef",
      submitted: true,
      finalized: false,
      message:
        "Transaction submitted; the receipt was not indexed yet. Reload canonical contract state before relying on it. Canonical workflow ID: trace-9ix."
    });
  });

  it("uses 1 GEN for provider bond acceptance", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0x123");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await adapter.acceptStep({ workflowId: "trace-1", stepId: "step-build" });

    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "accept_step",
        args: ["trace-1", "step-build"],
        value: GEN
      })
    );
  });
});
