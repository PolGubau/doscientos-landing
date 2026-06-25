# doscientos - Landing Page

Landing page premium de **doscientos** construida con Astro 5, especializada en modernización de sistemas críticos.

## 🚀 Características

- ✅ **Diseño Premium** - Minimalista, moderno y profesional
- ✅ **Consentimiento de cookies (RGPD)** con activación condicional de analytics y marketing
- ✅ **Configuración Centralizada** - Branding y contenido en archivos TypeScript
- ✅ **Content Collections** - Blog y proyectos con MDX
- ✅ **SEO Optimizado** - Meta tags, sitemap, y estructura semántica
- ✅ **Componentes React** con Radix UI para interacciones
- ✅ **Tailwind CSS 4** con tailwindcss-motion para animaciones
- ✅ **View Transitions** - Navegación fluida entre páginas
- ✅ **TypeScript** - Type-safe en toda la aplicación

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install
```

## 🔧 Configuración

### Branding Centralizado

Toda la configuración de branding está centralizada en `src/config/branding.ts`:

```typescript
export const branding = {
  name: "doscientos",
  slogan: "Modernizamos sistemas críticos sin detener tu negocio",
  domain: "doscientos.es",
  url: "https://doscientos.es",

  contact: {
    whatsapp: {
      number: "34671171525",
      displayNumber: "+34 671 17 15 25",
      defaultMessage: "Hola, quiero saber más...",
    },
    email: "hola@doscientos.es",
  },

  social: {
    twitter: "https://twitter.com/doscientos_es",
    github: "https://github.com/doscientos",
    linkedin: "https://www.linkedin.com/company/doscientos",
    instagram: "https://instagram.com/doscientos.es",
  },

  location: {
    city: "Barcelona",
    country: "España",
  },

  assets: {
    logo: "/assets/branding/logo.png",
    thumbnail: "/assets/media/og-image.png",
  },
};
```

**Para personalizar el branding**, simplemente edita este archivo con tu información.

## 🛠️ Comandos

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Preview
pnpm preview

# Lint
pnpm lint
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/
│   │   ├── sections/          # Secciones de la landing
│   │   │   ├── Hero.astro
│   │   │   ├── Services.astro
│   │   │   ├── ForWho.astro
│   │   │   ├── Method.astro
│   │   │   ├── Impact.astro
│   │   │   ├── Testimonials.astro
│   │   │   ├── CaseStudies.astro
│   │   │   ├── Comparison.astro
│   │   │   ├── FAQ.astro
│   │   │   ├── Hype.astro
│   │   │   └── FinalCTA.astro
│   │   ├── Layout/
│   │   │   ├── navbar.astro
│   │   │   └── footer.astro
│   │   └── ui/                # Componentes UI reutilizables
│   ├── config/
│   │   └── branding.ts        # Configuración de marca centralizada
│   ├── content/
│   │   ├── blog/              # Posts del blog (MDX)
│   │   └── projects/          # Proyectos (MDX)
│   ├── layouts/
│   │   └── MainLayout.astro   # Layout principal
│   ├── shared/lib/
│   │   ├── copy.ts            # Contenido centralizado (preparado para i18n)
│   │   └── constants.ts       # Constantes y metadata
│   ├── pages/
│   │   ├── index.astro        # Página principal
│   │   ├── nosotros.astro     # Página "Nosotros"
│   │   ├── blog/
│   │   │   ├── index.astro    # Lista de posts
│   │   │   └── [...slug].astro # Detalle de post
│   │   ├── legal.astro
│   │   ├── privacy.astro
│   │   └── cookies.astro
│   └── styles/
│       └── global.css         # Estilos globales con Tailwind
├── astro.config.mjs           # Configuración de Astro
└── src/content.config.ts      # Configuración de Content Collections
```

## 📝 Secciones de la Landing

La landing está estructurada en secciones estratégicas:

1. **Hero** - Presentación principal con propuesta de valor
2. **Services** - Servicios y soluciones
3. **ForWho** - Segmentación de clientes ideales
4. **Method** - Proceso de trabajo (6 semanas)
5. **Impact** - Resultados e impacto
6. **Testimonials** - Opiniones de clientes
7. **CaseStudies** - Casos de éxito reales
8. **Comparison** - Comparativa frente a alternativas
9. **FAQ** - Preguntas frecuentes
10. **FinalCTA** - Llamada a la acción principal

## 🎨 Personalización

### Branding

Edita `src/config/branding.ts` para cambiar:
- Nombre de la marca
- Dominio y URL
- Información de contacto (email, WhatsApp)
- Redes sociales
- Ubicación

### Contenido

Edita `src/shared/lib/copy.ts` para modificar:
- Textos de todas las secciones
- Casos de estudio
- Pasos del método
- Navegación

Este archivo está preparado para i18n futuro (actualmente solo español).

## 📰 Blog

El blog usa Content Collections de Astro:

1. Crea archivos `.mdx` en `src/content/blog/`
2. Incluye el frontmatter requerido:
```yaml
---
title: "Título del post"
description: "Descripción breve"
publishDate: "2025-02-28"
tags: ["tag1", "tag2"]
author: "doscientos"
draft: false
---
```
3. El post aparecerá automáticamente en `/blog`

## 🎨 Personalización de Estilos

Los estilos usan Tailwind CSS 4 con variables CSS personalizadas. Puedes modificar:

- `src/styles/global.css` - Variables de color y estilos globales
- `tailwind.config.mjs` - Configuración de Tailwind

## 📝 Secciones

- **Hero** - Presentación principal
- **Services** - Servicios ofrecidos
- **Portfolio** - Proyectos destacados
- **FAQ** - Preguntas frecuentes
- **Contact** - Formulario de contacto

## 🚢 Deployment

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

Recuerda configurar las variables de entorno en tu plataforma de hosting.

## 👀 Más información

Consulta la [documentación de Astro](https://docs.astro.build) para más detalles.