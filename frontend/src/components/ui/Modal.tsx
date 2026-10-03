import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10201d]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-lg border border-line bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-base font-bold text-ink">{title}</h2><Button aria-label="Close dialog" variant="ghost" size="sm" onClick={onClose}><X aria-hidden="true" className="size-4" /></Button></header>
        <div className="p-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}