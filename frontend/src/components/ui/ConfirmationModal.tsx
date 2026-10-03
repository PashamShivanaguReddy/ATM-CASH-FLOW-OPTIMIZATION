import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({ open, title, message, confirmLabel, pending = false, destructive = false, onClose, onConfirm }: ConfirmationModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-6 text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={pending}>{pending ? "Working…" : confirmLabel}</Button>
      </div>
    </Modal>
  );
}