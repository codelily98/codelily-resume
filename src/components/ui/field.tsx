import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Field({ label, hint, error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <label className={cn("field", className)} htmlFor={id}>
      <span className="field-label">{label}</span>
      <input className={cn("input", error && "input-error")} id={id} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, hint, error, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <label className={cn("field", className)} htmlFor={id}>
      <span className="field-label">{label}</span>
      <textarea className={cn("input textarea", error && "input-error")} id={id} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function SelectField({ label, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  const id = props.id ?? props.name;
  return (
    <label className={cn("field", className)} htmlFor={id}>
      <span className="field-label">{label}</span>
      <select className="input select" id={id} {...props}>
        <option value="">선택</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
