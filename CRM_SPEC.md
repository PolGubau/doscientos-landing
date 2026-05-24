# doscientos CRM — Ficha Técnica

> **Versión:** 1.1 · **Fecha:** Mayo 2026
> **Empresa:** DOSCIENTOS DESARROLLO TECNOLOGICO, S.L. · Barcelona  
> **Repositorio:** `crm.doscientos.es` (proyecto separado, subdominio)

---

## 1. Visión del producto

CRM interno + portal de cliente unificado. El objetivo es eliminar el intercambio de PDFs y emails manuales: cada propuesta, factura o documento se convierte en una **URL web** que el cliente abre desde cualquier dispositivo. El equipo gestiona el ciclo completo (lead → cliente → proyecto → factura) desde un único panel.

---

## 2. Stack técnico

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR + API routes + RSC, ideal para dashboard + portal público |
| Base de datos | **Supabase (PostgreSQL)** | Auth, DB, Storage, RLS, realtime |
| Auth interna | **Supabase Auth** | Email/password para el equipo de doscientos |
| UI | **shadcn/ui + Tailwind v4** | Consistencia, accesibilidad, velocidad de desarrollo |
| Email | **Resend** (ya en uso) | Mismo proveedor que la landing |
| PDF/Print | **@react-pdf/renderer** o CSS print | Fallback imprimible de propuestas/facturas |
| Hosting | **Vercel** (mismo equipo) | Previews, edge, CI/CD automático |
| Tipos | **TypeScript strict** | Seguridad de tipos en todo el stack |

---

## 3. Roles y acceso

```
EQUIPO (admin)
  └─ Acceso completo al CRM: leads, clientes, proyectos, documentos, finanzas

CLIENTE (portal)
  └─ Acceso por URL pública con token UUID (sin login)
  └─ Solo ve sus propuestas, facturas y estado de proyecto
  └─ Puede aceptar/rechazar propuestas y dejar comentarios
```

Los clientes **no tienen cuenta**. Cada documento genera una URL única firmada (`/p/[token]`). Si se necesita acceso continuo, se envía un magic link por email a su dirección.

---

## 4. Modelo de datos (PostgreSQL / Supabase)

### 4.1 `leads`
```sql
id uuid PK
created_at timestamptz
name text
email text
phone text
company text
budget text              -- '<5k' | '5k-15k' | '15k-40k' | '>40k'
message text
status text              -- 'new' | 'contacted' | 'qualified' | 'lost' | 'converted'
source text              -- 'landing' | 'referral' | 'manual'
utm_source text
utm_medium text
utm_campaign text
ip text
device text
assigned_to uuid FK → team_members.id
notes text
converted_client_id uuid FK → clients.id  -- null hasta conversión
-- Campos de seguimiento
next_followup_at timestamptz             -- próximo recordatorio activo
last_interaction_at timestamptz          -- última vez que hubo contacto
interactions_count int DEFAULT 0         -- total de interacciones registradas
ai_summary text                          -- resumen generado por IA (nullable)
ai_suggested_next_step text              -- siguiente acción sugerida por IA
ai_summary_updated_at timestamptz
```

### 4.2 `clients`
```sql
id uuid PK
created_at timestamptz
lead_id uuid FK → leads.id   -- origen
name text                    -- nombre de contacto
company text
email text
phone text
nif text                     -- para facturación
address text
city text
country text DEFAULT 'España'
notes text
status text                  -- 'active' | 'inactive' | 'archived'
```

### 4.3 `projects`
```sql
id uuid PK
created_at timestamptz
client_id uuid FK → clients.id
name text
description text
status text    -- 'discovery' | 'proposal' | 'active' | 'paused' | 'completed' | 'cancelled'
start_date date
end_date date
budget_total numeric(10,2)
assigned_to uuid FK → team_members.id
```

