import { resolveRuntimeConfig } from "../adapters/runtimeConfig";

export function SettingsPage() {
  const runtime = resolveRuntimeConfig(import.meta.env);

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">Connection truth</span>
        <h1>Wallet and network</h1>
        <p className="lead">
          TraceSettle uses Studionet and browser wallet signing. Private keys never belong
          in frontend code or public environment variables.
        </p>
      </div>

      <div className="grid two">
        <section className="panel stack">
          <h2>Wallet connection</h2>
          <p className="mono">Browser wallet required</p>
          <p className="muted">
            The app requests an injected wallet at action time. It does not ship a fixture
            account or private key.
          </p>
        </section>
        <section className={`panel stack ${runtime.contractAddress ? "" : "danger-note"}`}>
          <h2>Contract address</h2>
          <p className="mono">{runtime.contractAddress || runtime.reason}</p>
          <p className="muted">
            Missing configuration is shown honestly until a Studionet deployment is verified.
          </p>
        </section>
        <section className="panel stack">
          <h2>Network endpoints</h2>
          <p className="mono">GenLayer IC RPC: {runtime.genlayerRpcUrl}</p>
          <p className="mono">EVM wallet RPC: {runtime.evmRpcUrl}</p>
          <p className="muted">
            Browser reads use the same-origin GenLayer RPC proxy. Wallet transactions
            use the GenLayer Studionet RPC through the selected EVM wallet provider.
          </p>
        </section>
      </div>
    </section>
  );
}
