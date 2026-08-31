import { ArrowLeft, Check, ChevronRight, Loader2, Lock } from 'lucide-react'

import { BudgetPicker } from './contact/BudgetPicker'
import { CalEmbed } from './contact/CalEmbed'
import { Field } from './contact/Field'
import { ProgressBar } from './contact/ProgressBar'
import { COMPANY_SIZE_OPTIONS, SOLUTION_TYPE_OPTIONS, URGENCY_OPTIONS } from './contact/types'
import { useContactForm } from './contact/useContactForm'

const TOTAL_STEPS = 2

export default function ContactForm() {
  const {
    step,
    status,
    errorMessage,
    stepDirection,
    fieldErrors,
    touched,
    formData,
    submittedLeadId,
    dedupeKey,
    handleChange,
    handleBlur,
    handleFieldFocus,
    handleStep1KeyDown,
    selectBudget,
    selectCompanySize,
    selectSolutionType,
    selectUrgency,
    nextStep,
    prevStep,
    handleSubmit,
  } = useContactForm()

  if (step === 3) {
    return (
      <CalEmbed
        name={formData.name}
        email={formData.email}
        leadId={submittedLeadId}
        dedupeKey={dedupeKey}
      />
    )
  }

  return (
    <div className="relative w-full overflow-hidden p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot anti-spam — off-screen, no display:none para que los bots lo rellenen */}
        <input
          type="text"
          name="website"
          className="pointer-events-none absolute -top-[9999px] -left-[9999px] h-px w-px opacity-0"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <div
            key="step-1"
            className={`motion-safe:animate-in motion-safe:fade-in w-full motion-safe:duration-300 motion-safe:ease-out ${
              stepDirection === 1
                ? 'motion-safe:slide-in-from-right-4'
                : 'motion-safe:slide-in-from-left-4'
            }`}
          >
            <div className="grid lg:grid-cols-2 lg:gap-6">
              <Field
                id="name"
                label="Nombre completo"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFieldFocus}
                onKeyDown={handleStep1KeyDown}
                placeholder="Ej. Pol Gubau"
                autoComplete="name"
                enterKeyHint="next"
                error={fieldErrors.name}
                touched={touched.name}
              />

              <Field
                id="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFieldFocus}
                onKeyDown={handleStep1KeyDown}
                placeholder="pol@doscientos.es"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                error={fieldErrors.email}
                touched={touched.email}
              />
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="bg-primary text-background flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold transition-all hover:opacity-90"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            key="step-2"
            className={`motion-safe:animate-in motion-safe:fade-in space-y-4 motion-safe:duration-300 motion-safe:ease-out ${
              stepDirection === 1
                ? 'motion-safe:slide-in-from-right-4'
                : 'motion-safe:slide-in-from-left-4'
            }`}
          >
            <Field
              id="phone"
              type="tel"
              label="Teléfono"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFieldFocus}
              placeholder="666 123 456"
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="send"
              autoFocus
              error={fieldErrors.phone}
              touched={touched.phone}
            />

            <Field
              id="company"
              label="Empresa / Sector"
              value={formData.company}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej. Tecnología / E-commerce"
              autoComplete="organization"
              enterKeyHint="send"
              optional
            />

            <div className="space-y-1.5">
              <label
                htmlFor="solutionType"
                className="text-foreground flex items-center justify-between text-sm font-medium"
              >
                <span>¿Qué necesitas resolver?</span>
                <span className="text-xs font-normal">Opcional</span>
              </label>
              <select
                id="solutionType"
                name="solutionType"
                value={formData.solutionType}
                onChange={(e) => selectSolutionType(e.target.value)}
                onFocus={handleFieldFocus}
                className="border-muted-foreground/30 bg-background text-foreground focus:border-primary focus:ring-primary h-12 w-full rounded-xl border px-4 text-sm transition-all focus:ring-1"
              >
                <option value="">Selecciona una opción</option>
                {SOLUTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="companySize"
                className="text-foreground flex items-center justify-between text-sm font-medium"
              >
                <span>Tamaño de empresa</span>
                <span className="text-xs font-normal">Opcional</span>
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={(e) => selectCompanySize(e.target.value)}
                onFocus={handleFieldFocus}
                className="border-muted-foreground/30 bg-background text-foreground focus:border-primary focus:ring-primary h-12 w-full rounded-xl border px-4 text-sm transition-all focus:ring-1"
              >
                <option value="">Selecciona un rango</option>
                {COMPANY_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="urgency"
                className="text-foreground flex items-center justify-between text-sm font-medium"
              >
                <span>¿Cuándo quieres empezar?</span>
                <span className="text-xs font-normal">Opcional</span>
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={(e) => selectUrgency(e.target.value)}
                onFocus={handleFieldFocus}
                className="border-muted-foreground/30 bg-background text-foreground focus:border-primary focus:ring-primary h-12 w-full rounded-xl border px-4 text-sm transition-all focus:ring-1"
              >
                <option value="">Selecciona una opción</option>
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <BudgetPicker value={formData.budget} onSelect={selectBudget} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={prevStep}
                aria-label="Volver al paso anterior"
                className="border-muted-foreground/30 text-foreground hover:bg-muted/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-semibold transition-all sm:w-auto sm:px-6"
              >
                <ArrowLeft className="h-5 w-5 sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                aria-busy={status === 'loading'}
                className="bg-primary text-background flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 font-semibold whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                {status === 'loading' ? 'Enviando...' : 'Confirmar y agendar'}
              </button>
            </div>
            {status === 'error' && (
              <p
                role="alert"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500"
              >
                {errorMessage}
              </p>
            )}

            <p className="text-muted-foreground flex items-center justify-center gap-1.5 pt-1 text-xs">
              <Lock className="size-3" aria-hidden="true" />
              Tus datos están seguros. Sin spam ni compromiso.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
