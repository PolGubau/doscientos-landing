import { branding } from '~/config/branding'

// Clave para persistir el progreso del formulario entre recargas
export const STORAGE_KEY = 'doscientos:contact-form'

// Opciones de presupuesto (chips de selección rápida)
// Formato de moneda europeo: el backend parsea estos valores para estimar el valor del lead
export const BUDGET_OPTIONS = [
  'Menos de 5.000€',
  '5.000€ - 10.000€',
  '10.000€ - 30.000€',
  'Más de 30.000€',
] as const

// Opciones de tamaño de empresa — deben coincidir exactamente con los valores de Meta Ads
export const COMPANY_SIZE_OPTIONS = [
  '1-10 empleados',
  '10-50 empleados',
  '50-200 empleados',
  'Más de 200 empleados',
] as const

// Opciones de urgencia — el backend las usa para priorizar el lead
export const URGENCY_OPTIONS = ['Inmediata', 'Este mes', 'Este trimestre', 'Explorando'] as const

// La landing lo pregunta para que el backoffice pueda separar software a medida
// de webs paquetizadas sin depender de interpretar las notas a mano.
export const SOLUTION_TYPE_OPTIONS = [
  'Software a medida / backoffice',
  'Web para mi negocio',
  'E-commerce o tienda online',
  'Automatización de un proceso',
  'Todavía no lo sé',
] as const

// Mensajes de error según el código de respuesta de la acción
export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Revisa los datos del formulario e inténtalo de nuevo.',
  403: 'No podemos procesar la solicitud desde este origen.',
  429: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
  502: 'Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.',
}

export const FALLBACK_ERROR = `No se pudo enviar. Escríbenos a ${branding.contact.email} o llama al ${branding.contact.whatsapp.displayNumber} y te respondemos enseguida.`

export const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  solutionType: '',
  companySize: '',
  urgency: '',
  budget: '',
}

export type ContactValues = typeof EMPTY_FORM

export type FieldId = keyof ContactValues

export type FormStatus = 'idle' | 'loading' | 'success' | 'error'
