import { BUDGET_OPTIONS } from "./types";

type BudgetPickerProps = {
  value: string;
  onSelect: (value: string) => void;
};

export function BudgetPicker({ value, onSelect }: BudgetPickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-center justify-between text-sm font-medium">
        <span>Presupuesto estimado</span>
        <span className="text-xs font-normal text-muted-foreground">
          Opcional
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {BUDGET_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? "" : option)}
              className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
                selected
                  ? "bg-primary text-background border-primary font-medium"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-primary/60 hover:text-foreground hover:bg-muted/20"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
