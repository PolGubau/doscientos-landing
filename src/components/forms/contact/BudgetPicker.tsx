import { BUDGET_OPTIONS } from './types'

type BudgetPickerProps = {
  value: string
  onSelect: (value: string) => void
}

export function BudgetPicker({ value, onSelect }: BudgetPickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-foreground flex w-full items-center justify-between text-sm font-medium">
        <span>Presupuesto estimado</span>
        <span className="text-muted-foreground text-xs font-normal">Opcional</span>
      </legend>
      {/* Móvil: select nativo (picker del sistema) */}
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="border-muted-foreground/30 bg-background text-foreground focus:border-primary focus:ring-primary h-12 w-full rounded-xl border px-4 text-sm transition-all focus:ring-1 sm:hidden"
      >
        <option value="">Selecciona un rango</option>
        {BUDGET_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Desktop: chips de selección rápida */}
      <div className="hidden flex-wrap gap-2 sm:flex">
        {BUDGET_OPTIONS.map((option) => {
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? '' : option)}
              className={`rounded-full border px-3.5 py-2 text-sm transition-all ${
                selected
                  ? 'bg-primary text-background border-primary font-medium'
                  : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/60 hover:text-foreground hover:bg-muted/20'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
