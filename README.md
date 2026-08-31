# doscientos - Landing Page

Landing page premium de **doscientos** construida con Astro 5, especializada en modernización de sistemas críticos.

## 🚀 Características

- ✅ **Diseño Premium** - Minimalista, moderno y profesional
- ✅ **Consentimiento de cookies (RGPD)** — Google Consent Mode v2, preferencias granulares y bloqueo previo de los trackers que no lo soportan
- ✅ **Exclusión de tráfico interno** — evita que las visitas del equipo lleguen a GA4, Clarity y Meta Pixel
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

1. Copia `.env.example` como `.env.local`.
2. Configura las integraciones que vayas a utilizar. Las variables públicas se incorporan en el build, por lo que no deben contener secretos.

| Variable                          | Obligatoria | Uso                                                                                                                 |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_GA_MEASUREMENT_ID`        | No          | ID de medición de Google Analytics 4. Si no se define, GA4 no se carga.                                             |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | No          | Token de verificación HTML de Google Search Console.                                                                |
| `PUBLIC_CLARITY_ID`               | No          | ID de Microsoft Clarity. Sin él, Clarity no se carga.                                                               |
| `PUBLIC_LEADS_ENDPOINT`           | No          | Endpoint público del backoffice para los formularios. Por defecto usa `https://app.doscientos.es/api/public/leads`. |
| `PUBLIC_BRAND_KIT_API_URL`        | No          | Feed público de tokens publicados del backoffice. Si falla, se usan los tokens incluidos en CSS.                    |

### Analítica, consentimiento y tráfico interno

El banner guarda las preferencias del visitante en `localStorage` bajo la clave `doscientos-consent`:

- **Google Analytics 4** usa Google Consent Mode v2: se inicia con consentimiento denegado en el EEE y se actualiza cuando el visitante decide.
- **Microsoft Clarity** solo se carga al aceptar analítica.
- **Meta Pixel** solo se carga al aceptar marketing.

Para no contaminar las métricas durante pruebas o navegación del equipo, abre cualquier URL con `?internal_traffic=1` (también se acepta `true`). La exclusión se conserva solo en la sesión del navegador y bloquea GA4, Clarity y Meta Pixel incluso si hay consentimiento previo. Para desactivarla, visita una URL con `?internal_traffic=0` o `?internal_traffic=false` y recarga la página.

### Branding Centralizado

Toda la configuración de branding está centralizada en `src/config/branding.ts`:

```typescript
export const branding = {
  name: 'doscientos',
  slogan: 'Modernizamos sistemas críticos sin detener tu negocio',
  domain: 'doscientos.es',
  url: 'https://doscientos.es',

  contact: {
    whatsapp: {
      number: '34671171525',
      displayNumber: '+34 671 17 15 25',
      defaultMessage: 'Hola, quiero saber más...',
    },
    email: 'hola@doscientos.es',
  },

  social: {
    twitter: 'https://twitter.com/doscientos_es',
    github: 'https://github.com/doscientos',
    linkedin: 'https://www.linkedin.com/company/doscientos',
    instagram: 'https://instagram.com/doscientos.es',
  },

  location: {
    city: 'Barcelona',
    country: 'España',
  },

  assets: {
    logo: '/assets/branding/logo.png',
    thumbnail: '/assets/media/og-image.png',
  },
}
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

# Comprobación de tipos y plantillas Astro
pnpm check

# Tests y validaciones SEO
pnpm test
pnpm seo:check

# Actualizar la instantánea estática de descargas npm
pnpm npm:downloads:sync

# Validación completa previa a publicar
pnpm test:build

# Comprobar formato sin modificar archivos
pnpm format:check
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
title: 'Título del post'
description: 'Descripción breve'
publishDate: '2025-02-28'
tags: ['tag1', 'tag2']
author: 'doscientos'
draft: false
---
```

3. El post aparecerá automáticamente en `/blog`

## 🎨 Personalización de Estilos

Los estilos usan Tailwind CSS 4 con variables CSS personalizadas. Puedes modificar:

- `src/styles/global.css` - Variables de color y estilos globales
- `src/styles/custom-styles.css` - Estilos globales adicionales
- Los componentes de `src/components/` - Estilos específicos de cada interfaz

## 🚢 Deployment

### Vercel

El proyecto genera un sitio estático. Conecta el repositorio a Vercel y configura el directorio raíz como `landing`. Vercel instalará las dependencias y ejecutará el build de Astro; replica allí las variables de entorno que necesite la publicación.

Antes de cada build, `prebuild` descarga una sola vez los tokens publicados del
backoffice y actualiza `src/data/brand-tokens.json`. Las páginas estáticas leen
esa instantánea local; si el feed no responde, se conserva la última válida.

Antes de publicar, ejecuta `pnpm test:build` localmente.

## 👀 Más información

Consulta la [documentación de Astro](https://docs.astro.build) para más detalles.
