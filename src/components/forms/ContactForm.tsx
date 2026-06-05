import { ArrowLeft, Check, ChevronRight, Loader2, Lock } from "lucide-react";
import { BudgetPicker } from "./contact/BudgetPicker";
import { CalEmbed } from "./contact/CalEmbed";
import { Field } from "./contact/Field";
import { ProgressBar } from "./contact/ProgressBar";
import { useContactForm } from "./contact/useContactForm";

const TOTAL_STEPS = 2;

export default function ContactForm() {
  const {
    step,
    status,
    errorMessage,
    stepDirection,
    fieldErrors,
    touched,
    formData,
    handleChange,
    handleBlur,
    handleStep1KeyDown,
    selectBudget,
    nextStep,
    prevStep,
    handleSubmit,
  } = useContactForm();

  if (step === 3) {
    return <CalEmbed name={formData.name} email={formData.email} />;
  }

  return (
    <div className="relative overflow-hidden p-1 w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot anti-spam — invisible para usuarios reales */}
        <input
          type="text"
          name="website"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <div
            key="step-1"
            className={`w-full motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:ease-out ${stepDirection === 1
              ? "motion-safe:slide-in-from-right-4"
              : "motion-safe:slide-in-from-left-4"
              }`}
          >
            <Field
              id="name"
              label="Nombre completo"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
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
              onKeyDown={handleStep1KeyDown}
              placeholder="pol@doscientos.es"
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              error={fieldErrors.email}
              touched={touched.email}
            />

            <button
              type="button"
              onClick={nextStep}
              className="w-full py-4 bg-primary text-background rounded-full font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            key="step-2"
            className={`space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:ease-out ${stepDirection === 1
              ? "motion-safe:slide-in-from-right-4"
              : "motion-safe:slide-in-from-left-4"
              }`}
          >
            <Field
              id="phone"
              type="tel"
              label="Teléfono"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
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

            <BudgetPicker value={formData.budget} onSelect={selectBudget} />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={prevStep}
                aria-label="Volver al paso anterior"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 font-semibold transition-all hover:bg-muted/10 sm:w-auto sm:px-6"
              >
                <ArrowLeft className="w-5 h-5 sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="w-4 h-4" aria-hidden="true" />
                )}
                {status === "loading" ? "Enviando..." : "Solicitar consultoría"}
              </button>
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm text-red-500 text-center mt-2">
                {errorMessage}
              </p>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Lock className="size-3" aria-hidden="true" />
              Tus datos están seguros. Sin spam, sin compromiso.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
