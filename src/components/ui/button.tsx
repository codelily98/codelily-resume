import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({ className, variant = "secondary", size = "md", loading, children, disabled, ...props }: Props) {
  return (
    <button className={cn("button", `button-${variant}`, `button-${size}`, className)} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle aria-hidden="true" className="spin" size={16} /> : null}
      {children}
    </button>
  );
}