### 4.4 `proposals` (presupuestos)
```sql
id uuid PK
created_at timestamptz
public_token uuid UNIQUE DEFAULT gen_random_uuid()  -- token para URL pública
project_id uuid FK → projects.id
client_id uuid FK → clients.id
title text
status text     -- 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
valid_until date
subtotal numeric(10,2)
tax_rate numeric(5,2) DEFAULT 21   -- IVA %
tax_amount numeric(10,2)
total numeric(10,2)
notes text                         -- condiciones, nota final
sent_at timestamptz
accepted_at timestamptz
rejected_at timestamptz
rejection_reason text
```

### 4.5 `invoices` (facturas)
```sql
id uuid PK
created_at timestamptz
public_token uuid UNIQUE DEFAULT gen_random_uuid()
proposal_id uuid FK → proposals.id   -- puede ser null si es manual
project_id uuid FK → projects.id
client_id uuid FK → clients.id
invoice_number text UNIQUE           -- 'F-2026-001'
status text    -- 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
issue_date date
due_date date
subtotal numeric(10,2)
tax_rate numeric(5,2) DEFAULT 21
tax_amount numeric(10,2)
total numeric(10,2)
paid_at timestamptz
payment_method text
notes text
```

### 4.6 `line_items` (líneas de presupuesto/factura)
```sql
id uuid PK
proposal_id uuid FK → proposals.id   -- mutuamente excluyentes
invoice_id uuid FK → invoices.id
description text
quantity numeric(8,2)
unit_price numeric(10,2)
total numeric(10,2)
sort_order int
```

### 4.7 `documents` (documentos internos)
```sql
id uuid PK
created_at timestamptz
project_id uuid FK → projects.id
type text    -- 'brief' | 'contract' | 'nda' | 'meeting_notes' | 'other'
title text
body text    -- markdown
file_url text   -- Storage de Supabase si es archivo adjunto
is_client_visible bool DEFAULT false
```

### 4.8 `activities` (timeline / audit log)
```sql
id uuid PK
created_at timestamptz
entity_type text   -- 'lead' | 'client' | 'project' | 'proposal' | 'invoice'
entity_id uuid
action text        -- 'created' | 'status_changed' | 'email_sent' | 'viewed' | ...
actor text         -- 'team' | 'client' | 'system'
actor_id uuid
metadata jsonb     -- datos extra (old_status, new_status, ip...)
```

### 4.9 `team_members`
```sql
id uuid PK   -- mismo que Supabase Auth user id
name text
email text
role text    -- 'admin' | 'member'
avatar_url text
```

### 4.10 `lead_interactions` ← nuevo
Registro de cada contacto real con un lead: llamadas, emails, WhatsApps, reuniones, notas internas.

```sql
id uuid PK
created_at timestamptz
lead_id uuid FK → leads.id
author_id uuid FK → team_members.id

-- Tipo de interacción
type text   -- 'call' | 'email_sent' | 'email_received' | 'whatsapp' | 'meeting' | 'note'

-- Resultado / outcome (para llamadas y reuniones)
outcome text  -- 'no_answer' | 'voicemail' | 'interested' | 'not_interested' | 'follow_up' | 'converted'

-- Contenido
title text           -- asunto corto (ej: "Llamada inicial", "Email de seguimiento")
body text            -- notas de lo que pasó (markdown libre)
duration_min int     -- duración en minutos (llamadas/reuniones)

-- Si el tipo es 'email_sent': referencia al email enviado
resend_email_id text -- ID del email en Resend para tracking

-- Fecha real del contacto (puede ser distinta a created_at si se registra después)
contacted_at timestamptz DEFAULT now()

-- Visibilidad
is_internal bool DEFAULT true  -- false = visible en portal de cliente
```

### 4.11 `reminders` ← nuevo
Recordatorios de seguimiento: "llamar el lunes", "enviar propuesta el jueves"...

```sql
id uuid PK
created_at timestamptz
lead_id uuid FK → leads.id       -- puede ser lead o cliente
client_id uuid FK → clients.id   -- mutuamente excluyentes
assigned_to uuid FK → team_members.id

title text              -- "Llamar a Marta para confirmar propuesta"
due_at timestamptz      -- cuándo hay que actuar
type text               -- 'call' | 'email' | 'meeting' | 'task' | 'other'
priority text           -- 'low' | 'medium' | 'high'
status text             -- 'pending' | 'done' | 'snoozed' | 'cancelled'
done_at timestamptz
snoozed_until timestamptz
interaction_id uuid FK → lead_interactions.id  -- si se resolvió con una interacción
```

