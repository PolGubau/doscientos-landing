import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { buildAttributionPayload, getMetaAttribution, trackEvent } from "~/shared/lib/attribution";
import {
  type ContactValues,
  EMPTY_FORM,
  ERROR_MESSAGES,
  FALLBACK_ERROR,
  type FormStatus,
  STORAGE_KEY,
} from "./types";

const LEADS_ENDPOINT =
  import.meta.env.PUBLIC_LEADS_ENDPOINT ||
  "https://app.doscientos.es/api/public/leads";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{9,}$/;
const DEDUPE_STORAGE_KEY = `${STORAGE_KEY}:dedupe-key`;

function validate(name: string, value: string): string {
  switch (name) {
    case "name":
      if (!value.trim()) return "El nombre es obligatorio";
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
      return "";
    case "email":
      if (!value.trim()) return "El email es obligatorio";
      if (!EMAIL_RE.test(value)) return "Email inválido";
      return "";
    case "phone":
      if (!value.trim()) return "El teléfono es obligatorio";
      if (!PHONE_RE.test(value)) return "Teléfono inválido";
      return "";
    default:
      return "";
  }
}

export function useContactForm() {
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const focusedFields = useRef(new Set<string>());
  const dedupeKey = useRef(
    (() => {
      if (typeof window === "undefined") return crypto.randomUUID();
      try {
        const existing = window.sessionStorage.getItem(DEDUPE_STORAGE_KEY);
        if (existing) return existing;
        const next = crypto.randomUUID();
        window.sessionStorage.setItem(DEDUPE_STORAGE_KEY, next);
        return next;
      } catch {
        return crypto.randomUUID();
      }
    })(),
  );

  const [formData, setFormData] = useState<ContactValues>(() => {
    if (typeof window === "undefined") return EMPTY_FORM;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return EMPTY_FORM;
      const parsed = JSON.parse(saved) as Partial<ContactValues>;
      // Do not persist name, email, phone or free-text company data in the
      // browser. Only restore the low-sensitivity selector choices.
      return {
        ...EMPTY_FORM,
        solutionType: parsed.solutionType ?? "",
        companySize: parsed.companySize ?? "",
        urgency: parsed.urgency ?? "",
        budget: parsed.budget ?? "",
      };
    } catch {
      return EMPTY_FORM;
    }
  });

  const contextParams = useRef({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    ref: "",
    subject: "",
    resource: "",
    coste: "",
    horas: "",
    page_path: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    contextParams.current = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
      ref: params.get("ref") || "",
      subject: params.get("subject") || "",
      resource: params.get("resource") || "",
      coste: params.get("coste") || "",
      horas: params.get("horas") || "",
      page_path: window.location.pathname,
    };
  }, []);

  useEffect(() => {
    trackEvent("form_view", { conversionStep: "contact_form" });
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          solutionType: formData.solutionType,
          companySize: formData.companySize,
          urgency: formData.urgency,
          budget: formData.budget,
        }),
      );
    } catch {
      // localStorage no disponible (modo privado / SSR)
    }
  }, [formData]);

  const validateField = (name: string, value: string) => {
    const error = validate(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
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

  const handleFieldFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const field = e.currentTarget.name;
    if (!field || focusedFields.current.has(field)) return;
    focusedFields.current.add(field);
    trackEvent("form_field_focus", {
      conversionStep: "contact_form",
      payload: { field },
    });
  };

  const trackValidationFailure = (field: string) => {
    trackEvent("form_validation_failed", {
      conversionStep: "contact_form",
      payload: { field },
    });
  };

  const selectBudget = (value: string) =>
    setFormData((prev) => ({ ...prev, budget: value }));

  const selectCompanySize = (value: string) =>
    setFormData((prev) => ({ ...prev, companySize: value }));

  const selectSolutionType = (value: string) =>
    setFormData((prev) => ({ ...prev, solutionType: value }));

  const selectUrgency = (value: string) =>
    setFormData((prev) => ({ ...prev, urgency: value }));

  const nextStep = () => {
    const nameOk = validateField("name", formData.name);
    const emailOk = validateField("email", formData.email);
    setTouched((prev) => ({ ...prev, name: true, email: true }));
    if (nameOk && emailOk) {
      setStepDirection(1);
      setStep(2);
      trackEvent("form_started", { conversionStep: "contact_form" });
      trackEvent("form_step_1_completed", { conversionStep: "contact_form" });
      trackEvent("form_step_2_viewed", { conversionStep: "contact_form" });
    } else {
      const firstInvalid = !nameOk ? "name" : "email";
      trackValidationFailure(firstInvalid);
      requestAnimationFrame(() => {
        (
          document.getElementById(firstInvalid) as HTMLInputElement | null
        )?.focus();
      });
    }
  };

  const prevStep = () => {
    setStepDirection(-1);
    setStep(1);
  };

  const handleStep1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const honeypot = (e.currentTarget as HTMLFormElement).elements.namedItem(
      "website",
    );
    const website = honeypot instanceof HTMLInputElement ? honeypot.value : "";

    // Drop bot submissions before validating the human-facing fields.
    if (website) {
      console.warn("Honeypot triggered");
      setStatus("success");
      setStep(3);
      return;
    }

    const isPhoneValid = validateField("phone", formData.phone);
    setTouched((prev) => ({ ...prev, phone: true }));
    if (!isPhoneValid) {
      trackValidationFailure("phone");
      return;
    }

    setStatus("loading");

    const hasLeadContext = Boolean(
      contextParams.current.subject ||
      contextParams.current.ref ||
      contextParams.current.coste ||
      contextParams.current.horas ||
      (contextParams.current.page_path &&
        contextParams.current.page_path !== "/"),
    );
    const contextLines = [
      contextParams.current.subject &&
      `Asunto: ${contextParams.current.subject}`,
      contextParams.current.ref && `Ref: ${contextParams.current.ref}`,
      hasLeadContext &&
      contextParams.current.page_path &&
      `Pagina: ${contextParams.current.page_path}`,
      contextParams.current.coste &&
      `Coste calculado: ${contextParams.current.coste}`,
      contextParams.current.horas &&
      `Horas calculadas: ${contextParams.current.horas}`,
    ].filter(Boolean);

    trackEvent("form_submit_attempted", { conversionStep: "contact_form" });

    const attribution = buildAttributionPayload();
    const metaAttribution = getMetaAttribution();
    const body = {
      ...attribution,
      ...metaAttribution,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      solutionType: formData.solutionType,
      companySize: formData.companySize,
      urgency: formData.urgency,
      message: contextLines.length
        ? `Lead desde formulario corto (multi-step)\n${contextLines.join("\n")}`
        : "Lead desde formulario corto (multi-step)",
      budget: formData.budget,
      dedupeKey: dedupeKey.current,
      website, // honeypot — debe quedar vacío
      utm_source: contextParams.current.utm_source,
      utm_medium: contextParams.current.utm_medium,
      utm_campaign: contextParams.current.utm_campaign,
      utm_term: contextParams.current.utm_term,
      utm_content: contextParams.current.utm_content,
      referrer: document.referrer ?? "",
      language: navigator.language ?? "",
      landing_path: contextParams.current.page_path,
      landing_ref: contextParams.current.ref,
      landing_subject: contextParams.current.subject,
      resource: contextParams.current.resource,
      calculator_cost: contextParams.current.coste,
      calculator_hours: contextParams.current.horas,
    };

    try {
      const response = await fetch(LEADS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(ERROR_MESSAGES[response.status] ?? FALLBACK_ERROR);
        return;
      }

      const payload =
        typeof response.json === "function"
          ? ((await response.json().catch(() => null)) as {
            leadId?: string;
          } | null)
          : null;

      setStatus("success");
      setSubmittedLeadId(payload?.leadId ?? null);
      setStep(3);
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(DEDUPE_STORAGE_KEY);
      } catch {
        // localStorage no disponible
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if ("gtag" in window) {
        // @ts-ignore
        window.gtag("event", "generate_lead", {
          event_category: "contact",
          event_label: "contact_form_multistep",
          page_path: contextParams.current.page_path,
          lead_ref: contextParams.current.ref,
          lead_subject: contextParams.current.subject,
          event_id: attribution.event_id,
          conversion_step: attribution.conversion_step,
        });
      }

      if ("fbq" in window) {
        // @ts-ignore
        window.fbq("track", "Lead", {
          content_name: "contact_form_multistep",
          status: "success",
        }, { eventID: attribution.event_id });
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Error de conexión. Verifica tu internet.");
      console.error("Error completo:", err);
    }
  };

  return {
    step,
    status,
    errorMessage,
    stepDirection,
    fieldErrors,
    touched,
    formData,
    submittedLeadId,
    dedupeKey: dedupeKey.current,
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
  };
}
