import { useState } from "react";
import { LiveTraceSettleAction } from "../components/LiveTraceSettleAction";
import { TransactionState } from "../components/TransactionState";

const defaultObjective =
  "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes.";

export function NewWorkflowPage() {
  const [objective, setObjective] = useState(defaultObjective);
  const objectiveValid = objective.trim().length > 0;

  return (
    <section className="page editorial-page">
      <div className="page-header">
        <span className="page-kicker">Sponsor setup</span>
        <h1>Create workflow</h1>
        <p className="lead">
          Define the objective and fund the fixed 2 GEN pool before adding provider steps
          to the draft workflow.
        </p>
      </div>

      <div className="grid two">
        <form className="form-panel field-grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Workflow objective
            <textarea
              name="objective"
              required
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              aria-describedby="objective-help"
            />
          </label>
          <p className="muted" id="objective-help">
            Objective is required and is sent exactly as shown after trimming whitespace.
          </p>
          <label>
            Sponsor pool
            <select defaultValue="2" aria-label="Sponsor pool">
              <option value="2">2 GEN</option>
            </select>
          </label>
          <LiveTraceSettleAction
            className="button primary"
            disabled={!objectiveValid}
            action={(adapter) =>
              adapter.createWorkflow({
                objective: objective.trim(),
                poolGen: 2
              })
            }
          >
            Submit workflow transaction
          </LiveTraceSettleAction>
        </form>
        <section className="panel stack">
          <h2>Setup checks</h2>
          <p className="muted">
            The frontend validates missing fields and obvious DAG errors, then the contract
            remains authoritative after wallet submission.
          </p>
          <TransactionState />
        </section>
      </div>
    </section>
  );
}