---

## 5. Sistema de interacciones y seguimiento

### 5.1 UX — Vista de lead (panel de actividad)

La página de un lead tiene dos columnas:

```
┌─────────────────────────────┬──────────────────────────────────┐
│  INFO DEL LEAD              │  ACTIVIDAD + SEGUIMIENTO         │
│  ─────────────────          │  ─────────────────────────────   │
│  Nombre, email, phone       │  [+ Añadir interacción ▼]        │
│  Empresa, presupuesto       │  [📞 Llamada] [✉ Email] [💬 WA]  │
│  Estado (select)            │  [👥 Reunión] [📝 Nota]          │
│  Asignado a                 │  ─────────────────────────────   │
│  ─────────────────          │  🔔 RECORDATORIO ACTIVO          │
│  RESUMEN IA                 │  "Llamar el lunes 26 mayo"       │
│  [Resumir con IA]           │  [Marcar como hecho] [Posponer]  │
│  "Interesado en web...      │  ─────────────────────────────   │
│   Siguiente paso: enviar    │  TIMELINE                        │
│   propuesta esta semana"    │  ● Hoy — Pol                     │
│                             │    📞 Llamada · 12 min           │
│  [Sugerir siguiente paso]   │    "Interesado, pide propuesta   │
│                             │     para finales de semana"      │
│                             │  ● Ayer — Sistema                │
│                             │    🌐 Lead recibido desde web    │
└─────────────────────────────┴──────────────────────────────────┘
```

### 5.2 Flujo de registro de interacción (quick-add)

El objetivo es que registrar una llamada tarde **menos de 20 segundos**:

1. Click en `[+ Añadir]` → dropdown con iconos: Llamada / Email / WhatsApp / Reunión / Nota
2. Se abre un **popover inline** (no página nueva) con:
   - `Outcome` (select rápido): Sin respuesta / Buzón / Interesado / No interesado / Seguimiento
   - `Notas` (textarea libre, opcional)
   - `Duración` (solo llamadas/reuniones, número de minutos)
   - `¿Crear recordatorio de seguimiento?` (toggle) → si activo: date picker + tipo
3. Click `Guardar` → graba en `lead_interactions` + actualiza `last_interaction_at` + crea reminder si aplica

### 5.3 Email enviado desde el CRM

Flujo cuando el tipo es `email_sent`:

1. El equipo hace click en `[✉ Email]`
2. Se abre un modal con:
   - `Para:` (pre-relleno con email del lead)
   - `Asunto:` (texto libre o plantilla)
   - `Cuerpo:` (editor markdown/texto, con variables: `{{nombre}}`, `{{empresa}}`)
   - Selector de **plantilla de email** (opcional)
3. Al enviar: llamada a `/api/interactions/send-email` → Resend → graba en `lead_interactions` con `resend_email_id`
4. Queda en el timeline con el asunto del email y botón "Ver email enviado"

### 5.4 Recordatorios — Vista global

Ruta `/reminders` en el dashboard: lista de todos los recordatorios pendientes ordenados por `due_at`.

```
HOY
  🔴 Alta  · [📞 Llamar] · Empresa X — "Confirmar propuesta"       [Hecho] [Posponer]
  🟡 Media · [✉ Email]  · Lead Y — "Enviar dossier de servicios"   [Hecho] [Posponer]

MAÑANA
  🟢 Baja  · [👥 Reunión] · Cliente Z — "Kick-off del proyecto"    [Hecho] [Posponer]

SIN FECHA
  ...
```

Notificación por email diaria a las 8:00 con los recordatorios del día (cron Vercel).

---

## 6. Portal de cliente — URLs públicas

Cada documento tiene un `public_token` UUID que genera URLs no adivinables:

```
/p/proposal/[token]   → Vista de presupuesto
/p/invoice/[token]    → Vista de factura
/p/project/[token]    → Estado del proyecto (opcional fase 2)
```

