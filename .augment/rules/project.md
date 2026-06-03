---
type: always
---

# Regla — Contenido de proyectos (`src/content/projects/*.mdx`)

Cómo crear o editar archivos MDX en `src/content/projects/`. Toda página de proyecto debe seguir esta estructura. Plantilla canónica: `src/content/_templates/project.mdx`.

## Contrato (no negociable)

- **Frontmatter**: respetar el schema de `src/content.config.ts`. Campos: `title, summary, available, client, timeline (semanas), endedAt (YYYY-MM-DD), color, link?, cover, logo?, services_provided[]`.
- **No repetir cabecera en el body**: la página `src/pages/projects/[...slug].astro` ya renderiza H1, summary, cover, pills (cliente, servicios, timeline) y botón de link. El cuerpo MDX empieza con el hook narrativo, **nunca con un H1 ni repitiendo el título**.
- **Cover image**: ratio 16:9, formato `.webp` o `.avif`, en `src/assets/media/projects/{slug}/`.
- **Imports de imágenes**: siempre vía `astro:assets` con `import { Image } from "astro:assets";` y un import por imagen.

## Espina dorsal obligatoria (todos los proyectos)

En este orden exacto:

1. **Hook narrativo** — 2–3 párrafos, sin header. Última frase en `**bold**` con la conclusión.
2. **Imagen hero** — `<Image src={...} alt="..." class="rounded-2xl my-6" />`.
3. **Grid de 3 métricas headline** — bloque `not-prose`, exactamente 3 datos.
4. `---` separador.
5. `## El problema` — H2, 1–2 párrafos con una frase clave en `**bold**`.
6. `---` separador.
7. `## La solución` — H2, narrativa con imágenes intercaladas. Usar `###` sólo si hay sub-módulos claros (App, Landing, Admin, etc.).
8. `---` separador.
9. `## Resultados` — H2 con lista markdown `-` (4–6 items, cada uno con la cifra en `**bold**` al inicio).
10. Cierre: cita en `>` blockquote firmada con `— Nombre, rol` **o** una frase de cierre con peso.

## Módulos opcionales (activar sólo si hay sustancia)

Insertarlos entre `## La solución` y `## Resultados`, cada uno precedido y seguido de `---`:

- `## Decisiones técnicas clave` — grid `not-prose` de 4–6 tarjetas. Sólo para proyectos con sustancia técnica pública (Les Santes, Arenas).
- `## Stack técnico` — tabla markdown 2 columnas (`Capa | Tecnología`). Sólo si el stack es relevante y no confidencial.
- `## Estado del proyecto` — sólo si el proyecto sigue vivo o tiene fecha futura relevante.
- `## Contexto del proyecto` — sólo para casos académicos, open source o con contexto institucional.

## Clases canónicas de imagen

- **Hero / contenido inline**: `class="rounded-2xl my-6"`.
- **Imagen alta (mockup móvil)**: `class="max-h-[60vh] w-auto rounded-2xl my-6"`.
- **Grupos de imágenes flex**: contenedor con `class="not-prose flex flex-wrap gap-4 justify-center my-6"`.
- **No inventar** combinaciones como `rounded-4xl w-full bg-muted my-20!`. Esa convención queda obsoleta.

## SEO — obligatorio

- **`alt` siempre descriptivo y único**: incluir nombre del producto y qué muestra la imagen (no "imagen 1"). Ej: `alt="Mapa en tiempo real con posición de desfiles - Les Santes"`.
- **Jerarquía estricta**: 1 H1 (auto), H2 para secciones principales, H3 sólo para subsecciones reales. No saltar niveles.
- **Densidad de palabras clave naturales**: usar el nombre del cliente, sector y tecnologías en los párrafos iniciales y los `alt`.
- **`summary` (frontmatter)**: 140–180 caracteres, autocontenida, con verbo de acción al inicio. Se usa como `<meta description>`, `og:description` y descripción en JSON-LD.
- **`services_provided`**: usar términos reconocibles que actúan como keywords del schema (`Web`, `App`, `Backend`, `Ecommerce`, `Backoffice`, etc.).
- **Internal linking**: si procede, enlazar a `/servicios`, `/blog/...` relacionados, u otros proyectos relacionados con sintaxis markdown `[texto](/ruta)`.

## Reglas de estilo editorial

- Tono **directo, técnico y sin auto-elogios**. Hablar del problema y la decisión, no de "soluciones a medida" ni clichés.
- Usar `**bold**` con moderación: sólo para las 1–2 frases clave por sección.
- Cifras concretas siempre antes que adjetivos ("3 plataformas entregadas", no "muchas entregas").
- Listas de máximo 6 items. Si crecen más, partir en sub-bloques.
- Catalán/inglés mantenido sólo si forma parte del nombre propio (Les Santes, T'estiu molt).

## Lo que NO se hace

- ❌ Repetir el título o el summary del frontmatter dentro del MDX.
- ❌ Usar `**¿Qué hicimos?**` como pseudo-header. Usar `## La solución` o `## Qué construimos`.
- ❌ Imágenes sin `alt` o con `alt=""` en contenido.
- ❌ Forzar `## Stack técnico` o `## Decisiones técnicas clave` si no hay material real — quedan vacíos y pierden valor.
- ❌ Tocar el schema de `content.config.ts` salvo petición explícita del usuario.
