type ProgressBarProps = {
  step: number
  totalSteps: number
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  return (
    <div className="mb-8 space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
        <span>
          Paso {step} de {totalSteps}
        </span>
        <span>{Math.round((step / totalSteps) * 100)}%</span>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              step >= i + 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
