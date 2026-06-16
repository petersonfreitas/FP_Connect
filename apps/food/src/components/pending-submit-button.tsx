"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: string;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

export function PendingSubmitButton({
  children,
  className = "primary-action",
  disabled = false,
  pendingLabel = "Processando..."
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={disabled || pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
