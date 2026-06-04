import { actions } from "astro:actions";
import Cal, { getCalApi } from "@calcom/embed-react";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { branding } from "~/config/branding";

const CAL_LINK = branding.contact.calComUrl.replace("https://cal.com/", "");

// Mensajes de error según el código de respuesta
const ERROR_MESSAGES: Record<number, string> = {
  400: "Revisa los datos del formulario e inténtalo de nuevo.",
  403: "No podemos procesar la solicitud desde este origen.",
  429: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
  502: "Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.",
};

const FALLBACK_ERROR =
  "No se pudo enviar. Escríbenos a hola@doscientos.es y te respondemos enseguida.";

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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

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
    payload.append(
      "timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    payload.append("utm_source", contextParams.utm_source);
    payload.append("utm_medium", contextParams.utm_medium);
    payload.append("utm_campaign", contextParams.utm_campaign);
    payload.append("subject", contextParams.subject);
    payload.append("ref", contextParams.ref);
    // Mensaje por defecto para cumplir con la acción si es necesario
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
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. Pol Gubau"
                className={`w-full px-4 py-3 rounded-xl bg-background border transition-all ${touched.name && fieldErrors.name
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
              />
              {touched.name && fieldErrors.name && (
                <p className="text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email profesional
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="pol@doscientos.es"
                className={`w-full px-4 py-3 rounded-xl bg-background border transition-all ${touched.email && fieldErrors.email
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
              />
              {touched.email && fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

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
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="666 123 456"
                className={`w-full px-4 py-3 rounded-xl bg-background border transition-all ${touched.phone && fieldErrors.phone
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
              />
              {touched.phone && fieldErrors.phone && (
                <p className="text-xs text-red-500">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Empresa / Sector
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ej. Tecnología / E-commerce"
                className="w-full px-4 py-3 rounded-xl bg-background border border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
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
                {status !== "loading" && (
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
              <p className="text-sm text-red-500 text-center mt-2">
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
