import { CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";

export type TransactionStage =
  | "idle"
  | "wallet"
  | "submitted"
  | "finalized"
  | "failed"
  | "retryable";

const stageCopy: Record<TransactionStage, { icon: typeof Clock; title: string; body: string }> = {
  idle: {
    icon: Clock,
    title: "Ready for wallet",
    body: "No transaction has been signed or submitted from this screen."
  },
  wallet: {
    icon: Clock,
    title: "Awaiting wallet",
    body: "Approve or reject the request in your wallet. No transaction is claimed yet."
  },
  submitted: {
    icon: Clock,
    title: "Submitted",
    body: "Wait for acceptance and finality before treating this as complete."
  },
  finalized: {
    icon: CheckCircle,
    title: "Finalized",
    body: "Canonical state should be reloaded from the contract."
  },
  failed: {
    icon: WarningCircle,
    title: "Failed",
    body: "The previous canonical state is preserved. Review the error and retry."
  },
  retryable: {
    icon: WarningCircle,
    title: "Retryable",
    body: "No penalty is applied. Fix evidence or cancel in a safe state."
  }
};

export function TransactionState({
  stage = "idle",
  message
}: {
  stage?: TransactionStage;
  message?: string;
}) {
  const copy = stageCopy[stage];
  const Icon = copy.icon;

  return (
    <aside className={`notice transaction-state transaction-state--${stage}`}>
      <strong>
        <Icon size={18} weight="bold" aria-hidden="true" /> {copy.title}
      </strong>
      <p>{message ?? copy.body}</p>
    </aside>
  );
}
