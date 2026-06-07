// Tiny UI context so any component (header, calculator CTA) can pop the AuthDialog.
import { createContext, useContext, useState, type ReactNode } from "react";
import { AuthDialog } from "../components/AuthDialog";

const Ctx = createContext<{ open: () => void } | null>(null);

export function AuthUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {open && <AuthDialog onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

export function useAuthUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuthUI outside provider");
  return v;
}
