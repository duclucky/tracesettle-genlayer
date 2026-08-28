import { ArrowRight, ClipboardText } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function EntryPage() {
  return (
    <section className="page hero-page">
      <div className="hero-intro">
        <div className="hero-copy page-header">
          <span className="page-kicker">Agent workflow settlement</span>
          <h1>Settle the failed workflow</h1>
          <p className="lead">
            TraceSettle helps sponsors and providers resolve multi-step agent failures from
            bounded evidence, not from one operator's blame report.
          </p>
        </div>
        <aside className="hero-signal-card" aria-label="Canonical workflow signal">
          <div className="signal-card__head">
            <span>Canonical workflow signal</span>
            <span className="mono">//01</span>
          </div>
          <p className="signal-card__title">Evidence first. Settlement final.</p>
          <p className="muted">Open the inbox to read the deployed contract state.</p>
          <svg className="signal-wave" viewBox="0 0 220 50" aria-hidden="true">
            <path
              d="M0 30 C10 30 12 45 18 45 C24 45 26 10 34 10 C42 10 44 40 52 40 C60 40 62 5 70 5 C78 5 80 42 88 42 C96 42 98 15 106 15 C114 15 116 38 124 38 C132 38 134 20 142 20 C150 20 152 35 160 35 C168 35 170 22 178 22 C186 22 188 32 196 32 C204 32 210 28 220 28"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </aside>
      </div>

      <div className="grid two hero-role-grid">
        <section className="panel stack">
          <h2>Start as sponsor</h2>
          <p className="muted">
            Create a bounded workflow, fund 2 GEN, lock providers and promises, then
            request neutral review after evidence is ready.
          </p>
          <div className="actions">
            <Link className="button primary" to="/workflows/new">
              Create workflow <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link className="button secondary" to="/workflows">
              Open inbox
            </Link>
          </div>
        </section>

        <section className="panel stack">
          <h2>Work as provider</h2>
          <p className="muted">
            Review assigned steps, post a 1 GEN bond, submit artifact evidence, and
            withdraw canonical credit after settlement.
          </p>
          <div className="actions">
            <Link className="button primary" to="/workflows/trace-1001/evidence/step-build">
              Review assigned steps
              <ClipboardText size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
