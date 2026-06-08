// Auth/session React context — single source of truth for who's logged in and
// whether the visitor is OTP-verified (tools unlocked).
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "@wpx/types";
import { me as fetchMe, logout as apiLogout, type Me } from "./auth";

interface SessionState {
  loading: boolean;
  role: Role | null;
  name: string | null;
  verified: boolean;
  me: Me | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setMe(await fetchMe());
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function signOut() {
    await apiLogout().catch(() => {});
    await refresh();
  }

  return (
    <Ctx.Provider
      value={{ loading, me, role: me?.session?.role ?? null, name: me?.user?.name ?? null, verified: !!me?.verified, refresh, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
