import { Check } from "lucide-react";
import type { FieldId } from "./types";

export type FieldProps = {
  id: FieldId;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoComplete: string;
  type?: string;
  placeholder?: string;
  error?: string;
  touched?: boolean;
  optional?: boolean;
  autoFocus?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>["enterKeyHint"];
};

export function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  autoComplete,
  type = "text",
  placeholder,
  error,
  touched,
  optional,
  autoFocus,
  inputMode,
  enterKeyHint,
}: FieldProps) {
  const hasError = Boolean(touched && error);
  const isValid = Boolean(touched && !error && value.trim());
  const isEmail = type === "email";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center justify-between text-sm font-medium"
      >
        <span>{label}</span>
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            Opcional
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          // biome-ignore lint/a11y/noAutofocus: enfoque intencional al cambiar de paso
          autoFocus={autoFocus}
          autoCapitalize={isEmail ? "off" : undefined}
          autoCorrect={isEmail ? "off" : undefined}
          spellCheck={isEmail ? false : undefined}
          aria-invalid={hasError}
          aria-describedby={`${id}-error`}
          className={`w-full px-4 py-3 ${isValid ? "pr-11" : ""} rounded-xl bg-background text-foreground placeholder:text-muted-foreground border transition-all ${hasError
            ? "border-red-500 ring-1 ring-red-500"
            : "border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
            }`}
        />
        {isValid && (
          <Check
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 motion-scale-in-95 motion-duration-200"
            aria-hidden="true"
          />
        )}
      </div>
      <p
        id={`${id}-error`}
        role="alert"
        className="text-xs text-red-500 min-h-[1rem]"
      >
        {hasError ? error : ""}
      </p>
    </div>
  );
}
