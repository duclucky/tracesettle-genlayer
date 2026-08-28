export function HelpPage() {
  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">Verification guide</span>
        <h1>Verification guide</h1>
        <p className="lead">
          Validators inspect bounded provider artifacts against locked step promises.
          Missing or unverifiable objective evidence is retryable and non-penalizing.
        </p>
      </div>

      <div className="grid three">
        <section className="panel stack">
          <h2>What validators inspect</h2>
          <p className="muted">
            The workflow objective, step promises, dependencies, fetched artifact content,
            digest binding, and bounded verdict schema.
          </p>
        </section>
        <section className="panel stack">
          <h2>What settlement means</h2>
          <p className="muted">
            A finalized verdict opens fee, bond, refund, compensation, or withdrawal credit
            according to deterministic rules.
          </p>
        </section>
        <section className="panel stack">
          <h2>What V1 does not prove</h2>
          <p className="muted">
            It does not prove legal liability, private evidence, external service quality,
            adoption, or offchain execution beyond the submitted artifact.
          </p>
        </section>
      </div>
    </section>
  );
}
