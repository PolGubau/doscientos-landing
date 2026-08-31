import { Check } from 'lucide-react'

import type { FieldId } from './types'

export type FieldProps = {
  id: FieldId
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  autoComplete: string
  type?: string
  placeholder?: string
  error?: string
  touched?: boolean
  optional?: boolean
  autoFocus?: boolean
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
}

export function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  autoComplete,
  type = 'text',
  placeholder,
  error,
  touched,
  optional,
  autoFocus,
  inputMode,
  enterKeyHint,
}: FieldProps) {
  const hasError = Boolean(touched && error)
  const isValid = Boolean(touched && !error && value.trim())
  const isEmail = type === 'email'

  return (
    <div className="group space-y-1.5">
      <label
        htmlFor={id}
        className="text-muted-foreground group-has-[:focus-visible]:text-primary flex items-center justify-between text-sm font-medium transition-colors"
      >
        <span>{label}</span>
        {optional && <span className="text-muted-foreground text-xs font-normal">Opcional</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          // biome-ignore lint/a11y/noAutofocus: enfoque intencional al cambiar de paso
          autoFocus={autoFocus}
          autoCapitalize={isEmail ? 'off' : undefined}
          autoCorrect={isEmail ? 'off' : undefined}
          spellCheck={isEmail ? false : undefined}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`h-12 w-full px-4 ${isValid ? 'pr-11' : ''} bg-background text-foreground placeholder:text-muted-foreground rounded-xl border transition-all ${
            hasError
              ? 'border-red-500 ring-1 ring-red-500'
              : isValid
                ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                : 'border-muted-foreground/30 focus:border-primary focus:ring-primary focus:ring-1'
          }`}
        />
        {isValid && (
          <Check
            className="motion-scale-in-95 motion-duration-200 absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-green-500"
            aria-hidden="true"
          />
        )}
      </div>
      {hasError && (
        <p id={`${id}-error`} role="alert" className="min-h-[1rem] text-xs text-red-500">
          {error}
        </p>
      )}
      {!hasError && <div className="min-h-[1rem]" aria-hidden="true" />}
    </div>
  )
}
