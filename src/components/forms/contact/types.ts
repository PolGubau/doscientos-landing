import { branding } from "~/config/branding";

// Clave para persistir el progreso del formulario entre recargas
export const STORAGE_KEY = "doscientos:contact-form";

// Opciones de presupuesto (chips de selección rápida)
export const BUDGET_OPTIONS = [
  "< 3.000 €",
  "3.000 – 10.000 €",
  "10.000 – 30.000 €",
  "+ 30.000 €",
  "No lo sé todavía",
] as const;

// Mensajes de error según el código de respuesta de la acción
export const ERROR_MESSAGES: Record<number, string> = {
  400: "Revisa los datos del formulario e inténtalo de nuevo.",
  403: "No podemos procesar la solicitud desde este origen.",
  429: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
  502: "Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.",
};

export const FALLBACK_ERROR = `No se pudo enviar. Escríbenos a ${branding.contact.email} o llama al ${branding.contact.whatsapp.displayNumber} y te respondemos enseguida.`;

export const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  budget: "",
};

export type ContactValues = typeof EMPTY_FORM;

export type FieldId = keyof ContactValues;

export type FormStatus = "idle" | "loading" | "success" | "error";
