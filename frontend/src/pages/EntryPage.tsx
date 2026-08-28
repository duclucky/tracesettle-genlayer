import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { GlassSignalCard } from "../components/GlassSignalCard";

export function EntryPage() {
  return (
    <section className="page hero-page">
      <div className="rule rule--left" aria-hidden="true">
        <span className="rule__seg rule__seg--end" />
        <span className="rule__plus">+</span>
        <span className="rule__seg rule__seg--mid" />
        <span className="rule__plus">+</span>
        <span className="rule__seg rule__seg--end" />
      </div>
      <div className="rule rule--right" aria-hidden="true">
        <span className="rule__seg rule__seg--end" />
        <span className="rule__plus">+</span>
        <span className="rule__seg rule__seg--mid" />
        <span className="rule__plus">+</span>
        <span className="rule__seg rule__seg--end" />
      </div>

      <div className="hero-bottom">
        <div className="lede">
          <span className="page-kicker">Agent workflow settlement</span>
          <h1 className="lede__title" aria-label="Settle the failed workflow">
            Settle the<br /> failed workflow
          </h1>
          <p className="lede__body">
            TraceSettle helps sponsors and providers resolve multi-step agent failures from
            bounded evidence, not from one operator's blame report.
          </p>
          <div className="actions">
            <Link className="chamfer" to="/workflows/new">
              <span className="chamfer__glass" aria-hidden="true" />
              <svg
                className="chamfer__outline"
                viewBox="0 0 260 48"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points="14,0 260,0 260,34 246,48 0,48 0,14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span className="chamfer__label">Create workflow</span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link className="button secondary hero-secondary" to="/workflows">
              Open inbox
            </Link>
          </div>
        </div>
        <GlassSignalCard />
      </div>
    </section>
  );
}