**Comportamiento:**
- Página SSR con todos los datos del documento
- Botón "Aceptar" / "Rechazar" (proposals) → escribe en DB y notifica al equipo
- Botón "Descargar PDF" → `window.print()` con CSS `@media print` optimizado
- Botón "Ver en navegador" → siempre disponible para reenviar
- Sin login, sin cookies — solo el token es el acceso
- El equipo puede **revocar/regenerar** el token desde el panel

---

## 6. Flujo de trabajo end-to-end

```
Landing (doscientos.es)
  └─ Formulario de contacto
       │  POST a Supabase (leads table) + email via Resend
       ▼
CRM — Panel interno
  [1] LEAD NUEVO aparece en pipeline (kanban)
  [2] Equipo lo califica → mueve a "Qualified"
  [3] Se crea PROYECTO y se convierte lead → CLIENTE
  [4] Se redacta PROPUESTA con line items
  [5] Se envía link al cliente (email via Resend con botón)
  [6] Cliente abre /p/proposal/[token]
       ├─ Acepta → status: 'accepted', notificación al equipo
       └─ Rechaza → status: 'rejected' + motivo opcional
  [7] Si acepta: proyecto pasa a 'active'
  [8] Al finalizar: se genera FACTURA (pre-rellena desde propuesta)
  [9] Se envía link al cliente (email via Resend)
  [10] Cliente paga → equipo marca 'paid' manualmente (o webhook Stripe fase 2)
```

---

## 7. Estructura de rutas (Next.js App Router)

```
app/
├── (auth)/
│   └── login/               → Login equipo doscientos
│
├── (dashboard)/             → Layout protegido (auth middleware)
│   ├── page.tsx             → Home: KPIs, actividad reciente
│   ├── leads/               → Pipeline kanban + lista
│   │   ├── page.tsx
│   │   └── [id]/page.tsx    → Ficha lead: info + timeline + recordatorios
│   ├── clients/             → CRUD clientes
│   │   ├── page.tsx
│   │   └── [id]/page.tsx    → Perfil: proyectos, docs, historial
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── proposals/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx     → Editor de propuesta
│   │       └── preview/     → Preview = vista cliente
│   ├── invoices/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reminders/           → Vista global de recordatorios pendientes
│   │   └── page.tsx
│   └── documents/
│       └── page.tsx
│
└── p/                       → Portal público (sin auth)
    ├── proposal/[token]/    → Vista cliente propuesta
    └── invoice/[token]/     → Vista cliente factura
```

---

## 8. Integración con la landing actual

Cambio puntual en `src/actions/index.ts` de la landing:

```typescript
// Añadir tras el envío de email con Resend:
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
await supabase.from('leads').insert({
  name, email, phone, company, budget, message,
  source: 'landing', status: 'new',
  utm_source, utm_medium, utm_campaign,
  ip, device, browser
})
// Notion y Google Sheets → deprecar gradualmente
```

El CRM suscribe a `leads` con **Supabase Realtime** y muestra notificación instantánea al equipo cuando llega un lead nuevo.

---

## 9. Automatizaciones — Fase 1

| Trigger | Acción automática |
|---|---|
| Lead nuevo desde landing | Email al equipo (ya existe) + aparece en kanban |
| Propuesta enviada | Email al cliente con el link vía Resend |
| Cliente acepta propuesta | Email al equipo + proyecto pasa a 'active' |
| Cliente rechaza propuesta | Email al equipo con motivo |
| Factura creada | Pre-rellena desde propuesta (line items, cliente, totales) |
| Factura enviada | Email al cliente con link |
| Factura vencida (due_date < hoy) | Email recordatorio al cliente (cron Vercel) |

---

## 10. IA — Asistente de leads

### 10.1 Resumen automático de lead

Cuando el equipo hace click en `[Resumir con IA]` (o automáticamente tras N interacciones):

**Input al modelo:**
```
Lead: {nombre}, {empresa}, {presupuesto}
Mensaje original: {message}
Interacciones:
  - [fecha] Llamada 12 min · outcome: interesado · "Quiere web corporativa + ecommerce"
  - [fecha] Email enviado · "Propuesta para semana que viene"
  - [fecha] WhatsApp · "Pidió más info sobre tiempos"
```

