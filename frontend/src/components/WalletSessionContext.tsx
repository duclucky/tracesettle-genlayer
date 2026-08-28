import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Eip1193Provider } from "../adapters/wallet";

interface WalletSessionState {
  address?: `0x${string}`;
  provider?: Eip1193Provider;
  label?: string;
}

interface WalletSessionContextValue extends WalletSessionState {
  setWalletSession(session: Required<WalletSessionState>): void;
  clearWalletSession(): void;
}

const WalletSessionContext = createContext<WalletSessionContextValue | undefined>(undefined);

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSessionState>({});
  const setWalletSession = useCallback((nextSession: Required<WalletSessionState>) => {
    setSession(nextSession);
  }, []);
  const clearWalletSession = useCallback(() => {
    setSession({});
  }, []);

  const value = useMemo<WalletSessionContextValue>(
    () => ({
      ...session,
      setWalletSession,
      clearWalletSession
    }),
    [clearWalletSession, session, setWalletSession]
  );

  return (
    <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>
  );
}

export function useWalletSession() {
  const value = useContext(WalletSessionContext);
  if (!value) {
    throw new Error("useWalletSession must be used inside WalletSessionProvider");
  }
  return value;
}
