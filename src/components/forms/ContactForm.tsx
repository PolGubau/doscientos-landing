import { actions } from "astro:actions";
import Cal, { getCalApi } from "@calcom/embed-react";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { branding } from "~/config/branding";

const CAL_LINK = branding.contact.calCom.path;

// Mensajes de error según el código de respuesta
const ERROR_MESSAGES: Record<number, string> = {
  400: "Revisa los datos del formulario e inténtalo de nuevo.",
  403: "No podemos procesar la solicitud desde este origen.",
  429: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
  502: "Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.",
};

const FALLBACK_ERROR =
  `No se pudo enviar. Escríbenos a ${branding.contact.email} o llama al ${branding.contact.whatsapp.displayNumber} y te respondemos enseguida.`;

// Clave para persistir el progreso del formulario entre recargas
const STORAGE_KEY = "doscientos:contact-form";

const BUDGET_OPTIONS = [
  "< 3.000 €",
  "3.000 – 10.000 €",
  "10.000 – 30.000 €",
  "+ 30.000 €",
  "No lo sé todavía",
] as const;

const EMPTY_FORM = { name: "", email: "", phone: "", company: "", budget: "" };

type ContactValues = typeof EMPTY_FORM;

type FieldId = keyof ContactValues;

type FieldProps = {
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

function Field({
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
    <div className="space-y-2">
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
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`w-full px-4 py-3 ${isValid ? "pr-11" : ""} rounded-xl bg-background border transition-all ${hasError
            ? "border-red-500 ring-1 ring-red-500"
            : "border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
            }`}
        />
        {isValid && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 motion-scale-in-95 motion-duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
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

function CalEmbed({ name, email }: { name: string; email: string }) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <div className="space-y-6 motion-fade-in motion-duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-foreground">¡Datos recibidos!</h3>
        <p className="text-muted-foreground">
          Elige el día y la hora que mejor te vaya para que te llamemos. Si no ves tu zona horaria correcta, haz clic en la esquina inferior izquierda para ajustarla.:
        </p>
      </div>

      <Cal
        calLink={CAL_LINK}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
        config={{ name, email, layout: "month_view" }}
      />
    </div>
  );
}

export default function ContactForm() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const dedupeKey = useRef(crypto.randomUUID());

  const [formData, setFormData] = useState<ContactValues>(() => {
    if (typeof window === "undefined") return EMPTY_FORM;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY_FORM, ...JSON.parse(saved) } : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });

  // Persistir el progreso para que no se pierda al recargar
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // localStorage no disponible (modo privado / SSR)
    }
  }, [formData]);

  // Capturar parámetros de la URL
  const [contextParams, setContextParams] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    subject: "",
    ref: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setContextParams({
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      subject: params.get("subject") || "",
      ref: params.get("ref") || "",
    });
  }, []);

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "El nombre es obligatorio";
        else if (value.trim().length < 2) error = "Mínimo 2 caracteres";
        break;
      case "email":
        if (!value.trim()) error = "El email es obligatorio";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Email inválido";
        break;
      case "phone":
        if (!value.trim()) error = "El teléfono es obligatorio";
        else if (!/^\+?[\d\s-]{9,}$/.test(value)) error = "Teléfono inválido";
        break;
    }

    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name] = error;
      else delete newErrors[name];
      return newErrors;
    });

    return !error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const nextStep = () => {
    const isNameValid = validateField("name", formData.name);
    const isEmailValid = validateField("email", formData.email);

    setTouched({ name: true, email: true });

    if (isNameValid && isEmailValid) {
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

  // Permite avanzar de paso pulsando Enter en los campos del paso 1
  const handleStep1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPhoneValid = validateField("phone", formData.phone);
    setTouched((prev) => ({ ...prev, phone: true }));

    if (!isPhoneValid) return;

    setStatus("loading");

    const payload = new FormData();
    for (const [key, value] of Object.entries(formData)) {
      payload.append(key, value);
    }
    payload.append("utm_source", contextParams.utm_source);
    payload.append("utm_medium", contextParams.utm_medium);
    payload.append("utm_campaign", contextParams.utm_campaign);
    payload.append("referrer", document.referrer ?? "");
    payload.append("language", navigator.language ?? "");
    payload.append("dedupeKey", dedupeKey.current);
    payload.append("website", ""); // honeypot — debe quedar vacío
    payload.append("message", "Lead desde formulario corto (multi-step)");

    try {
      const { error } = await actions.sendContact(payload);

      if (error) {
        setStatus("error");
        // @ts-ignore
        setErrorMessage(ERROR_MESSAGES[error.status] ?? FALLBACK_ERROR);
        console.error("Action error:", error);
      } else {
        setStatus("success");
        setStep(3);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // localStorage no disponible
        }
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        if (typeof window !== "undefined" && "gtag" in window) {
          // @ts-ignore
          window.gtag("event", "generate_lead", {
            event_category: "contact",
            event_label: "contact_form_multistep",
          });
        }
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Error de conexión. Verifica tu internet.");
      console.error("Error completo:", error);
    }
  };

  if (step === 3) {
    return (
      <CalEmbed name={formData.name} email={formData.email} />
    );
  }

  return (
    <div className="relative overflow-hidden p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8" aria-hidden="true">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? "bg-primary" : "bg-muted"}`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? "bg-primary" : "bg-muted"}`}
          />
        </div>

        {step === 1 && (
          <div className="space-y-4 motion-slide-in-from-right motion-duration-300">
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 motion-slide-in-from-right motion-duration-300">
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

            <div className="space-y-2">
              <p className="flex items-center justify-between text-sm font-medium">
                <span>Presupuesto estimado</span>
                <span className="text-xs font-normal text-muted-foreground">Opcional</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        budget: prev.budget === option ? "" : option,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.budget === option
                        ? "bg-primary text-background border-primary font-medium"
                        : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/20"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 border border-muted-foreground/30 rounded-full font-semibold hover:bg-muted/10 transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex-[2] py-4 bg-primary text-background rounded-full font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? "Enviando..." : "Solicitar consultoría"}
                {status === "loading" ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>
            {status === "error" && (
              <p
                role="alert"
                className="text-sm text-red-500 text-center mt-2"
              >
                {errorMessage}
              </p>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <svg
                className="size-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Tus datos están seguros. Sin spam, sin compromiso.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
