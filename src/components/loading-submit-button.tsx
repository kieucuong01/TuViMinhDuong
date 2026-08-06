"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

type LoadingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loadingText?: string;
  confirmMessage?: string;
  children: ReactNode;
};

export function LoadingSubmitButton({ loadingText = "Đang xử lý...", confirmMessage, children, className, disabled, onClick, ...props }: LoadingSubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  }

  return (
    <button {...props} className={pending ? `${className || ""} is-loading`.trim() : className} type="submit" disabled={disabled || pending} aria-busy={pending} onClick={handleClick}>
      {pending ? loadingText : children}
    </button>
  );
}
