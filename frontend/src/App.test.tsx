import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";
import type { WalletEnvironment } from "./adapters/wallet";

let walletAnnouncementController: AbortController | undefined;

const routeHeadings = [
  ["/", "Settle the failed workflow"],
  ["/workflows", "Workflow inbox"],
  ["/workflows/new", "Create workflow"],
  ["/workflows/trace-1001", "Workflow room"],
  ["/workflows/trace-1001/evidence/step-build", "Submit evidence"],
  ["/credits", "Credits"],
  ["/settings", "Wallet and network"],
  ["/help", "Verification guide"]
] as const;

describe("TraceSettle route map", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "");
  });

  afterEach(() => {
    walletAnnouncementController?.abort();
    walletAnnouncementController = undefined;
    window.sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(routeHeadings)("renders %s as %s", (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: heading
      })
    ).toBeInTheDocument();
  });

  it("keeps navigation accessible from task routes", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const navigation = screen.getByRole("dialog", { name: "Primary navigation" });
    expect(within(navigation).getByRole("link", { name: "Workflows" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Credits" })).toBeInTheDocument();
  });

  it("exposes primary navigation directly in the topbar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(within(navigation).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(navigation).getByRole("link", { name: "Workflows" })).toHaveAttribute(
      "href",
      "/workflows"
    );
    expect(within(navigation).getByRole("link", { name: "Credits" })).toHaveAttribute(
      "href",
      "/credits"
    );
    expect(within(navigation).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(within(navigation).getByRole("link", { name: "Help" })).toHaveAttribute(
      "href",
      "/help"
    );
  });

  it("renders the refreshed TraceSettle logo mark", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const brand = screen.getByRole("link", { name: "TraceSettle home" });
    expect(within(brand).getByTestId("tracesettle-logo-mark")).toBeInTheDocument();
    expect(within(brand).getByText("TraceSettle")).toBeInTheDocument();
  });

  it("opens the Terranova navigation drawer and preserves route links", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const navigation = screen.getByRole("dialog", { name: "Primary navigation" });
    expect(navigation).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Workflows" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog", { name: "Primary navigation" })).not.toBeInTheDocument();
  });

  it("closes the navigation drawer with Escape", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Primary navigation" })).not.toBeInTheDocument();
  });

  it("renders the Terranova hero composition without changing product CTAs", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Settle the failed workflow" })).toBeInTheDocument();
    expect(screen.getByText("Canonical workflow signal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create workflow/ })).toHaveAttribute("href", "/workflows/new");
    expect(screen.getByRole("link", { name: /Open inbox/ })).toHaveAttribute("href", "/workflows");
    expect(screen.getByRole("link", { name: "Review assigned steps" })).toHaveAttribute(
      "href",
      "/workflows"
    );
  });

  it("renders the Terranova video backdrop and liquid glass primitives", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId("terranova-video-backdrop")).toHaveAttribute(
      "src",
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4"
    );
    expect(document.getElementById("liquid-glass-refraction")).toBeInTheDocument();
    expect(screen.getByLabelText("Live settlement signal")).toBeInTheDocument();
    expect(screen.getByText("Canonical workflow signal")).toBeInTheDocument();
  });

  it("uses the editorial layout on internal screens", () => {
    const inbox = render(
      <MemoryRouter initialEntries={["/workflows"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Workflow inbox" }).closest("section")).toHaveClass(
      "editorial-page"
    );

    inbox.unmount();
    render(
      <MemoryRouter initialEntries={["/credits"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Credits" }).closest("section")).toHaveClass(
      "editorial-page"
    );
  });

  it("marks the application shell with the Terranova visual system", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId("terranova-shell")).toBeInTheDocument();
  });

  it("keeps wallet and lifecycle feedback as distinct Terranova surfaces", () => {
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Wallet and network status")).toHaveClass(
      "terranova-wallet-status"
    );
    expect(screen.getAllByText("Ready for wallet")[0].closest("aside")).toHaveClass(
      "transaction-state"
    );
  });

  it("does not present the fixture wallet as a real connected account", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.queryByText("0x742d...f44e")).not.toBeInTheDocument();
    expect(screen.getByText("Missing VITE_CONTRACT_ADDRESS")).toBeInTheDocument();
    expect(screen.getByText("No browser wallet detected")).toBeInTheDocument();
  });

  it("keeps one missing-wallet status after Connect wallet is pressed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(screen.getAllByText("No browser wallet detected")).toHaveLength(1);
    expect(screen.getByText("No browser wallet detected")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });

  it("opens wallet selection and connects only the chosen provider", async () => {
    const okxRequest = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return [];
      }
      if (method === "eth_requestAccounts") {
        return ["0x1111111111111111111111111111111111111111"];
      }
      return undefined;
    });
    const rabbyRequest = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return [];
      }
      if (method === "eth_requestAccounts") {
        return ["0x2222222222222222222222222222222222222222"];
      }
      return undefined;
    });
    const okxProvider = { request: okxRequest };
    const rabbyProvider = { request: rabbyRequest };
    walletAnnouncementController = new AbortController();
    window.addEventListener("eip6963:requestProvider", () => {
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info: { name: "OKX Wallet" }, provider: okxProvider }
        })
      );
    }, { signal: walletAnnouncementController.signal });
    vi.stubGlobal("rabby", rabbyProvider);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(await screen.findByRole("dialog", { name: "Connect wallet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rabby" }));

    expect(rabbyRequest).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(rabbyRequest).toHaveBeenCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf22f" }]
    });
    expect(okxRequest).not.toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(await screen.findByRole("button", { name: "0x2222...2222" })).toBeInTheDocument();
  });

  it("disconnects the visible wallet from the account menu", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
      }
      return undefined;
    });
    vi.stubGlobal("ethereum", { request });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "0xC495...8272" }));
    await user.click(screen.getByRole("button", { name: "Disconnect wallet" }));

    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.getByText("Wallet disconnected")).toHaveAttribute("aria-live", "polite");
  });

  it("does not auto-restore after explicit disconnect even when the provider remains authorized", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
      }
      return undefined;
    });
    vi.stubGlobal("ethereum", { request });

    const user = userEvent.setup();
    const app = render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "0xC495...8272" }));
    await user.click(screen.getByRole("button", { name: "Disconnect wallet" }));

    app.unmount();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await new Promise((resolve) => setTimeout(resolve, 160));
    expect(await screen.findByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "0xC495...8272" })).not.toBeInTheDocument();
  });

  it("keeps wallet choice pending after disconnect until the user selects a provider", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts" || method === "eth_requestAccounts") {
        return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
      }
      return undefined;
    });
    vi.stubGlobal("ethereum", { name: "Browser wallet", request });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "0xC495...8272" }));
    await user.click(screen.getByRole("button", { name: "Disconnect wallet" }));
    await user.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(await screen.findByRole("dialog", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "0xC495...8272" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browser wallet" }));

    expect(await screen.findByRole("button", { name: "0xC495...8272" })).toBeInTheDocument();
  });

  it("shows a plain provider rejection in the single wallet status", async () => {
    vi.stubGlobal("ethereum", {
      request: vi.fn().mockRejectedValue({
        code: 4001,
        message: "OKX Wallet is locked"
      })
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));
    await user.click(await screen.findByRole("button", { name: "Browser wallet" }));

    expect(await screen.findByText("OKX Wallet is locked")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });

  it("closes the wallet picker without connecting when network switching fails", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return [];
      }
      if (method === "eth_requestAccounts") {
        return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
      }
      if (method === "wallet_switchEthereumChain") {
        throw new Error("GenLayer Studionet switch failed");
      }
      return undefined;
    });
    vi.stubGlobal("ethereum", { name: "Browser wallet", request });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Connect wallet" }));
    await user.click(await screen.findByRole("button", { name: "Browser wallet" }));

    expect(screen.queryByRole("dialog", { name: "Connect wallet" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "0xC495...8272" })).not.toBeInTheDocument();
    expect(await screen.findByText("GenLayer Studionet switch failed")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });

  it("restores an already-authorized wallet account after reload", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") {
        return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
      }
      if (method === "eth_requestAccounts") {
        throw new Error("unexpected wallet prompt");
      }
      return undefined;
    });
    vi.stubGlobal("ethereum", { request });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("0xC495...8272")).toBeInTheDocument();
    expect(screen.getByText("Wallet connected")).toHaveAttribute("aria-live", "polite");
    expect(request.mock.calls[0][0]).toEqual({ method: "eth_accounts" });
  });

  it("shows all canonical workflow rows by default and exposes filter state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByText(
        "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Settle a DAO scheduler workflow after one provider introduced a material fault."
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Settled" }));

    expect(screen.getByRole("button", { name: "Settled" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByText(
        "Settle a DAO scheduler workflow after one provider introduced a material fault."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes."
      )
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelled" }));

    expect(screen.getByRole("heading", { name: "No workflows yet" })).toBeInTheDocument();
  });

  it("blocks workflow creation until the objective is present", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const objective = screen.getByRole("textbox", { name: "Workflow objective" });
    const submit = screen.getByRole("button", { name: "Submit workflow transaction" });
    expect(submit).toBeEnabled();

    await user.clear(objective);
    expect(submit).toBeDisabled();

    await user.type(objective, "Settle a bounded provider workflow");
    expect(submit).toBeEnabled();
  });

  it("requires step acceptance and valid evidence before submission", async () => {
    const user = userEvent.setup();
    const evidenceBuild = render(
      <MemoryRouter initialEntries={["/workflows/trace-1001/evidence/step-build"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Accept step with 1 GEN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit evidence transaction" })).toBeDisabled();

    evidenceBuild.unmount();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001/evidence/step-plan"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const artifactUrl = screen.getByRole("textbox", { name: "Artifact URL" });
    const digest = screen.getByRole("textbox", { name: "Artifact digest" });
    const submit = screen.getByRole("button", { name: "Submit evidence transaction" });
    expect(submit).toBeEnabled();

    await user.clear(artifactUrl);
    expect(submit).toBeDisabled();
    await user.type(artifactUrl, "https://evidence.example/plan.json");
    await user.clear(digest);
    expect(submit).toBeDisabled();
    await user.type(digest, "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(submit).toBeEnabled();
  });

  it("shows only legal workflow actions for the current role and state", () => {
    const workflowOpen = render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Lock evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel safely" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request review" })).not.toBeInTheDocument();

    workflowOpen.unmount();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-0998"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "Lock evidence" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel safely" })).not.toBeInTheDocument();
  });

  it("does not expose preview workflows or credits while live reads are pending", () => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    const inbox = render(
      <MemoryRouter initialEntries={["/workflows"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(
        "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes."
      )
    ).not.toBeInTheDocument();

    inbox.unmount();
    const creditView = render(
      <MemoryRouter initialEntries={["/credits"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "0 GEN available" })).toBeInTheDocument();
    expect(screen.queryByText("Returned provider bond")).not.toBeInTheDocument();

    creditView.unmount();
    const workflowRoom = render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText("Waiting for canonical workflow state.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock evidence" })).not.toBeInTheDocument();

    workflowRoom.unmount();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001/evidence/step-plan"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.queryByRole("textbox", { name: "Artifact URL" })).not.toBeInTheDocument();
  });

  it("surfaces a wallet rejection during canonical credit reads", async () => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    vi.stubGlobal("ethereum", {
      request: vi.fn().mockRejectedValue({
        code: 4001,
        message: "Credit read wallet request denied"
      })
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/credits"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Read canonical credits" }));

    expect(await screen.findByText("Credit read wallet request denied")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "0 GEN available" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit withdrawal" })).toBeDisabled();
  });

  it("disables live write controls until a wallet is selected", async () => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    vi.stubGlobal("ethereum", {
      request: vi.fn().mockResolvedValue([])
    });
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Submit workflow transaction" })).toBeDisabled();
    expect(
      screen.getByText("Connect wallet before signing. No transaction has been submitted.")
    ).toBeInTheDocument();
  });

  it("refreshes live write feedback after an authorized wallet is restored", async () => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    vi.stubGlobal("ethereum", {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === "eth_accounts") {
          return ["0xC495ef51618D03267A1f227aFe5b27B38c748272"];
        }
        return undefined;
      })
    });
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await screen.findByRole("button", { name: "0xC495...8272" });

    expect(screen.getByRole("button", { name: "Submit workflow transaction" })).toBeEnabled();
    await waitFor(() => {
      expect(
        screen.getByText("No transaction has been signed from this control.")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Connect wallet before signing. No transaction has been submitted.")
      ).not.toBeInTheDocument();
    });
  });

  it("blocks live actions honestly until a contract address is configured", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Submit workflow transaction" }));

    expect(
      screen.getByText("Missing VITE_CONTRACT_ADDRESS. Configure a deployed contract before signing.")
    ).toBeInTheDocument();
  });
});
