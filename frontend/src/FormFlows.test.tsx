import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";

const mocks = vi.hoisted(() => {
  const finalized = {
    id: "0xabc",
    submitted: true,
    finalized: true,
    message: "Transaction finalized; reload canonical contract state."
  };
  const canonicalWorkflow = {
    id: "trace-1001",
    objective: "Canonical test workflow",
    sponsor: "0x1111111111111111111111111111111111111111",
    sponsorLabel: "Sponsor",
    role: "provider" as const,
    status: "OPEN" as const,
    poolGen: 2,
    nextAction: "Submit accepted evidence",
    consequence: "No finalized consequence.",
    steps: [
      {
        id: "step-plan",
        title: "Trip plan",
        provider: "0x2222222222222222222222222222222222222222",
        providerLabel: "Provider",
        promise: "Produce the plan",
        dependencies: [],
        feeGen: 1,
        bondGen: 1,
        accepted: true,
        evidenceUrl: "https://evidence.example/original-plan.json",
        digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        class: "PENDING" as const
      }
    ]
  };
  const adapter = {
    listWorkflows: vi.fn().mockResolvedValue([]),
    getWorkflow: vi.fn().mockResolvedValue(canonicalWorkflow),
    getCredits: vi.fn().mockResolvedValue({ address: "", totalAvailableGen: 0, lines: [] }),
    createWorkflow: vi.fn().mockResolvedValue(finalized),
    addStep: vi.fn().mockResolvedValue(finalized),
    activateWorkflow: vi.fn().mockResolvedValue(finalized),
    acceptStep: vi.fn().mockResolvedValue(finalized),
    submitEvidence: vi.fn().mockResolvedValue(finalized),
    lockEvidence: vi.fn().mockResolvedValue(finalized),
    requestReview: vi.fn().mockResolvedValue(finalized),
    retryReview: vi.fn().mockResolvedValue(finalized),
    cancelWorkflow: vi.fn().mockResolvedValue(finalized),
    withdrawCredit: vi.fn().mockResolvedValue(finalized)
  };
  return {
    adapter,
    canonicalWorkflow,
    createAdapter: vi.fn(() => adapter)
  };
});

vi.mock("./adapters/genlayerAdapter", () => ({
  createGenLayerTraceSettleAdapter: mocks.createAdapter
}));

describe("wallet-backed form payloads", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    vi.stubGlobal("ethereum", {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === "eth_accounts" || method === "eth_requestAccounts") {
          return ["0x2222222222222222222222222222222222222222"];
        }
        return undefined;
      })
    });
    vi.clearAllMocks();
    mocks.adapter.getWorkflow.mockResolvedValue(mocks.canonicalWorkflow);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("submits the objective typed by the sponsor with exactly 2 GEN", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const objective = screen.getByRole("textbox", { name: "Workflow objective" });
    await user.clear(objective);
    await user.type(objective, "Settle the edited workflow objective");
    await screen.findByRole("button", { name: "0x2222...2222" });
    await user.click(screen.getByRole("button", { name: "Submit workflow transaction" }));

    await waitFor(() =>
      expect(mocks.adapter.createWorkflow).toHaveBeenCalledWith({
        objective: "Settle the edited workflow objective",
        poolGen: 2
      })
    );
  });

  it("does not claim submission while wallet approval is still pending", async () => {
    mocks.adapter.createWorkflow.mockImplementationOnce(
      () => new Promise(() => undefined)
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await screen.findByRole("button", { name: "0x2222...2222" });
    await user.click(screen.getByRole("button", { name: "Submit workflow transaction" }));

    expect(await screen.findByText("Awaiting wallet")).toBeInTheDocument();
    expect(screen.queryByText("Submitted")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit workflow transaction" })).toBeDisabled();
  });

  it("submits the URL and digest typed by the accepted provider", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001/evidence/step-plan"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const artifactUrl = await screen.findByRole("textbox", { name: "Artifact URL" });
    const digest = screen.getByRole("textbox", { name: "Artifact digest" });
    await user.clear(artifactUrl);
    await user.type(artifactUrl, "https://evidence.example/edited-plan.json");
    await user.clear(digest);
    await user.type(
      digest,
      "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    await screen.findByRole("button", { name: "0x2222...2222" });
    await user.click(screen.getByRole("button", { name: "Submit evidence transaction" }));

    await waitFor(() =>
      expect(mocks.adapter.submitEvidence).toHaveBeenCalledWith({
        workflowId: "trace-1001",
        stepId: "step-plan",
        artifactUrl: "https://evidence.example/edited-plan.json",
        digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      })
    );
  });

  it("adds the sponsor's typed provider step to a canonical draft", async () => {
    mocks.adapter.getWorkflow.mockResolvedValue({
      ...mocks.canonicalWorkflow,
      role: "sponsor",
      status: "DRAFT",
      steps: []
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const stepId = await screen.findByRole("textbox", { name: "Step ID" });
    expect(screen.getByRole("button", { name: "Activate workflow" })).toBeDisabled();
    await user.type(stepId, "step-build");
    await user.type(
      screen.getByRole("textbox", { name: "Provider address" }),
      "0x3333333333333333333333333333333333333333"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Step promise" }),
      "Build the public artifact"
    );
    await user.type(screen.getByRole("textbox", { name: "Dependencies" }), "step-plan");
    const feeWeight = screen.getByRole("spinbutton", { name: "Fee weight" });
    await user.clear(feeWeight);
    await user.type(feeWeight, "2");
    await screen.findByRole("button", { name: "0x2222...2222" });
    await user.click(screen.getByRole("button", { name: "Add provider step" }));

    await waitFor(() =>
      expect(mocks.adapter.addStep).toHaveBeenCalledWith({
        workflowId: "trace-1001",
        stepId: "step-build",
        provider: "0x3333333333333333333333333333333333333333",
        promise: "Build the public artifact",
        dependencies: ["step-plan"],
        feeWeight: 2
      })
    );
  });

  it("activates a configured canonical draft", async () => {
    mocks.adapter.getWorkflow.mockResolvedValue({
      ...mocks.canonicalWorkflow,
      role: "sponsor",
      status: "DRAFT"
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const activate = await screen.findByRole("button", { name: "Activate workflow" });
    await screen.findByRole("button", { name: "0x2222...2222" });
    expect(activate).toBeEnabled();
    await user.click(activate);

    await waitFor(() =>
      expect(mocks.adapter.activateWorkflow).toHaveBeenCalledWith("trace-1001")
    );
  });

  it("binds canonical workflow reads to the already-authorized wallet account", async () => {
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(mocks.createAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          account: "0x2222222222222222222222222222222222222222",
          provider: (globalThis as typeof globalThis & { ethereum?: unknown }).ethereum
        })
      )
    );
  });
});
