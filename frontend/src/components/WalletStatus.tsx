import { useEffect, useMemo, useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  detectInjectedWallet,
  discoverInjectedWallets,
  readAuthorizedWallet,
  shortenAddress,
  type WalletCandidate,
  type WalletEnvironment,
  walletRequestErrorMessage
} from "../adapters/wallet";
import { useWalletSession } from "./WalletSessionContext";

export function WalletStatus() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const environment = useMemo<WalletEnvironment>(
    () => (typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment)),
    []
  );
  const initialDetection = useMemo(() => detectInjectedWallet(environment), [environment]);
  const { address, label, setWalletSession, clearWalletSession } = useWalletSession();
  const [candidates, setCandidates] = useState<WalletCandidate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(initialDetection.label);

  useEffect(() => {
    let active = true;
    void discoverInjectedWallets(environment).then(async (results) => {
      if (!active) {
        return;
      }
      setCandidates(results);
      if (results.length === 0) {
        setStatusMessage("No browser wallet detected");
        return;
      }
      setStatusMessage(`${results[0].label} available`);
      for (const result of results) {
        try {
          const connection = await readAuthorizedWallet(result.provider);
          if (!active) {
            return;
          }
          if (connection.address) {
            setWalletSession({
              address: connection.address,
              provider: result.provider,
              label: result.label
            });
            setStatusMessage("Wallet connected");
            return;
          }
        } catch {
          if (!active) {
            return;
          }
        }
      }
    });
    return () => {
      active = false;
    };
  }, [environment, setWalletSession]);

  async function connectWallet() {
    const results = await discoverInjectedWallets(environment);
    setCandidates(results);
    if (results.length === 0) {
      setStatusMessage("No browser wallet detected");
      return;
    }
    setStatusMessage(`${results.length} wallet${results.length === 1 ? "" : "s"} detected`);
    setModalOpen(true);
  }

  async function selectWallet(candidate: WalletCandidate) {
    try {
      const result = await connectInjectedWallet(candidate.provider);
      if (result.address) {
        setWalletSession({
          address: result.address,
          provider: candidate.provider,
          label: candidate.label
        });
      }
      setStatusMessage(
        result.status === "connected" ? "Wallet connected" : "Wallet did not return an account"
      );
      setModalOpen(false);
    } catch (cause) {
      setStatusMessage(walletRequestErrorMessage(cause));
    }
  }

  function disconnectWallet() {
    clearWalletSession();
    setMenuOpen(false);
    setStatusMessage("Wallet disconnected");
  }

  return (
    <div className="wallet-status" aria-label="Wallet and network status">
      <span className="status-dot" aria-hidden="true" />
      <span>Studionet</span>
      {address ? (
        <span className="wallet-account">
          <button
            className="link-button mono"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {shortenAddress(address)}
          </button>
          {menuOpen && (
            <div className="account-menu">
              <span className="mono">{shortenAddress(address)}</span>
              <span>{label ? `${label} selected` : "Wallet selected"}</span>
              <span>GenLayer EVM ready for writes</span>
              <button className="button secondary" type="button" onClick={disconnectWallet}>
                Disconnect wallet
              </button>
            </div>
          )}
        </span>
      ) : (
        <button className="link-button" type="button" onClick={connectWallet}>
          Connect wallet
        </button>
      )}
      {runtime.mode === "preview" && <span>{runtime.reason}</span>}
      <span aria-live="polite">{statusMessage}</span>
      {modalOpen && (
        <div className="modal-backdrop">
          <section
            className="wallet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
          >
            <div className="stack">
              <div>
                <h2 id="wallet-modal-title">Connect wallet</h2>
                <p className="muted">Select an EVM wallet detected in this browser.</p>
              </div>
              <div className="wallet-options">
                {candidates.map((candidate) => (
                  <button
                    className="wallet-option"
                    type="button"
                    key={candidate.id}
                    onClick={() => void selectWallet(candidate)}
                  >
                    {candidate.label}
                  </button>
                ))}
              </div>
              <p className="muted">No wallet? Install or unlock an EVM wallet extension.</p>
              <div className="actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