**Output esperado:**
```json
{
  "summary": "Lead interesado en desarrollo web + ecommerce. Presupuesto estimado 15-40k. Ha habido 3 contactos. Está esperando propuesta formal.",
  "suggested_next_step": "Enviar propuesta antes del viernes. Si no responde en 3 días, hacer seguimiento por WhatsApp.",
  "lead_temperature": "hot",   // 'cold' | 'warm' | 'hot'
  "confidence": 0.82
}
```

Se guarda en `leads.ai_summary`, `leads.ai_suggested_next_step`, `leads.ai_summary_updated_at`.

### 10.2 Borrador de email con IA

En el modal de envío de email, botón `[✨ Generar borrador]`:
- Contexto: lead info + últimas 5 interacciones + tipo de email seleccionado
- Output: asunto + cuerpo listo para editar antes de enviar
- El equipo siempre revisa y edita antes de enviar — nunca envío automático

### 10.3 Stack IA

| Uso | Modelo | Proveedor |
|---|---|---|
| Resumen de lead | GPT-4o mini | OpenAI (coste bajo, suficiente para texto corto) |
| Borrador de email | GPT-4o | OpenAI |
| Extracción de intención del mensaje original | GPT-4o mini | OpenAI |

Variable de entorno: `OPENAI_API_KEY`. Las llamadas se hacen desde API routes de Next.js (nunca en cliente).

---

## 11. Automatizaciones — Fase 2 (roadmap)

- **Stripe integration:** link de pago en factura → webhook marca `paid` automático
- **Firma digital:** integrar DocuSign o Autofirma para contratos
- **Portal de proyecto:** `/p/project/[token]` con kanban de tareas visible al cliente
- **Plantillas de propuesta:** bloques reutilizables por tipo de proyecto
- **Reportes:** resumen mensual de facturación, pipeline, conversión de leads
- **IA proactiva:** sugerir recordatorio automáticamente si llevan X días sin contacto

---

## 12. Variables de entorno (CRM)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend (mismo API key que landing)
RESEND_API_KEY=

# OpenAI (IA de leads)
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://crm.doscientos.es
NEXT_PUBLIC_LANDING_URL=https://doscientos.es
```

---

## 13. Prioridad de implementación

```
Sprint 1 — Core
  ✦ Auth equipo (Supabase Auth)
  ✦ CRUD Leads + pipeline kanban
  ✦ CRUD Clientes + Proyectos
  ✦ Integración landing → Supabase leads (reemplaza Notion/Sheets)

Sprint 2 — Interacciones y seguimiento  ← NUEVO
  ✦ Tabla lead_interactions + UI de timeline en lead
  ✦ Quick-add popover: llamada / email / WhatsApp / nota
  ✦ Tabla reminders + vista /reminders global
  ✦ Cron diario: email con recordatorios del día al equipo
  ✦ Envío de email desde CRM (modal + Resend + tracking)

Sprint 3 — Documentos
  ✦ Editor de propuestas + line items
  ✦ Portal público /p/proposal/[token]
  ✦ Aceptar/rechazar con notificación email
  ✦ Generación de factura desde propuesta aceptada

Sprint 4 — Portal cliente
  ✦ Portal /p/invoice/[token]
  ✦ CSS print optimizado (PDF sin dependencias)
  ✦ Plantillas de email reutilizables

Sprint 5 — IA
  ✦ Resumen de lead con GPT-4o mini
  ✦ Sugerencia de siguiente paso
  ✦ Borrador de email con IA
  ✦ Lead temperature (hot/warm/cold)

Sprint 6 — Automatización avanzada
  ✦ Cron para facturas vencidas
  ✦ Stripe webhook (pago desde factura)
  ✦ IA proactiva: alertar si lead lleva X días sin contacto
```

---

*Equipo: Pol (Frontend & Design) · Gerard (Backend & DevOps)*
*Stack validado contra el sistema actual de la landing (Resend, Vercel, TypeScript)*
