import { cn } from "@/lib/utils";

export function FieldWrap({
  label,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="ml-0.5 text-blood">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-ash-faint">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  required,
  className,
  ...props
}: { label?: string; hint?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrap label={label} hint={hint} required={required} className={className}>
      <input className="field" {...props} />
    </FieldWrap>
  );
}

export function TextArea({
  label,
  hint,
  required,
  className,
  ...props
}: { label?: string; hint?: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrap label={label} hint={hint} required={required} className={className}>
      <textarea className={cn("field min-h-[120px] resize-y")} {...props} />
    </FieldWrap>
  );
}

export function SelectField({
  label,
  hint,
  required,
  className,
  options,
  ...props
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  options: readonly string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrap label={label} hint={hint} required={required} className={className}>
      <select className="field" {...props}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full border transition-colors",
          checked ? "border-blood/60 bg-blood/40" : "border-line bg-ink-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-zinc-100 transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-sm text-ash">{label}</span>}
    </button>
  );
}
