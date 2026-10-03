import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleAlert, X } from "lucide-react";

type ToastTone = "success" | "error";
interface ToastValue {
  message: string;
  tone: ToastTone;
  id: number;
}
interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastValue | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastTone = "success") => setToast({ message, tone, id: ++nextId.current });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div role={toast.tone === "error" ? "alert" : "status"} className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-xl">
          {toast.tone === "success" ? <Check aria-hidden="true" className="size-4 shrink-0 text-moss" /> : <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-coral" />}
          <span>{toast.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)} className="ml-1 text-muted hover:text-ink"><X aria-hidden="true" className="size-4" /></button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}