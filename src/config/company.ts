import { branding } from "./branding";

export const company = {
  address: {
    streetAddress: branding.legal.address.street,
    postalCode: branding.legal.address.postalCode,
    addressLocality: branding.legal.address.city,
    addressRegion: branding.legal.address.province,
    addressCountry: "ES",
  },
  // Coordenadas de Premià de Mar, donde figura la dirección legal publicada.
  geo: { latitude: 41.4956, longitude: 2.3598 },
  serviceAreas: ["Barcelona", "Maresme", "Mataró", "España"],
  openingHours: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
  ],
  contactPoints: [
    {
      contactType: "sales",
      email: branding.contact.email,
      telephone: branding.contact.whatsapp.displayNumber,
      availableLanguage: ["es", "ca"],
    },
  ],
};
