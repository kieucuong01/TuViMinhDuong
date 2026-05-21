"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loadingText?: string;
  children: ReactNode;
};

export function LoadingSubmitButton({ loadingText = "Đang xử lý...", children, className, disabled, ...props }: LoadingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button {...props} className={pending ? `${className || ""} is-loading`.trim() : className} type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? loadingText : children}
    </button>
  );
}
