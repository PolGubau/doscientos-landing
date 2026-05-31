import { actions } from "astro:actions";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Capturar UTM parameters de la URL
  const [utmParams, setUtmParams] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
  });

  useEffect(() => {
    // Capturar UTM params al cargar
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    });
  }, []);

  // Validación en tiempo real
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
        else if (!/^\+?[\d\s-]{9,}$/.test(value))
          error = "Teléfono inválido";
        break;
      case "budget":
        // optional — no validation needed
        break;
      case "message":
        if (!value.trim()) error = "El mensaje es obligatorio";
        else if (value.trim().length < 10)
          error = "Mínimo 10 caracteres";
        break;
    }

    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });

    return !error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guardar referencia al form antes del async
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Agregar datos adicionales
    formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    formData.append("utm_source", utmParams.utm_source);
    formData.append("utm_medium", utmParams.utm_medium);
    formData.append("utm_campaign", utmParams.utm_campaign);

    // Mostrar loading brevemente para que se sienta natural
    setStatus("loading");

    // Pequeña pausa antes de mostrar éxito (UX más creíble)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Optimistic UI: mostrar éxito y limpiar formulario
    setStatus("success");
    form.reset();
    setFieldErrors({});
    setTouched({});

    // Evento de conversión GA4
    if (typeof window !== "undefined" && "gtag" in window) {
      // @ts-ignore
      window.gtag("event", "generate_lead", {
        event_category: "contact",
        event_label: "contact_form",
        budget: formData.get("budget") ?? "unknown",
      });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Enviar en background
    try {
      const { error } = await actions.sendContact(formData);

      if (error) {
        // Si falla, mostrar error pero mantener formulario limpio
        setStatus("error");
        setErrorMessage("Hubo un problema al enviar. Reintentando automáticamente...");
        console.error("Action error:", error);

        // Auto-retry después de 2 segundos
        setTimeout(async () => {
          setStatus("loading");
          const { error: retryError } = await actions.sendContact(formData);

          if (retryError) {
            setStatus("error");
            setErrorMessage("No se pudo enviar. Por favor, contacta por email a hola@doscientos.es");
          } else {
            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
          }
        }, 2000);
      } else {
        // Todo OK, mantener success
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Error de conexión. Verifica tu internet.");
      console.error("Error completo:", error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          required
          disabled={status === "loading"}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 ${touched.name && fieldErrors.name
            ? "border-red-500 focus:ring-red-500"
            : touched.name && !fieldErrors.name
              ? "border-green-500 focus:ring-green-500"
              : "border-muted-foreground focus:ring-primary"
            }`}
          placeholder="Tu nombre"
        />
        {touched.name && fieldErrors.name && (
          <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          required
          disabled={status === "loading"}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 ${touched.email && fieldErrors.email
            ? "border-red-500 focus:ring-red-500"
            : touched.email && !fieldErrors.email
              ? "border-green-500 focus:ring-green-500"
              : "border-muted-foreground focus:ring-primary"
            }`}
          placeholder="tu@email.com"
        />
        {touched.email && fieldErrors.email && (
          <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
            Empresa <span className="text-muted-foreground text-sm">(opcional)</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            autoComplete="organization"
            disabled={status === "loading"}
            className="w-full px-4 py-3 rounded-xl bg-background border border-muted-foreground text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            placeholder="Tu empresa"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autoComplete="tel"
            required
            disabled={status === "loading"}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 ${touched.phone && fieldErrors.phone
              ? "border-red-500 focus:ring-red-500"
              : touched.phone && !fieldErrors.phone
                ? "border-green-500 focus:ring-green-500"
                : "border-muted-foreground focus:ring-primary"
              }`}
            placeholder="666 123 456"
          />
          {touched.phone && fieldErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-foreground mb-2">
          Presupuesto aproximado <span className="text-muted-foreground">(opcional)</span>
        </label>
        <select
          id="budget"
          name="budget"
          disabled={status === "loading"}
          className="w-full px-4 py-3 rounded-xl bg-background border border-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="">Sin definir aún</option>
          <option value="<5k">Menos de 5.000€</option>
          <option value="5k-15k">5.000€ – 15.000€</option>
          <option value="15k-40k">15.000€ – 40.000€</option>
          <option value=">40k">Más de 40.000€</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
          Mensaje
        </label>
        <textarea
          id="message"
          minLength={1}
          name="message"
          required
          rows={4}
          disabled={status === "loading"}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none disabled:opacity-50 ${touched.message && fieldErrors.message
            ? "border-red-500 focus:ring-red-500"
            : touched.message && !fieldErrors.message
              ? "border-green-500 focus:ring-green-500"
              : "border-muted-foreground focus:ring-primary"
            }`}
          placeholder="¿Cómo podemos ayudarte?"
        />
        {touched.message && fieldErrors.message && (
          <p className="text-red-500 text-sm mt-1">{fieldErrors.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-6 py-3 bg-primary text-background rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative"
      >
        {status === "loading" ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <title>Enviando...</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            Pedir presupuesto
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Enviar mensaje</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </>
        )}
      </button>
      {/* Mensaje de éxito */}
      {status === "success" && (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-1">
          <p className="text-green-800 font-semibold text-base inline-flex items-center justify-center gap-2">
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            ¡Recibido!
          </p>
          <p className="text-green-700 text-sm">Te respondemos en menos de 24 horas.</p>
        </div>
      )}

      {/* Mensaje de error */}
      {status === "error" && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-red-800 text-sm font-medium inline-flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {errorMessage}
          </p>
        </div>
      )}


    </form>
  );
}

