# doscientos CRM — Especificacion Tecnica Completa

> Version: 2.0 - Mayo 2026
> Empresa: DOSCIENTOS DESARROLLO TECNOLOGICO, S.L. - Barcelona
> Subdominio: crm.doscientos.es | Repo: doscientos/crm
> Este documento es la fuente de verdad para la generacion asistida por IA del proyecto.

---

## 1. Vision del producto

CRM interno + portal de cliente unificado para una agencia de desarrollo web de 2 personas (Pol y Gerard). Elimina el intercambio de PDFs: cada presupuesto o factura es una URL web que el cliente abre desde cualquier dispositivo, puede aceptar o rechazar, y descargar como PDF. El equipo gestiona el ciclo completo desde un unico panel: lead, cliente, proyecto, propuesta, factura cobrada, con seguimiento de interacciones, recordatorios y asistente IA.

Usuarios internos: Pol y Gerard, acceso total al dashboard.
Usuarios externos (clientes): acceso por URL con token UUID, sin login, sin cuenta.

---

## 2. Stack tecnico

### 2.1 Tecnologias principales

| Capa | Tecnologia | Version |
|---|---|---|
| Framework | Next.js App Router | 15.x |
| Runtime | Node.js | 20.x LTS |
| Lenguaje | TypeScript strict | 5.x |
| Base de datos | Supabase PostgreSQL 15 | latest |
| Auth | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Email | Resend + React Email | latest |
| Hosting | Vercel | - |
| Package manager | pnpm | 9.x |

### 2.2 Dependencias npm completas

Instalar con: pnpm add [paquete]

Produccion:
- next@15, react@19, react-dom@19
- @supabase/supabase-js@^2, @supabase/ssr@^0.5
- resend@^4, @react-email/components@latest
- openai@^4
- zod@^3, react-hook-form@^7, @hookform/resolvers@^3
- @tanstack/react-table@^8
- @dnd-kit/core@^6, @dnd-kit/sortable@^8
- @tiptap/react@^2, @tiptap/starter-kit@^2, @tiptap/extension-placeholder@^2
- date-fns@^3, date-fns-tz@^3
- zustand@^4
- sonner@^1
- tailwindcss@^4, clsx@^2, tailwind-merge@^3, class-variance-authority@^0.7
- lucide-react@^0.4
- recharts@^2

# Verifactu / SIF (facturacion electronica AEAT)
- node-forge@^1           -- firma digital con certificado .p12 (FNMT/Camerfirma)
- fast-xml-parser@^4      -- generacion y parseo de XML segun XSD de AEAT
- qrcode@^1               -- generacion del codigo QR en PNG/SVG para facturas
- soap@^1                 -- cliente SOAP para el web service de AEAT (remision RF)

shadcn/ui components a instalar via CLI:
button, input, textarea, select, dialog, popover, dropdown-menu, calendar,
badge, card, table, tabs, separator, avatar, tooltip, skeleton, sheet,
command, form, label, switch, checkbox, progress, scroll-area

---

## 3. Design system

### 3.1 Modo visual

Dark mode por defecto. Herramienta interna de uso intensivo, dark es mas comodo.
Soporte light mode via clase en el elemento html. Usar next-themes para gestionarlo.

Tokens CSS (definir en globals.css):

```
--background:       #0a0a0a
--surface:          #111111
--surface-elevated: #1a1a1a
--border:           #2a2a2a
--text-primary:     #fafafa
--text-secondary:   #a1a1aa
--text-muted:       #71717a
--accent:           #ffffff
--accent-fg:        #000000
--success:          #22c55e
--warning:          #f59e0b
--danger:           #ef4444
--info:             #3b82f6
--hot:              #ef4444   (lead caliente)
--warm:             #f59e0b   (lead tibio)
--cold:             #3b82f6   (lead frio)
```

### 3.2 Tipografia

font-family: 'Inter', system-ui, sans-serif (misma que la landing doscientos.es)

Escala: 12px labels/badges, 14px body y tablas, 16px base, 18px titulos seccion, 20px titulos pagina, 24px KPIs grandes.

### 3.3 Layout del dashboard

```
+------------------------------------------------------------------+
|  SIDEBAR 240px fijo (colapsable a 64px solo iconos en movil)    |
|  Logo doscientos | Nav items | Avatar usuario abajo              |
+------------------------------------------------------------------+
|  TOPBAR 56px | Breadcrumb | Buscador global | Campana badge      |
+------------------------------------------------------------------+
|  CONTENT AREA (overflow-y scroll, padding 24px)                 |
+------------------------------------------------------------------+
```

Sidebar nav items (en orden):
1. Inicio (KPIs y actividad reciente)
2. Leads (pipeline kanban)
3. Clientes
4. Proyectos
5. Propuestas
6. Facturas
7. Recordatorios (badge con count pendientes)
8. Documentos

---

## 4. Roles y acceso

```
TEAM (role: admin | member)
  Todos los team_members tienen acceso completo al dashboard.
  Solo admin puede: eliminar registros, ver configuracion, acceder a settings.

CLIENTE (sin cuenta, sin sesion)
  Accede SOLO por URL con public_token UUID (no adivinable).
  Puede ver: sus propuestas y sus facturas.
  Puede hacer: aceptar propuesta, rechazar propuesta con motivo, descargar PDF.
  No puede: ver otros clientes, navegar el CRM, ver precios de otros.
```

---

## 5. Modelo de datos (PostgreSQL via Supabase)

Convencion: todas las tablas tienen `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
y `created_at timestamptz NOT NULL DEFAULT now()`.
Los enums se validan en la capa de aplicacion con Zod (no ENUM de PostgreSQL para flexibilidad).

### 5.1 leads

```sql
id                    uuid PK
created_at            timestamptz
updated_at            timestamptz DEFAULT now()
name                  text NOT NULL
email                 text NOT NULL
phone                 text
company               text
budget                text        -- '<5k' | '5k-15k' | '15k-40k' | '>40k'
message               text
status                text        -- 'new' | 'contacted' | 'qualified' | 'lost' | 'converted'
source                text        -- 'landing' | 'referral' | 'manual'
utm_source            text
utm_medium            text
utm_campaign          text
referrer              text
ip                    text
device                text        -- 'desktop' | 'mobile' | 'tablet'
browser               text
language              text
assigned_to           uuid REFERENCES team_members(id)
notes                 text
converted_client_id   uuid REFERENCES clients(id)
-- Seguimiento
next_followup_at      timestamptz
last_interaction_at   timestamptz
interactions_count    int DEFAULT 0
-- IA
ai_summary              text
ai_suggested_next_step  text
ai_temperature          text      -- 'hot' | 'warm' | 'cold'
ai_confidence           numeric(3,2)
ai_updated_at           timestamptz
-- Soft delete (GDPR)
deleted_at              timestamptz  -- NULL = activo; non-NULL = borrado logico
```

Soft delete: todas las queries deben incluir `WHERE deleted_at IS NULL`.
Endpoint `DELETE /api/crm/leads/[id]` hace UPDATE deleted_at=now() en lugar de DELETE real.
Endpoint `POST /api/gdpr/leads/[id]/erase` anonimiza: name='ANONIMIZADO', email='anonimizado@gdpr.local', phone=null, ip=null, company=null, message=null.

### 5.2 clients

```sql
id          uuid PK
created_at  timestamptz
updated_at  timestamptz
lead_id     uuid REFERENCES leads(id)
name        text NOT NULL         -- nombre del contacto principal
company     text NOT NULL
email       text NOT NULL
phone       text
-- Datos fiscales (para factura legal)
nif         text                  -- NIF/CIF del cliente, obligatorio para facturar
address     text
city        text
postal_code text
country     text DEFAULT 'ES'
-- Extra
notes        text
status       text DEFAULT 'active' -- 'active' | 'inactive' | 'archived'
portal_token uuid UNIQUE DEFAULT gen_random_uuid() -- token para portal general del cliente (fase 2)
deleted_at   timestamptz  -- soft delete GDPR
```

### 5.3 projects

```sql
id          uuid PK
created_at  timestamptz
updated_at  timestamptz
client_id   uuid REFERENCES clients(id) NOT NULL
name        text NOT NULL
description text
status      text  -- 'discovery' | 'proposal' | 'active' | 'paused' | 'completed' | 'cancelled'
start_date  date
end_date    date
budget_total numeric(10,2)
assigned_to  uuid REFERENCES team_members(id)
public_token uuid UNIQUE DEFAULT gen_random_uuid() -- para portal de proyecto (fase 2)
```

### 5.4 project_milestones

Hitos de pago dentro de un proyecto. Permite facturacion parcial (ej: 50% inicio, 50% entrega).

```sql
id          uuid PK
created_at  timestamptz
project_id  uuid REFERENCES projects(id) NOT NULL
name        text NOT NULL  -- 'Inicio del proyecto', 'Entrega final'
percentage  numeric(5,2)   -- 50.00 = 50%
amount      numeric(10,2)  -- calculado: project.budget_total * percentage / 100
due_date    date
status      text DEFAULT 'pending' -- 'pending' | 'invoiced' | 'paid'
invoice_id  uuid REFERENCES invoices(id)
```

### 5.5 proposals (presupuestos)

```sql
id           uuid PK
created_at   timestamptz
updated_at   timestamptz
public_token uuid UNIQUE DEFAULT gen_random_uuid()
project_id   uuid REFERENCES projects(id)
client_id    uuid REFERENCES clients(id) NOT NULL
title        text NOT NULL
intro        text  -- texto introductorio antes de las lineas (markdown)
terms        text  -- condiciones, garantias, formas de pago (markdown)
status       text  -- 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
valid_until  date
subtotal     numeric(10,2)
tax_rate     numeric(5,2) DEFAULT 21.00  -- IVA %
tax_amount   numeric(10,2)
total        numeric(10,2)
currency     text DEFAULT 'EUR'
sent_at      timestamptz
accepted_at  timestamptz
rejected_at  timestamptz
rejection_reason text
-- Tracking de apertura por el cliente
view_count   int DEFAULT 0
first_viewed_at timestamptz
last_viewed_at  timestamptz
```

### 5.6 invoices (facturas)

```sql
id             uuid PK
created_at     timestamptz
updated_at     timestamptz
public_token   uuid UNIQUE DEFAULT gen_random_uuid()
proposal_id    uuid REFERENCES proposals(id)   -- null si es factura manual
project_id     uuid REFERENCES projects(id)
milestone_id   uuid REFERENCES project_milestones(id)
client_id      uuid REFERENCES clients(id) NOT NULL
invoice_number text UNIQUE NOT NULL             -- 'F-2026-001' generado automaticamente
status         text  -- 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
issue_date     date NOT NULL DEFAULT CURRENT_DATE
due_date       date NOT NULL
subtotal       numeric(10,2) NOT NULL
tax_rate       numeric(5,2) DEFAULT 21.00
tax_amount     numeric(10,2) NOT NULL
total          numeric(10,2) NOT NULL
currency       text DEFAULT 'EUR'
paid_at        timestamptz
payment_method text  -- 'transfer' | 'card' | 'cash' | 'other'
payment_ref    text  -- referencia de transferencia
notes          text
-- Tracking apertura por el cliente
view_count          int DEFAULT 0
first_viewed_at     timestamptz
last_viewed_at      timestamptz

-- Verifactu / SIF (RD 1007/2023)
-- Hash chain: garantia de inalterabilidad de la cadena de facturas
previous_hash       text           -- huella SHA-256 del registro anterior (null en la primera factura del ejercicio)
current_hash        text           -- huella SHA-256 de este registro (calculada al emitir, inmutable)
chain_sequence      bigint         -- numero de orden dentro de la cadena correlativa
-- Estado de envio a la AEAT
verifactu_status    text DEFAULT 'pending'
                                   -- 'excluded'  -> factura en draft, no se envia
                                   -- 'pending'   -> emitida, pendiente de envio a AEAT
                                   -- 'sent'      -> enviada, esperando respuesta
                                   -- 'accepted'  -> AEAT la acepta y devuelve CSV
                                   -- 'rejected'  -> AEAT la rechaza (error de datos)
                                   -- 'error'     -> fallo de red, se reintentara
verifactu_sent_at   timestamptz    -- momento en que se envio a AEAT
verifactu_csv       text           -- Codigo Seguro de Verificacion devuelto por AEAT (32 chars)
verifactu_response  jsonb          -- respuesta cruda de AEAT (para auditoria y debugging)
verifactu_error     text           -- detalle del error si verifactu_status = 'rejected' | 'error'
verifactu_retry_count int DEFAULT 0 -- numero de reintentos realizados (max 5)
-- QR y verificacion publica
qr_url              text           -- URL que codifica el QR (sede.agenciatributaria.gob.es/...)
qr_png_url          text           -- URL del PNG del QR en Supabase Storage (para PDF)
-- Metadatos de emision (trazabilidad)
issued_by_user_id   uuid REFERENCES team_members(id)  -- quien emitio la factura
issued_from_ip      inet           -- IP del emisor en el momento de emision
sif_version         text DEFAULT 'crm-doscientos@1.0.0'  -- version del SIF que la genero
-- Facturas rectificativas (correccion de errores)
is_rectification    bool DEFAULT false  -- true si es una factura correctiva/abono
rectified_invoice_id uuid REFERENCES invoices(id)  -- factura original que corrige
rectification_reason text          -- motivo de la rectificacion
rectification_type  text           -- 'sustitucion' | 'diferencia' (segun RD 1619/2012 art.15)
-- Idempotencia (evitar doble facturación en reintentos de cron o red)
idempotency_key     text UNIQUE    -- UUID enviado por el cliente en header Idempotency-Key
```

IMPORTANTE: Una vez que una factura sale del estado 'draft', current_hash y chain_sequence son INMUTABLES.
La tabla tiene un trigger que lanza una excepcion si se intenta modificar esos campos en una fila que ya no es draft.
Para corregir una factura emitida, se debe crear una factura rectificativa (is_rectification=true).

Logica de invoice_number: funcion PostgreSQL que genera el siguiente numero correlativo anual.
Formato: F-{YYYY}-{NNN} donde NNN es el numero secuencial del ano, con ceros a la izquierda.
Ejemplo: F-2026-001, F-2026-002, F-2027-001.

```sql
CREATE SEQUENCE invoice_seq_2026 START 1;

CREATE OR REPLACE FUNCTION next_invoice_number(year int)
RETURNS text AS $$
  SELECT 'F-' || year || '-' || lpad(nextval('invoice_seq_' || year)::text, 3, '0');
$$ LANGUAGE sql;
```

### 5.7 line_items

Aplica tanto a proposals como a invoices. Solo uno de los dos FKs es NOT NULL.

```sql
id          uuid PK
created_at  timestamptz
proposal_id uuid REFERENCES proposals(id)
invoice_id  uuid REFERENCES invoices(id)
-- CONSTRAINT: exactamente uno de los dos debe ser NOT NULL
description text NOT NULL
quantity    numeric(8,2) NOT NULL DEFAULT 1
unit_price  numeric(10,2) NOT NULL
total       numeric(10,2) NOT NULL  -- calculado: quantity * unit_price
sort_order  int NOT NULL DEFAULT 0
service_id  uuid REFERENCES services_catalog(id)  -- null si es linea libre
```

### 5.8 services_catalog

Catalogo de servicios reutilizables. El equipo lo configura una vez y los usa como line items rapidos.

```sql
id          uuid PK
created_at  timestamptz
name        text NOT NULL          -- 'Desarrollo frontend', 'Diseno UI', 'Hora de consultoria'
description text                   -- descripcion por defecto para la linea
unit_price  numeric(10,2)          -- precio por defecto (editable al usar)
unit        text DEFAULT 'proyecto' -- 'proyecto' | 'hora' | 'mes' | 'unidad'
is_active   bool DEFAULT true
category    text                   -- 'desarrollo' | 'diseno' | 'consultoria' | 'mantenimiento'
```

### 5.9 documents (documentos internos)

```sql
id               uuid PK
created_at       timestamptz
updated_at       timestamptz
project_id       uuid REFERENCES projects(id)
client_id        uuid REFERENCES clients(id)
author_id        uuid REFERENCES team_members(id)
type             text  -- 'brief' | 'contract' | 'nda' | 'meeting_notes' | 'spec' | 'other'
title            text NOT NULL
body             text  -- contenido markdown (via editor Tiptap)
file_url         text  -- si es archivo adjunto (Supabase Storage)
file_name        text
file_size_bytes  int
is_client_visible bool DEFAULT false  -- si aparece en el portal del cliente
```

### 5.10 email_templates

Plantillas de email reutilizables para enviar desde el CRM. Soportan variables de interpolacion.

```sql
id          uuid PK
created_at  timestamptz
name        text NOT NULL          -- 'Seguimiento tras primera llamada'
subject     text NOT NULL          -- 'Hola {{nombre}}, te escribo sobre...'
body        text NOT NULL          -- markdown con variables: {{nombre}}, {{empresa}}, {{link_propuesta}}
category    text  -- 'follow_up' | 'proposal' | 'invoice' | 'onboarding' | 'other'
is_active   bool DEFAULT true
use_count   int DEFAULT 0          -- cuantas veces se ha usado
```

Variables disponibles: {{nombre}}, {{empresa}}, {{email}}, {{link_propuesta}}, {{link_factura}}, {{nombre_proyecto}}, {{total}}, {{fecha_vencimiento}}.

### 5.11 activities (audit log global)

Registro automatico de todos los eventos del sistema. No se edita manualmente.

```sql
id          uuid PK
created_at  timestamptz
entity_type text NOT NULL  -- 'lead' | 'client' | 'project' | 'proposal' | 'invoice'
entity_id   uuid NOT NULL
action      text NOT NULL  -- 'created' | 'updated' | 'status_changed' | 'email_sent' | 'viewed' | 'accepted' | 'rejected' | 'paid'
actor_type  text NOT NULL  -- 'team' | 'client' | 'system'
actor_id    uuid           -- team_member id o null si es cliente/sistema
metadata    jsonb          -- datos extra: {old_status, new_status, ip, email_subject, ...}
```

### 5.12 team_members

```sql
id            uuid PK       -- debe coincidir con el user id de Supabase Auth
created_at    timestamptz
name          text NOT NULL
email         text NOT NULL UNIQUE
role          text NOT NULL DEFAULT 'member'
-- Roles (jerarquía):
-- 'owner'  -> acceso total + billing + borrar empresa + Verifactu cert
-- 'admin'  -> acceso total excepto billing y borrado de empresa
-- 'member' -> acceso a proyectos/tareas/leads asignados o de equipo; NO ve settings financieros
-- 'viewer' -> solo lectura, sin crear ni editar nada
avatar_url    text
is_active     bool DEFAULT true
github_handle text UNIQUE           -- handle de GitHub para sincronización bidireccional
deleted_at    timestamptz           -- soft delete: NULL = activo
mfa_enabled   bool DEFAULT false    -- refleja si el usuario tiene TOTP activo en Supabase Auth
```

Restricción: solo puede haber 1 `owner`. El owner no puede degradarse a sí mismo
(validado en API route, no en RLS para evitar lockout).

### 5.13 lead_interactions

Registro manual de cada contacto real con un lead.

```sql
id            uuid PK
created_at    timestamptz
lead_id       uuid REFERENCES leads(id) NOT NULL
author_id     uuid REFERENCES team_members(id) NOT NULL
type          text NOT NULL  -- 'call' | 'email_sent' | 'email_received' | 'whatsapp' | 'meeting' | 'note'
outcome       text           -- 'no_answer' | 'voicemail' | 'interested' | 'not_interested' | 'follow_up' | 'converted'
title         text NOT NULL  -- asunto corto: 'Llamada inicial', 'Email de seguimiento'
body          text           -- notas libres (markdown)
duration_min  int            -- duracion en minutos (llamadas y reuniones)
contacted_at  timestamptz DEFAULT now()  -- fecha real del contacto (puede ser distinta a created_at)
resend_email_id text         -- ID del email en Resend (solo si type = email_sent)
is_internal   bool DEFAULT true  -- false = visible en portal cliente
```

Triggers de base de datos al insertar:
- Incrementar leads.interactions_count
- Actualizar leads.last_interaction_at = contacted_at

### 5.14 reminders

```sql
id            uuid PK
created_at    timestamptz
lead_id       uuid REFERENCES leads(id)    -- uno de los dos NOT NULL
client_id     uuid REFERENCES clients(id)  -- uno de los dos NOT NULL
assigned_to   uuid REFERENCES team_members(id) NOT NULL
title         text NOT NULL   -- 'Llamar a Marta para confirmar presupuesto'
due_at        timestamptz NOT NULL
type          text  -- 'call' | 'email' | 'meeting' | 'task' | 'other'
priority      text DEFAULT 'medium'  -- 'low' | 'medium' | 'high'
status        text DEFAULT 'pending' -- 'pending' | 'done' | 'snoozed' | 'cancelled'
done_at       timestamptz
snoozed_until timestamptz
interaction_id uuid REFERENCES lead_interactions(id)  -- si se resolvio al registrar interaccion
```

Trigger al insertar reminder: actualizar leads.next_followup_at con el due_at mas proximo pendiente.

### 5.15 subscriptions (facturacion recurrente)

Contratos de mantenimiento, hosting, retainers mensuales y cualquier servicio facturado de forma periodica. Cada subscription activa genera facturas automaticamente segun su ciclo.

```sql
id                 uuid PK
created_at         timestamptz
updated_at         timestamptz
client_id          uuid REFERENCES clients(id) NOT NULL
project_id         uuid REFERENCES projects(id)  -- opcional, puede no estar ligada a proyecto
name               text NOT NULL          -- 'Mantenimiento web mensual', 'Hosting + SLA'
description        text                   -- descripcion que aparecera en la factura
amount             numeric(10,2) NOT NULL -- importe por ciclo, sin IVA
tax_rate           numeric(5,2) DEFAULT 21.00
currency           text DEFAULT 'EUR'
-- Ciclo de facturacion
billing_cycle      text NOT NULL          -- 'monthly' | 'quarterly' | 'biannual' | 'annual'
billing_day        int DEFAULT 1          -- dia del mes para emitir (1-28, max 28 para evitar problemas en feb)
-- Vigencia
start_date         date NOT NULL
end_date           date                   -- null = indefinida
next_invoice_date  date NOT NULL          -- proxima fecha en que se generara factura
last_invoiced_at   timestamptz
-- Estado
status             text DEFAULT 'active'  -- 'active' | 'paused' | 'cancelled'
cancelled_at       timestamptz
cancellation_reason text
-- Configuracion del envio
auto_generate      bool DEFAULT true      -- si false, queda en draft a la espera de revision manual
auto_send_email    bool DEFAULT false     -- si true, envia email al cliente automaticamente; si false, solo prepara
payment_terms_days int DEFAULT 30         -- dias para due_date desde issue_date
notes              text                   -- notas internas
```

Logica de next_invoice_date al crear:
- monthly: start_date + 1 mes (mismo billing_day)
- quarterly: start_date + 3 meses
- biannual: start_date + 6 meses
- annual: start_date + 12 meses

Tras generar una factura, next_invoice_date se recalcula automaticamente sumando el ciclo.

### 5.16 subscription_invoices (relacion N:1 con invoices)

Tabla pivote que conecta facturas generadas con su suscripcion origen.
Se anade columna `subscription_id uuid REFERENCES subscriptions(id)` directamente en `invoices` (mas simple que tabla pivote, ya que una factura pertenece a una sola suscripcion).

Actualizacion de la tabla invoices (seccion 5.6) - anadir campos:
```sql
subscription_id    uuid REFERENCES subscriptions(id)  -- null si no es recurrente
billing_period_start date                              -- ej: 2026-06-01
billing_period_end   date                              -- ej: 2026-06-30
is_recurring        bool DEFAULT false
```

### 5.17 invoice_events (log inmutable de eventos)

Tabla de auditoria append-only. Registra cada evento relevante sobre una factura: emision, envio, aceptacion, rechazo, rectificacion. Cumple el requisito de trazabilidad del RD 1007/2023 art.6.

```sql
CREATE TABLE invoice_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  invoice_id      uuid REFERENCES invoices(id) NOT NULL,
  event_type      text NOT NULL,
  -- Tipos de evento:
  -- 'issued'          -> factura emitida (sale de draft)
  -- 'sent_to_client'  -> enviada al cliente por email
  -- 'viewed_by_client'-> el cliente abrio el portal
  -- 'paid'            -> marcada como pagada
  -- 'verifactu_sent'  -> enviada a AEAT
  -- 'verifactu_accepted' -> aceptada por AEAT (CSV recibido)
  -- 'verifactu_rejected' -> rechazada por AEAT
  -- 'rectified'       -> se creo una factura rectificativa de esta
  -- 'cancelled'       -> cancelada (sin rectificativa)
  actor_id        uuid REFERENCES team_members(id),  -- null si es evento automatico (cron)
  actor_ip        inet,
  actor_type      text DEFAULT 'user',  -- 'user' | 'cron' | 'system'
  payload         jsonb  -- datos adicionales del evento (ej: CSV de AEAT, motivo de rechazo)
);

-- La tabla es APPEND-ONLY: prohibir UPDATE y DELETE via RLS y trigger
CREATE POLICY "no_update_invoice_events" ON invoice_events
  FOR UPDATE USING (false);

CREATE POLICY "no_delete_invoice_events" ON invoice_events
  FOR DELETE USING (false);

CREATE POLICY "team_insert_invoice_events" ON invoice_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "system_insert_invoice_events" ON invoice_events
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "team_read_invoice_events" ON invoice_events
  FOR SELECT TO authenticated USING (true);
```

---

### 5.18 tasks

Tareas vinculadas a proyecto o a lead. Soporta subtareas (parent_task_id), prioridades,
etiquetas (tabla task_tags), sincronización GitHub y time tracking via time_entries.

```sql
CREATE TABLE tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Relaciones (al menos uno de project_id o lead_id debe ser NOT NULL)
  project_id        uuid REFERENCES projects(id),           -- null solo si lead_id IS NOT NULL
  lead_id           uuid REFERENCES leads(id),              -- tarea de seguimiento de lead sin proyecto
  milestone_id      uuid REFERENCES milestones(id),
  parent_task_id    uuid REFERENCES tasks(id),              -- null = raiz; non-null = subtarea
  assignee_id       uuid REFERENCES team_members(id),

  CONSTRAINT tasks_context_check CHECK (
    project_id IS NOT NULL OR lead_id IS NOT NULL
  ),

  -- Contenido
  title             text NOT NULL,
  description       text,                                   -- Markdown, renderizado con react-markdown
  status            text NOT NULL DEFAULT 'todo',
  -- 'todo'        -> pendiente
  -- 'in_progress' -> en curso
  -- 'in_review'   -> esperando revision (activo solo si project.github_repo_url IS NOT NULL)
  -- 'done'        -> completada
  -- 'cancelled'   -> cancelada sin completar

  priority          text NOT NULL DEFAULT 'medium',
  -- 'urgent' | 'high' | 'medium' | 'low'

  -- Fechas
  due_date          date,
  started_at        timestamptz,
  completed_at      timestamptz,
  estimated_hours   numeric(6,2),

  -- Orden Kanban con fractional indexing (LexoRank-style).
  -- Librería: https://github.com/rocicorp/fractional-indexing
  -- Valor inicial: 'a0'. Insertar entre dos elementos: midpoint(prev, next).
  -- Nunca se recalcula en bulk; solo se actualiza la fila movida.
  kanban_order      text NOT NULL DEFAULT 'a0',

  -- GitHub sync
  github_issue_number int,
  github_issue_url    text,
  github_pr_number    int,                                  -- PR que cierra esta tarea
  github_pr_url       text,
  github_synced_at    timestamptz,

  -- Metadatos
  is_billable       bool DEFAULT true,                      -- si el tiempo registrado es facturable
  deleted_at        timestamptz                             -- soft delete
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_kanban ON tasks(project_id, status, kanban_order);
CREATE INDEX idx_tasks_github_issue ON tasks(github_issue_number) WHERE github_issue_number IS NOT NULL;
```

### 5.19 task_comments

Comentarios por tarea con soporte de menciones a team_members (@handle).
Una mención genera una notificación en tiempo real y un email si el usuario está desconectado.

```sql
CREATE TABLE task_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  task_id         uuid REFERENCES tasks(id) NOT NULL,
  author_id       uuid REFERENCES team_members(id) NOT NULL,
  body            text NOT NULL,                            -- Markdown con soporte @menciones
  mentions        uuid[] DEFAULT '{}',                      -- IDs de team_members mencionados
  edited          bool DEFAULT false,

  -- Origen del comentario (puede venir de GitHub)
  source          text DEFAULT 'crm',                       -- 'crm' | 'github'
  github_comment_id bigint                                  -- ID del comment en GitHub API
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
```

### 5.20 task_attachments (Phase 2)

Tabla diferida para MVP. En MVP los archivos se adjuntan pegando URLs o usando Supabase Storage
directamente desde el comentario (drag-and-drop a `task_comments.body` como enlace markdown).
La tabla se define aquí para que el schema esté completo, pero la UI de upload se implementa tras validar
que el equipo realmente adjunta archivos frecuentemente.

```sql
-- Phase 2: implementar cuando el volumen de adjuntos lo justifique
CREATE TABLE task_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  task_id         uuid REFERENCES tasks(id) NOT NULL,
  uploaded_by     uuid REFERENCES team_members(id) NOT NULL,
  filename        text NOT NULL,
  storage_path    text NOT NULL,  -- bucket: task-files/{task_id}/{filename}
  mime_type       text,
  size_bytes      bigint
);
```

### 5.22 task_tags

Etiquetas tipadas por proyecto con color. Sustituye el campo `tags text[]` eliminado de `tasks`.
Permite filtrado por color, autocompletado y reutilización entre tareas del mismo proyecto.

```sql
CREATE TABLE task_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  name       text NOT NULL,          -- 'bug', 'feature', 'design', 'backend'
  color      text NOT NULL DEFAULT '#6366f1',  -- hex color

  UNIQUE (project_id, name)
);

-- Relación N:M tasks <-> task_tags
CREATE TABLE task_tag_assignments (
  task_id    uuid REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id     uuid REFERENCES task_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX idx_tag_assignments_task ON task_tag_assignments(task_id);
CREATE INDEX idx_tag_assignments_tag ON task_tag_assignments(tag_id);
```

### 5.23 time_entries

Registro de tiempo trabajado por tarea. Es el núcleo del time tracking y la facturación por horas.

```sql
CREATE TABLE time_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Contexto
  task_id          uuid REFERENCES tasks(id),              -- null = tiempo de proyecto sin tarea específica
  project_id       uuid REFERENCES projects(id) NOT NULL,
  member_id        uuid REFERENCES team_members(id) NOT NULL,

  -- Tiempo
  started_at       timestamptz NOT NULL,
  ended_at         timestamptz,                            -- null = timer corriendo actualmente
  duration_minutes int GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
         ELSE NULL
    END
  ) STORED,

  -- Descripción
  description      text,                                   -- resumen de qué se hizo

  -- Facturación
  is_billable      bool NOT NULL DEFAULT true,
  hourly_rate      numeric(10,2),                          -- snapshot del rate en el momento de cerrar
  -- Cuándo se factura esta entrada:
  invoiced_at      timestamptz,                            -- null = pendiente de facturar
  invoice_id       uuid REFERENCES invoices(id)            -- null hasta que se incluya en factura
);

CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_member ON time_entries(member_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_time_entries_uninvoiced ON time_entries(project_id, is_billable)
  WHERE invoiced_at IS NULL AND ended_at IS NOT NULL;
```

**Flujo de facturación de horas:**
1. Al cerrar el proyecto o a demanda: botón "Importar horas no facturadas" en `/projects/[id]/invoices`.
2. La API lee `time_entries WHERE project_id = X AND is_billable = true AND invoiced_at IS NULL AND ended_at IS NOT NULL`.
3. Agrupa por `member_id`, calcula `duration_minutes * hourly_rate / 60`.
4. Genera `line_items` en la nueva factura con descripción "Horas [Nombre] — [periodo]".
5. UPDATE `time_entries.invoiced_at = now(), invoice_id = nueva_factura.id`.

**Timer activo:**
- Solo puede haber 1 `time_entry` con `ended_at IS NULL` por `member_id` a la vez (validado en API route).
- UI: botón "▶ Iniciar" en el TaskSheet. Badge en la sidebar cuando hay un timer corriendo.

### 5.24 notification_preferences

Controla qué notificaciones recibe cada miembro y por qué canal, evitando que los usuarios
desactiven toda notificación por saturación de emails innecesarios.

```sql
CREATE TABLE notification_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid REFERENCES team_members(id) NOT NULL,
  event_type  text NOT NULL,
  -- Tipos de evento:
  -- 'new_lead'             -> lead nuevo desde landing
  -- 'lead_assigned'        -> lead asignado a mí
  -- 'reminder_due'         -> recordatorio vence hoy
  -- 'proposal_viewed'      -> cliente vio propuesta
  -- 'proposal_accepted'    -> cliente aceptó propuesta
  -- 'invoice_overdue'      -> factura vencida
  -- 'task_assigned'        -> tarea asignada a mí
  -- 'task_mention'         -> @mencionado en comentario
  -- 'milestone_completed'  -> milestone llega al 100%
  -- 'verifactu_error'      -> fallo en envío a AEAT
  -- 'subscription_ending'  -> suscripción próxima a vencer
  channel     text NOT NULL,  -- 'email' | 'in_app'
  enabled     bool NOT NULL DEFAULT true,

  UNIQUE (member_id, event_type, channel)
);

-- Defaults por rol (insertar al crear team_member):
-- owner/admin: todos los eventos, ambos canales
-- member: task_assigned + task_mention + reminder_due en ambos canales; resto desactivado
-- viewer: solo in_app, ningún email
```

### 5.21 milestones (ampliada)

Los milestones existían solo para representar pagos parciales de proyecto.
Se amplían para ser hitos de planificación propios, desacoplando el concepto de "entrega" del de "cobro".
Un milestone puede tener: tareas asociadas, fecha objetivo, y opcionalmente un pago vinculado.

```sql
-- Columnas nuevas sobre la definicion existente de milestones:
ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS description text,               -- descripcion del hito
  ADD COLUMN IF NOT EXISTS start_date  date,               -- fecha de inicio planificada
  ADD COLUMN IF NOT EXISTS completion_percentage int DEFAULT 0,  -- calculado por trigger (% tareas done)
  ADD COLUMN IF NOT EXISTS color       text DEFAULT '#6366f1',   -- color en la vista Gantt
  ADD COLUMN IF NOT EXISTS github_milestone_number int,    -- numero del milestone en GitHub
  ADD COLUMN IF NOT EXISTS is_payment_milestone bool DEFAULT false; -- true si genera factura al completarse
-- Las columnas de pago (amount, invoice_id) ya existian en la definicion original
```

---

## 6. Seguridad y RLS (Row Level Security)

Todas las tablas tienen RLS activado. El service_role_key solo se usa en API routes del servidor, nunca en el cliente.

### 6.1 Politicas por tabla

Las políticas RLS reflejan el modelo de roles: `owner > admin > member > viewer`.
El rol se lee con `(SELECT role FROM team_members WHERE id = auth.uid())`.
Para evitar N+1 en cada evaluación de política, se usa una función helper estable:

```sql
CREATE OR REPLACE FUNCTION current_member_role()
RETURNS text STABLE LANGUAGE sql AS $$
  SELECT role FROM team_members WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;
```

```sql
-- El portal publico accede via service_role en API routes, nunca directamente

-- leads: todos leen; solo member+ escribe; solo admin+ borra (soft delete)
CREATE POLICY "read_leads"   ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_leads"  ON leads FOR INSERT TO authenticated WITH CHECK (current_member_role() IN ('owner','admin','member'));
CREATE POLICY "update_leads" ON leads FOR UPDATE TO authenticated USING (current_member_role() IN ('owner','admin','member'));
CREATE POLICY "delete_leads" ON leads FOR DELETE TO authenticated USING (current_member_role() IN ('owner','admin'));

-- proposals: lectura publica por token via service_role; escritura solo member+
CREATE POLICY "team_all_proposals" ON proposals FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

-- invoices: member+ crea; admin+ puede anular (status='cancelled'); owner+ accede a settings fiscales
CREATE POLICY "team_read_invoices"   ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_insert_invoices" ON invoices FOR INSERT TO authenticated
  WITH CHECK (current_member_role() IN ('owner','admin','member'));
CREATE POLICY "team_update_invoices" ON invoices FOR UPDATE TO authenticated
  USING (current_member_role() IN ('owner','admin','member'));
-- Borrar facturas: NUNCA permitido por RLS (Verifactu - integridad legal).
CREATE POLICY "no_delete_invoices" ON invoices FOR DELETE USING (false);

-- activities: todos leen; solo service_role inserta (los triggers lo hacen server-side)
CREATE POLICY "team_read_activities"   ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_insert_activities" ON activities FOR INSERT TO service_role WITH CHECK (true);

-- email_templates, services_catalog: member+ escribe
CREATE POLICY "team_all_templates" ON email_templates FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));
CREATE POLICY "viewer_read_templates" ON email_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "team_all_services" ON services_catalog FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

-- tasks, task_comments: member+ escribe; viewer solo lee
CREATE POLICY "read_tasks"  ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_tasks" ON tasks FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

CREATE POLICY "read_task_comments"  ON task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_task_comments" ON task_comments FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

CREATE POLICY "read_task_attachments"  ON task_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_task_attachments" ON task_attachments FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

-- time_entries: cada miembro ve/edita las suyas; admin+ ve todas
CREATE POLICY "read_own_time_entries" ON time_entries FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR current_member_role() IN ('owner','admin'));
CREATE POLICY "write_own_time_entries" ON time_entries FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- notification_preferences: cada miembro gestiona las suyas
CREATE POLICY "own_notification_prefs" ON notification_preferences FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- task_tags + task_tag_assignments: member+ gestiona
CREATE POLICY "team_all_task_tags" ON task_tags FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));
CREATE POLICY "read_task_tags" ON task_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_all_tag_assignments" ON task_tag_assignments FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin','member'))
  WITH CHECK (current_member_role() IN ('owner','admin','member'));

-- team_members: todos leen (para menciones, asignaciones); solo owner/admin edita roles
CREATE POLICY "read_team_members" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_team" ON team_members FOR ALL TO authenticated
  USING (current_member_role() IN ('owner','admin'))
  WITH CHECK (current_member_role() IN ('owner','admin'));
```

### 6.1.1 2FA para owner y admin

Supabase Auth soporta TOTP nativo (`auth.mfa_factors`).
El middleware Next.js verifica `auth.aal()` (Assurance Level):

```typescript
// middleware.ts
const { data: { user } } = await supabase.auth.getUser()
const role = await getCurrentRole(user.id) // query a team_members

if (['owner', 'admin'].includes(role)) {
  const { data: { aal } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') {
    return NextResponse.redirect(new URL('/login/mfa', request.url))
  }
}
```

Configuración en settings: `/settings/security` con QR de TOTP y botón de activación.
Los `member` y `viewer` tienen 2FA opcional.

### 6.2 Acceso del portal publico

Las rutas /p/[tipo]/[token] son Next.js Server Components que:
1. Reciben el token de la URL
2. Hacen una query server-side con el supabaseAdmin (service_role)
3. Validan que el token existe y el documento no esta cancelado
4. Si no existe: redirect a /p/not-found (pagina generica sin info)
5. Nunca exponen el anon_key ni la estructura interna en el cliente

Rate limiting en rutas del portal: 30 req/min por IP (Upstash, sec. 26).

**Qué ve el cliente en el portal:**
- Sus propuestas (`/p/proposal/[token]`): aceptar, rechazar, descargar PDF.
- Sus facturas (`/p/invoice/[token]`): ver, descargar PDF, QR Verifactu.
- **NO ve** tareas ni comentarios internos del equipo.
- **SÍ ve** milestones (si se implementa portal de proyecto en Phase 2): solo `name`,
  `due_date` y `completion_percentage` — nunca los comentarios ni detalles de tareas.

### 6.3 Middleware de autenticacion

```typescript
// middleware.ts
export const config = {
  matcher: ['/(dashboard)/:path*', '/api/crm/:path*']
}
// Rutas protegidas: todo bajo /(dashboard) y /api/crm
// Rutas publicas: /login, /p/:path*, /api/portal/:path*
```

---

## 7. Cumplimiento fiscal Espana

### 7.1 Requisitos legales de factura (Espana)

Segun el articulo 6 del Real Decreto 1619/2012, una factura valida en Espana debe contener:

1. Numero de factura: correlativo y sin saltos (F-2026-001, F-2026-002...)
2. Fecha de emision
3. Datos del emisor: nombre/razon social, NIF, domicilio
4. Datos del receptor: nombre/razon social, NIF, domicilio (si es empresa o autonomo)
5. Descripcion de los servicios prestados
6. Base imponible (subtotal sin IVA)
7. Tipo de IVA aplicado (21% servicios digitales generalmente)
8. Cuota de IVA (importe del IVA)
9. Total a pagar

### 7.2 Datos del emisor (fijos en el sistema)

```typescript
const EMISOR = {
  razon_social: 'DOSCIENTOS DESARROLLO TECNOLOGICO, S.L.',
  nif: '',          // rellenar antes de produccion
  domicilio: '',    // rellenar antes de produccion
  ciudad: 'Barcelona',
  cp: '',
  pais: 'ES',
  email: 'hola@doscientos.es',
  iban: '',         // para indicar cuenta bancaria en la factura
}
```

Estos datos se guardan en una tabla `settings` (clave-valor) configurable desde la app:

```sql
CREATE TABLE settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);
-- Claves: emisor_razon_social, emisor_nif, emisor_domicilio, emisor_ciudad, emisor_cp, emisor_iban
```

### 7.3 IRPF

DOSCIENTOS DESARROLLO TECNOLOGICO, S.L. es una Sociedad Limitada.
Las SL NO aplican retencion de IRPF en sus facturas.
El sistema NO debe incluir campo de IRPF en las facturas.
Documentado aqui para evitar confusion al implementar.

### 7.4 Numeracion correlativa

La secuencia de facturas es anual y correlativa. No puede haber saltos.
Si una factura se cancela, se anota como 'cancelled' pero el numero NO se reutiliza.
La funcion next_invoice_number() (definida en seccion 5.6) garantiza esto.
Las facturas en borrador ('draft') NO consumen numero; el numero se asigna al cambiar a 'sent'.

### 7.5 Conservacion de facturas

Obligacion legal: conservar facturas durante 5 anios.
El sistema no puede eliminar facturas, solo cancelarlas (status: 'cancelled').
Los admins no tienen permiso de DELETE en la tabla invoices, solo UPDATE.

### 7.6 Cumplimiento Verifactu / SIF (RD 1007/2023)

#### Contexto legal

El Real Decreto 1007/2023 y la Orden HAC/1177/2024 obligan a todas las empresas
con domicilio fiscal en Espana a usar un Sistema Informatico de Facturacion (SIF)
que garantice la integridad, inalterabilidad y trazabilidad de los registros de facturacion.

Plazo para DOSCIENTOS DESARROLLO TECNOLOGICO, S.L. (sujeto al IS): 1 enero 2027.
El servicio de la AEAT esta en produccion desde el 23 de abril de 2025 y acepta
envios voluntarios desde esa fecha. Se recomienda activarlo en cuanto el CRM este listo.

Modalidad elegida: VERI*FACTU (envio en tiempo real a la AEAT).
Ventaja frente a No-Verifactu: menor carga tecnica interna (la AEAT avala la inalterabilidad),
QR verificable por el cliente en sede.agenciatributaria.gob.es, y menor riesgo de sancion.

#### 7.6.1 Hash chain (cadena de huellas)

Cada factura emitida debe incluir una huella SHA-256 que encadena el registro con el anterior.
Si alguien modifica o borra una factura, la huella del siguiente registro dejaria de coincidir,
lo que hace la manipulacion detectable por la AEAT.

Campos implicados en el calculo del hash (segun Anexo I de la Orden HAC/1177/2024):
- NIF del emisor
- Numero de factura
- Fecha de expedicion
- Tipo de factura (F1 = normal, R1-R5 = rectificativa)
- Cuota de IVA
- Total de la factura
- Huella del registro anterior (previous_hash)
- Fecha y hora de generacion del registro (timestamp ISO 8601)

```typescript
// lib/verifactu/hash.ts
import { createHash } from 'crypto'

export function computeInvoiceHash(fields: {
  nif_emisor: string
  invoice_number: string
  issue_date: string        // 'YYYY-MM-DD'
  invoice_type: string      // 'F1' | 'R1' | ...
  tax_amount: string        // importe IVA, 2 decimales
  total: string             // total factura, 2 decimales
  previous_hash: string | null
  generated_at: string      // ISO 8601 con timezone
}): string {
  // La cadena canonizada sigue el orden exacto del Anexo I
  const canonical = [
    fields.nif_emisor,
    fields.invoice_number,
    fields.issue_date,
    fields.invoice_type,
    fields.tax_amount,
    fields.total,
    fields.previous_hash ?? '',
    fields.generated_at,
  ].join('&')

  return createHash('sha256').update(canonical, 'utf8').digest('hex').toUpperCase()
}
```

#### 7.6.2 Firma digital y envio XML a la AEAT

El registro de facturacion debe firmarse con el certificado digital de la empresa
(representante de persona juridica emitido por FNMT o Camerfirma) antes de enviarse.

El certificado se almacena como variable de entorno en Vercel (nunca en el repo):
- VERIFACTU_CERT_P12_BASE64: certificado .p12 codificado en base64
- VERIFACTU_CERT_PASSWORD: contrasena del .p12

Modulos necesarios en lib/verifactu/:

```
lib/verifactu/
  hash.ts       -- computeInvoiceHash() descrito arriba
  xml.ts        -- buildRegistroFacturacion() -> XML segun XSD de AEAT
  sign.ts       -- signXml() -> firma el XML con node-forge usando el certificado
  client.ts     -- sendToAeat() -> cliente SOAP, envia a AEAT, parsea respuesta
  qr.ts         -- buildQrUrl() + generateQrPng() -> URL y PNG del QR tributario
  utils.ts      -- formatDecimal(), formatDate(), getLastInvoiceHash()
```

Endpoints AEAT (SOAP over HTTPS):
- Test (homologacion): https://prewww1.aeat.es/wlpl/TIKE-WFCS/ws/VeriFactu/RecepcionFacturas
- Produccion:          https://www1.aeat.es/wlpl/TIKE-WFCS/ws/VeriFactu/RecepcionFacturas

La variable VERIFACTU_ENV = 'test' | 'prod' determina cual usar.
Arrancar siempre en 'test'. Cambiar a 'prod' tras validar con Hacienda.

#### 7.6.3 Flujo de emision de una factura

1. El equipo hace clic en "Emitir factura" (o el cron de recurrentes la genera).
2. El sistema obtiene la ultima factura emitida para recuperar su current_hash (sera el previous_hash del nuevo registro).
3. Se calcula el current_hash de la nueva factura con computeInvoiceHash().
4. Se insertan en la BD los campos: current_hash, previous_hash, chain_sequence, verifactu_status='pending', issued_by_user_id, issued_from_ip.
5. Los pasos 2-4 se ejecutan dentro de una transaccion con SELECT FOR UPDATE en la fila anterior para evitar race conditions.
6. El cron verifactu-send (sec. 17.4) recoge los registros 'pending', construye el XML, lo firma y lo envia a la AEAT.
7. Si la AEAT acepta: UPDATE verifactu_status='accepted', verifactu_csv=<CSV>, INSERT en invoice_events tipo 'verifactu_accepted'.
8. Si la AEAT rechaza: UPDATE verifactu_status='rejected', verifactu_error=<motivo>, INSERT en invoice_events tipo 'verifactu_rejected'. El equipo ve la factura marcada en rojo en el dashboard para revisar manualmente.
9. Si hay error de red: UPDATE verifactu_status='error', incrementar verifactu_retry_count. Reintento exponencial (max 5 intentos). Si se superan 5: alerta por email al equipo.

#### 7.6.4 Codigo QR tributario

Cada factura emitida muestra un QR que el cliente puede escanear para verificar su autenticidad en la sede de la AEAT. Es obligatorio en la representacion grafica de la factura (PDF y portal).

La URL que codifica el QR tiene el formato definido por la AEAT:
```
https://www2.agenciatributaria.gob.es/wlpl/AVAC-CALC/VerificadorQR?
  nif=<NIF_EMISOR>
  &numserie=<INVOICE_NUMBER>
  &fecha=<DD-MM-YYYY>
  &importe=<TOTAL>
```

Junto al QR debe aparecer el texto obligatorio:
"Factura verificable en la Sede Electronica de la Agencia Tributaria (AEAT)"

El PNG del QR se genera con la libreria qrcode y se sube a Supabase Storage
(bucket: invoices-qr, acceso publico) para incluirlo en el PDF CSS print.

#### 7.6.5 Facturas rectificativas

La normativa prohibe modificar una factura emitida. Para corregir un error se emite
una factura rectificativa (campo is_rectification=true, serie distinta: R-2026-001).

Tipos segun RD 1619/2012 art.15 y Orden HAC/1177/2024:
- R1: error fundado en derecho (el caso mas habitual: importe incorrecto, datos erroneos)
- R4: simplificada rectificativa (no aplica para facturas B2B con NIF del receptor)
- R5: diferencias (cuando solo se rectifica la diferencia, no la totalidad)

La serie de rectificativas es independiente de la serie de facturas normales.
El sistema debe gestionar una secuencia invoice_seq_rect_{YYYY} separada.

Flujo UI para emitir una rectificativa:
1. En la ficha de la factura emitida: boton "Emitir factura rectificativa".
2. Modal: selector de tipo (R1/R5), campo de texto con el motivo, preview del documento.
3. Al confirmar: se crea una nueva invoice con is_rectification=true, rectified_invoice_id, y se envia a Verifactu como tipo R1/R5.
4. La factura original queda con status='rectified' (no 'cancelled') y enlaza a la rectificativa.

#### 7.6.6 Certificado digital - gestion segura

El certificado (.p12) NUNCA se sube al repositorio de git.
El archivo .gitignore debe incluir *.p12 y *.pfx.

Flujo de configuracion:
1. Exportar el certificado a .p12 desde el navegador o desde la FNMT.
2. Convertir a base64: `base64 -i cert.p12 | tr -d '\n'`
3. Copiar el resultado como valor de VERIFACTU_CERT_P12_BASE64 en Vercel (Environment Variables, entorno Production y Preview por separado).
4. En el codigo, cargar el certificado: `Buffer.from(process.env.VERIFACTU_CERT_P12_BASE64!, 'base64')`

El certificado tiene una validez de 2-4 anios. Registrar la fecha de caducidad en settings
(clave: verifactu_cert_expires_at) y emitir alerta al equipo 30 dias antes.

---

## 8. Sistema de interacciones y seguimiento

### 8.1 UX de la vista de un lead

```
+----------------------------------+------------------------------------------+
|  INFO DEL LEAD                   |  ACTIVIDAD Y SEGUIMIENTO                 |
|                                  |                                          |
|  Nombre: [texto]                 |  [+ Anadir] v                            |
|  Email:  [texto]                 |  [Llamada] [Email] [WhatsApp] [Reunion]  |
|  Telefono: [texto]               |  [Nota interna]                          |
|  Empresa: [texto]                |  ------------------------------------    |
|  Presupuesto: [select]           |  RECORDATORIO ACTIVO                     |
|  Estado: [select con color]      |  "Llamar el lunes 26 mayo"               |
|  Asignado a: [avatar]            |  [Hecho] [Posponer]                      |
|                                  |  ------------------------------------    |
|  RESUMEN IA                      |  TIMELINE (orden cronologico inverso)    |
|  [✨ Resumir con IA]             |                                          |
|  "Interesado en web + ecommerce. |  HOY - Pol                               |
|   Espera propuesta esta semana." |  [Llamada] 12 min - Interesado           |
|                                  |  "Quiere propuesta para el viernes"      |
|  Temperatura: [HOT badge rojo]   |                                          |
|  [Sugerir siguiente paso]        |  AYER - Sistema                          |
|                                  |  [Lead recibido] desde doscientos.es     |
+----------------------------------+------------------------------------------+
```

### 8.2 Quick-add de interaccion (objetivo: menos de 20 segundos)

1. Click en [+ Anadir] abre un dropdown con iconos grandes
2. Al seleccionar tipo se abre un Popover (no pagina nueva) con:
   - Outcome (select): Sin respuesta / Buzon / Interesado / No interesado / Seguimiento
   - Notas (textarea, opcional, placeholder con sugerencia segun tipo)
   - Duracion en minutos (solo llamadas y reuniones)
   - Toggle: Crear recordatorio de seguimiento (si activo: date picker + tipo)
3. Click Guardar: Server Action -> insert en lead_interactions + update leads + insert reminder si aplica
4. El timeline se actualiza via router.refresh() sin recargar la pagina

### 8.3 Email desde el CRM

Modal con:
- Para: (pre-relleno, editable)
- Asunto: (texto libre o selector de plantilla que precarga asunto y cuerpo)
- Cuerpo: (editor simple con soporte de variables {{nombre}}, {{empresa}}, etc.)
- Preview antes de enviar

Al enviar: POST /api/crm/interactions/send-email -> Resend -> graba en lead_interactions con resend_email_id.

### 8.4 Vista global de recordatorios (/reminders)

```
HOY
  [ALTA]  [Llamar]   Empresa X - "Confirmar presupuesto"        [Hecho] [Posponer]
  [MEDIA] [Email]    Lead Y - "Enviar dossier de servicios"      [Hecho] [Posponer]

MANANA
  [BAJA]  [Reunion]  Cliente Z - "Kick-off del proyecto"         [Hecho] [Posponer]

PASADO
  [ALTA]  [Llamar]   Lead W - "Recordatorio vencido hace 2 dias" [Hecho] [Ignorar]
```

Cron a las 8:00 cada dia laborable: email al equipo con los recordatorios del dia.

---

## 9. Portal publico de cliente

### 9.1 Rutas publicas

```
/p/proposal/[token]   Vista del presupuesto para el cliente
/p/invoice/[token]    Vista de la factura para el cliente
/p/not-found          Pagina generica si el token no existe (sin info sensible)
```

### 9.2 Comportamiento de la vista de propuesta

- Server Component: carga todos los datos server-side con supabaseAdmin
- Al cargar: incrementa proposals.view_count, actualiza last_viewed_at, registra en activities
- Muestra: logo doscientos, info del cliente, lineas del presupuesto, intro, condiciones, total con IVA
- Botones disponibles:
  - [Aceptar propuesta]: abre modal de confirmacion -> Server Action -> status = 'accepted', notifica al equipo por email
  - [Rechazar]: abre modal con textarea para motivo -> status = 'rejected', notifica al equipo
  - [Descargar PDF]: window.print() con CSS @media print optimizado (sin sidebar ni botones)
- Si status = 'accepted' o 'rejected': muestra estado en lugar de botones (readonly)
- Si status = 'expired': muestra mensaje de propuesta expirada, CTA para contactar

### 9.3 Tracking de apertura (evento 'viewed')

Cada vez que el cliente abre la URL se registra en activities:
```typescript
{
  entity_type: 'proposal',
  entity_id: proposal.id,
  action: 'viewed',
  actor_type: 'client',
  metadata: { ip, user_agent, view_count }
}
```
Esto aparece en el timeline interno del lead/proyecto para que el equipo vea "Cliente vio la propuesta 3 veces".

### 9.4 CSS @media print para PDF

```css
@media print {
  .no-print { display: none !important; }  /* sidebar, botones, topbar */
  body { background: white; color: black; font-size: 11pt; }
  .invoice-content { max-width: 100%; padding: 0; }
  /* Evitar corte de pagina en tablas */
  tr { page-break-inside: avoid; }
}
```

---

## 10. Dashboard Home - KPIs y metricas

La pagina de inicio muestra:

### 10.1 KPI cards (fila superior)

- Leads nuevos este mes (con delta vs mes anterior)
- Propuestas pendientes de respuesta (count)
- Facturacion del mes (EUR, con delta)
- Facturas vencidas sin pagar (count, en rojo si > 0)

### 10.2 Graficos

- Leads por mes (ultimos 6 meses) - bar chart simple con recharts
- Pipeline de leads (donut por status: new, contacted, qualified, lost, converted)
- Ingresos mensuales (linea, ultimos 12 meses)

### 10.3 Actividad reciente

Lista de las ultimas 20 activities del sistema ordenadas por created_at DESC.
Formato: [icono tipo] [texto legible] [tiempo relativo] - "Pol envio propuesta a Empresa X - hace 2 horas"

### 10.4 Recordatorios del dia

Panel lateral derecho con los recordatorios de hoy del usuario logueado.

---

## 11. Busqueda global y filtros

### 11.1 Buscador global (topbar)

Shortcut: Cmd+K / Ctrl+K abre el Command component de shadcn.
Busca en tiempo real en: leads (nombre, empresa, email), clientes, proyectos, propuestas, facturas.
Navega directo a la entidad al seleccionar.
Implementar con una API route que consulta multiples tablas en paralelo con Promise.all.

### 11.2 Filtros por seccion

Leads:
- Status (multi-select): new, contacted, qualified, lost, converted
- Asignado a (select)
- Budget (multi-select)
- Source (select)
- Fecha de creacion (rango)
- Temperature IA (hot/warm/cold)

Propuestas:
- Status: draft, sent, accepted, rejected, expired
- Cliente (select con busqueda)
- Rango de importe total
- Fecha de envio (rango)

Facturas:
- Status: draft, sent, paid, overdue, cancelled
- Cliente
- Rango de importe
- Fecha de vencimiento (rango)
- Metodo de pago

### 11.3 Paginacion

Cursor-based pagination en tablas grandes (leads, activities).
Page-based (limit/offset) en tablas pequenas (propuestas, facturas).
Default page size: 25 items. Opciones: 25, 50, 100.

---

## 12. Arquitectura tecnica

### 12.1 Server Components vs Client Components

Regla: por defecto todo es Server Component. Marcar 'use client' solo cuando sea estrictamente necesario.

Server Components (sin 'use client'):
- Todas las paginas del dashboard que solo muestran datos
- El portal publico /p/[tipo]/[token]
- Layout del sidebar y topbar

Client Components (con 'use client'):
- Formularios interactivos (react-hook-form)
- Kanban de leads (drag and drop con @dnd-kit)
- Buscador global con Command
- Popover de quick-add interaccion
- Editor Tiptap (documentos)
- Graficos del dashboard (recharts)
- Toggle de modo claro/oscuro

### 12.2 Server Actions vs API Routes

Server Actions para:
- Crear/editar/cambiar status de cualquier entidad (leads, propuestas, facturas, etc.)
- Registrar interacciones
- Marcar recordatorios como hechos
- Aceptar/rechazar propuesta desde el portal (accion del cliente)

API Routes (/api/*) para:
- Envio de email (necesita logica async compleja con Resend)
- Webhook de Stripe (fase 2)
- Cron jobs (llamados por Vercel Cron)
- Generacion de IA (llamadas a OpenAI que pueden tardar)
- Busqueda global (consultas paralelas a multiples tablas)

### 12.3 Manejo de errores

- Server Actions: devuelven { error: string } | { data: T }, nunca hacen throw al cliente
- API Routes: responden con status HTTP correcto y { error: string } en el body
- UI: usar sonner (toast) para mostrar errores y exitos al usuario
- Portal publico: cualquier error redirige a /p/not-found (sin info sensible)
- Logs: console.error en servidor + (fase 2) Sentry para errores de produccion

### 12.4 Actualizaciones optimistas

Usar useOptimistic de React 19 en:
- Cambio de status de lead en kanban (drag and drop)
- Marcar reminder como hecho
- Thumbs up/down de propuesta en el portal

### 12.5 Estado global (Zustand)

Store para:
- Estado del sidebar (expandido/colapsado)
- Filtros activos de cada seccion (persisten al navegar entre paginas)
- Usuario logueado (extraido del layout, disponible en todos los Client Components)

---

## 13. Estructura de rutas (Next.js App Router)

```
app/
+-- layout.tsx                    (root layout, fuentes, providers)
+-- (auth)/
|   +-- login/page.tsx            (formulario login, redirige si ya autenticado)
|
+-- (dashboard)/                  (layout protegido via middleware)
|   +-- layout.tsx                (sidebar + topbar + providers)
|   +-- page.tsx                  (home: KPIs, actividad, recordatorios hoy)
|   +-- leads/
|   |   +-- page.tsx              (kanban + vista tabla, filtros)
|   |   +-- [id]/page.tsx         (ficha lead: info + timeline + recordatorios)
|   +-- clients/
|   |   +-- page.tsx              (tabla de clientes con filtros)
|   |   +-- [id]/page.tsx         (perfil cliente: proyectos, propuestas, facturas, docs)
|   +-- projects/
|   |   +-- page.tsx              (tabla de proyectos)
|   |   +-- [id]/page.tsx         (detalle proyecto: milestones, docs, team)
|   +-- proposals/
|   |   +-- page.tsx              (tabla de propuestas con filtros)
|   |   +-- new/page.tsx          (crear propuesta)
|   |   +-- [id]/page.tsx         (editor de propuesta + line items)
|   |   +-- [id]/preview/page.tsx (preview = exactamente lo que ve el cliente)
|   +-- invoices/
|   |   +-- page.tsx              (tabla de facturas con filtros)
|   |   +-- [id]/page.tsx         (detalle + cambio de estado)
|   +-- reminders/
|   |   +-- page.tsx              (lista global agrupada por dia)
|   +-- documents/
|   |   +-- page.tsx              (biblioteca de documentos internos)
|   |   +-- [id]/page.tsx         (editor Tiptap del documento)
|   +-- settings/
|       +-- page.tsx              (datos del emisor, IBAN, templates, catalogo servicios)
|
+-- p/                            (portal publico, sin auth, sin layout dashboard)
|   +-- layout.tsx                (layout minimalista: solo logo + footer)
|   +-- proposal/[token]/page.tsx (vista propuesta para el cliente)
|   +-- invoice/[token]/page.tsx  (vista factura para el cliente)
|   +-- not-found/page.tsx        (pagina generica de token no encontrado)
|
+-- api/
    +-- crm/
    |   +-- interactions/
    |   |   +-- send-email/route.ts   (envio email desde CRM via Resend)
    |   +-- ai/
    |       +-- summarize-lead/route.ts  (resumen IA del lead)
    |       +-- draft-email/route.ts     (borrador email con IA)
    +-- portal/
    |   +-- proposal/accept/route.ts    (Server Action alternativo para el portal)
    +-- cron/
        +-- daily-reminders/route.ts             (email diario de recordatorios)
        +-- overdue-invoices/route.ts            (marcar facturas vencidas + email)
        +-- generate-recurring-invoices/route.ts (genera facturas de suscripciones)
        +-- verifactu-send/route.ts              (envia registros pendientes a la AEAT)
    +-- github/
        +-- webhook/route.ts                     (recibe eventos de GitHub App)
        +-- create-issue/route.ts                (crea issue en GitHub desde tarea CRM)
```

---

## 14. Componentes clave

### 14.1 Layout

- `<Sidebar>` — nav con iconos, colapsable, badge en Recordatorios
- `<Topbar>` — breadcrumb dinamico, buscador global (Command), campana notificaciones
- `<PageHeader>` — titulo + descripcion + acciones (boton crear, filtros)

### 14.2 Leads

- `<LeadKanban>` — columnas por status con @dnd-kit, cada card muestra avatar, empresa, temperatura IA, dias sin contacto
- `<LeadCard>` — card del kanban, con indicador de temperatura (borde coloreado)
- `<LeadTimeline>` — lista de interactions + activities ordenadas por fecha
- `<InteractionQuickAdd>` — popover con formulario segun tipo de interaccion
- `<ReminderBanner>` — banner del recordatorio activo con botones Hecho/Posponer
- `<AiSummaryCard>` — tarjeta con resumen IA, temperatura, siguiente paso sugerido, boton refresh

### 14.3 Documentos (propuestas y facturas)

- `<LineItemsEditor>` — tabla editable con drag-and-drop, selector de catalogo, totales en tiempo real
- `<ProposalPreview>` — vista readonly de la propuesta (igual que lo ve el cliente)
- `<InvoiceView>` — vista de factura con todos los datos legales, CSS print optimizado
- `<DocumentStatusBadge>` — badge con color segun status de la entidad
- `<SendDocumentModal>` — modal para enviar link por email al cliente con preview del email

### 14.4 Generales

- `<DataTable>` — wrapper de @tanstack/react-table con paginacion, filtros, sorting
- `<EmptyState>` — ilustracion + texto + CTA cuando no hay datos
- `<ConfirmDialog>` — dialog de confirmacion reutilizable para acciones destructivas
- `<ActivityFeed>` — lista de activities con iconos, actor, tiempo relativo
- `<StatsCard>` — card de KPI con valor, label, delta y color segun tendencia

---

## 15. Email templates (via React Email)

Todos los emails se construyen con @react-email/components para garantizar compatibilidad cross-client.
Las plantillas viven en /emails/ en la raiz del proyecto.

Emails del sistema (automaticos):

| Template | Trigger | Destinatario |
|---|---|---|
| new-lead.tsx | Lead nuevo desde landing | Equipo |
| proposal-sent.tsx | Equipo envia propuesta | Cliente |
| proposal-accepted.tsx | Cliente acepta | Equipo |
| proposal-rejected.tsx | Cliente rechaza | Equipo |
| invoice-sent.tsx | Equipo envia factura | Cliente |
| invoice-overdue.tsx | Factura vencida (cron) | Cliente |
| verifactu-alert.tsx | Factura rechazada por AEAT o max reintentos alcanzado | Equipo |
| verifactu-cert-expiry.tsx | Certificado digital a 30 dias de caducar | Equipo |
| recurring-invoice-ready.tsx | Cron genera factura recurrente (auto_send_email=false) | Equipo |
| recurring-invoice-sent.tsx | Cron genera y envia factura recurrente (auto_send_email=true) | Cliente |
| subscription-ending.tsx | Cron: subscription con end_date a 15 dias vista | Equipo |
| daily-reminders.tsx | Cron 8:00 dias lab. | Cada miembro equipo |
| crm-email.tsx | Email manual desde CRM | Lead/Cliente |

Variables comunes disponibles en todos: nombre_cliente, empresa, url_documento, nombre_agente, fecha.

Estilo de los emails: mismo que la landing (fondo blanco, texto negro, acento negro, fuente Inter, logo doscientos).

---

## 16. Storage (Supabase Storage)

### 16.1 Buckets

| Bucket | Acceso | Uso |
|---|---|---|
| documents | private | Archivos adjuntos a documentos internos |
| avatars | public | Avatares de team_members |

### 16.2 Naming convention

documents/{project_id}/{document_id}/{filename}
avatars/{team_member_id}/avatar.{ext}

### 16.3 Politicas

documents: solo team_members autenticados pueden leer y escribir.
avatars: lectura publica, escritura solo el propio usuario o admin.

---

## 17. Cron jobs (Vercel Cron)

Configuracion en vercel.json:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 7 * * 1-5"
    },
    {
      "path": "/api/cron/overdue-invoices",
      "schedule": "0 8 * * 1-5"
    },
    {
      "path": "/api/cron/generate-recurring-invoices",
      "schedule": "0 6 * * *"
      // IMPORTANTE: debe correr ANTES que verifactu-send (06:00 vs 06:15)
      // para que las facturas recurrentes generadas entren en el mismo envío a AEAT del día
    },
    {
      "path": "/api/cron/verifactu-send",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Horario: 8:00 hora espana = 7:00 UTC en verano (CEST), 8:00 UTC en invierno (CET).
Usar date-fns-tz para calcular correctamente.

Seguridad: cada API route de cron valida el header CRON_SECRET:
```typescript
if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 17.1 daily-reminders

Logica:
1. Consultar reminders WHERE status = 'pending' AND due_at <= hoy 23:59 (hora Madrid)
2. Agrupar por assigned_to
3. Para cada miembro con recordatorios: enviar email con template daily-reminders.tsx
4. Tambien incluir reminders vencidos de dias anteriores (overdue)

### 17.2 overdue-invoices

Logica:
1. Consultar invoices WHERE status = 'sent' AND due_date < hoy
2. Para cada una: UPDATE status = 'overdue'
3. Enviar email al cliente con template invoice-overdue.tsx
4. Registrar en activities

### 17.3 generate-recurring-invoices

Ejecucion diaria a las 06:00 UTC (08:00 Madrid en verano, 07:00 en invierno).

Logica completa (todo en una transaccion por subscription):

1. SELECT * FROM subscriptions WHERE status = 'active' AND next_invoice_date <= CURRENT_DATE
2. Para cada subscription:
   a. Calcular billing_period_start y billing_period_end segun billing_cycle
   b. INSERT en invoices con:
      - client_id = subscription.client_id
      - project_id = subscription.project_id
      - subscription_id = subscription.id
      - is_recurring = true
      - billing_period_start, billing_period_end
      - invoice_number = nextval('invoice_seq')
      - issue_date = CURRENT_DATE
      - due_date = CURRENT_DATE + subscription.payment_terms_days
      - status = 'draft' si auto_send_email=false, 'sent' si true
   c. INSERT en line_items: 1 fila con name + description + amount + tax_rate de la subscription
   d. UPDATE subscriptions SET
      - last_invoiced_at = now()
      - next_invoice_date = next_invoice_date + INTERVAL segun billing_cycle
   e. INSERT en activities con kind = 'recurring_invoice_generated'
3. Segun el flag auto_send_email:
   - true: enviar email al cliente con template recurring-invoice-sent.tsx, status 'sent', sent_at = now()
   - false: enviar email al equipo con template recurring-invoice-ready.tsx para que revisen y envien manualmente
4. Si subscription.end_date <= now() + INTERVAL '15 days' y aun no se notifico: enviar subscription-ending.tsx al equipo

Esqueleto del API route:

```typescript
// app/api/cron/generate-recurring-invoices/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const today = formatInTimeZone(new Date(), 'Europe/Madrid', 'yyyy-MM-dd')

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, client:clients(*)')
    .eq('status', 'active')
    .lte('next_invoice_date', today)

  const results = { created: 0, sent: 0, errors: [] as string[] }

  for (const sub of subs ?? []) {
    try {
      const { period_start, period_end, next_date } = computeBillingPeriod(sub)
      const status = sub.auto_send_email ? 'sent' : 'draft'

      const { data: invoice } = await supabase.rpc('create_recurring_invoice', {
        p_subscription_id: sub.id,
        p_period_start: period_start,
        p_period_end: period_end,
        p_status: status
      })

      await supabase.from('subscriptions').update({
        last_invoiced_at: new Date().toISOString(),
        next_invoice_date: next_date
      }).eq('id', sub.id)

      if (sub.auto_send_email) {
        await sendInvoiceEmail(invoice, sub.client, 'recurring-invoice-sent')
        results.sent++
      } else {
        await sendTeamEmail(invoice, sub.client, 'recurring-invoice-ready')
      }
      results.created++
    } catch (e: any) {
      results.errors.push(`sub ${sub.id}: ${e.message}`)
    }
  }

  return Response.json(results)
}
```

La funcion `create_recurring_invoice` es un RPC en Postgres que crea invoice + line_item + activity en una transaccion (evita estados inconsistentes si falla a la mitad).

### 17.4 verifactu-send

Ejecucion cada 15 minutos (`*/15 * * * *`). Procesa los registros de facturacion pendientes
de envio a la AEAT. Diseno tolerante a fallos: cada factura se procesa de forma independiente;
un error en una no bloquea las demas.

Logica completa:

1. SELECT * FROM invoices
   WHERE verifactu_status IN ('pending', 'error')
   AND verifactu_retry_count < 5
   ORDER BY chain_sequence ASC          -- respetar el orden de la cadena
   LIMIT 50                             -- procesar en lotes para no superar el timeout de Vercel

2. Para cada factura:
   a. Obtener el certificado: Buffer.from(process.env.VERIFACTU_CERT_P12_BASE64!, 'base64')
   b. Construir el XML del registro de facturacion con buildRegistroFacturacion() (lib/verifactu/xml.ts)
   c. Firmar el XML con signXml() usando node-forge (lib/verifactu/sign.ts)
   d. Enviar al endpoint SOAP de la AEAT con sendToAeat() (lib/verifactu/client.ts)
   e. Parsear la respuesta:
      - Si OK (CodigoRespuesta=0000): UPDATE verifactu_status='accepted', verifactu_csv=<CSV>, verifactu_sent_at=now()
                                       INSERT invoice_events tipo 'verifactu_accepted', payload={csv}
      - Si error AEAT (CodigoRespuesta!=0000): UPDATE verifactu_status='rejected', verifactu_error=<desc>
                                                INSERT invoice_events tipo 'verifactu_rejected', payload={codigo, descripcion}
      - Si excepcion de red: UPDATE verifactu_status='error', verifactu_retry_count++
                              INSERT invoice_events tipo 'verifactu_error', payload={message}

3. Si verifactu_retry_count >= 5: enviar email de alerta al equipo con template verifactu-alert.tsx
   (factura bloqueada, requiere intervencion manual)

4. Retornar resumen: { processed, accepted, rejected, errors, skipped }

Esqueleto del API route:

```typescript
// app/api/cron/verifactu-send/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const cert = Buffer.from(process.env.VERIFACTU_CERT_P12_BASE64!, 'base64')
  const certPassword = process.env.VERIFACTU_CERT_PASSWORD!

  const { data: pending } = await supabase
    .from('invoices')
    .select('*, client:clients(*), issued_by:team_members(*)')
    .in('verifactu_status', ['pending', 'error'])
    .lt('verifactu_retry_count', 5)
    .order('chain_sequence', { ascending: true })
    .limit(50)

  const results = { processed: 0, accepted: 0, rejected: 0, errors: 0 }

  for (const invoice of pending ?? []) {
    try {
      const xml = buildRegistroFacturacion(invoice)
      const signedXml = signXml(xml, cert, certPassword)
      const response = await sendToAeat(signedXml, process.env.VERIFACTU_ENV as 'test' | 'prod')

      if (response.code === '0000') {
        await supabase.from('invoices').update({
          verifactu_status: 'accepted',
          verifactu_csv: response.csv,
          verifactu_sent_at: new Date().toISOString(),
          verifactu_response: response.raw,
        }).eq('id', invoice.id)
        await logInvoiceEvent(supabase, invoice.id, 'verifactu_accepted', null, { csv: response.csv })
        results.accepted++
      } else {
        await supabase.from('invoices').update({
          verifactu_status: 'rejected',
          verifactu_error: response.description,
          verifactu_response: response.raw,
        }).eq('id', invoice.id)
        await logInvoiceEvent(supabase, invoice.id, 'verifactu_rejected', null, response.raw)
        results.rejected++
      }
    } catch (e: any) {
      await supabase.from('invoices').update({
        verifactu_status: 'error',
        verifactu_error: e.message,
        verifactu_retry_count: (invoice.verifactu_retry_count ?? 0) + 1,
      }).eq('id', invoice.id)
      if ((invoice.verifactu_retry_count ?? 0) + 1 >= 5) {
        await sendVerifactuAlertEmail(invoice)
      }
      results.errors++
    }
    results.processed++
  }

  return Response.json(results)
}
```

UI en el dashboard: seccion "Verifactu" en /invoices con filtro rapido por verifactu_status.
- Facturas 'rejected': badge rojo + boton "Ver error" que muestra verifactu_error en un dialog.
- Facturas 'accepted': icono verde + CSV en tooltip.
- Facturas 'pending'/'error': icono amarillo de reloj + numero de reintentos.

UI en la ficha del cliente (/clients/[id]/page.tsx):

- Tab "Suscripciones": lista de subscriptions activas con CTA para crear nueva, pausar, cancelar.
- Tab "Facturas": las recurrentes aparecen con badge `RECURRENTE` y muestran billing_period. Las que estan en `status=draft` tienen boton primario "Revisar y enviar".
- Banner amarillo si hay facturas recurrentes en draft pendientes de envio mas de 3 dias.

---

## 18. Gestion de proyectos y tareas

### 18.1 Vistas del tablero de tareas

Cada proyecto tiene su propia sección de tareas en `/projects/[id]/tasks` con tres vistas intercambiables:

#### Vista Kanban

```
+------------------+------------------+------------------+------------------+
|   TODO           |   IN PROGRESS    |   IN REVIEW      |   DONE           |
+------------------+------------------+------------------+------------------+
| [+ Nueva tarea]  |                  |                  |                  |
|                  | #12 Diseño home  | #8 API leads     | #3 Auth          |
| #15 Navbar       |   Pol · Alta     |   Gerard · Alta  |   Gerard         |
|   Sin asignar    |   ● PR #22       |   ⚑ 28 may      |   ✓ hace 2 dias  |
|   ⚑ 1 jun       |                  |                  |                  |
|                  | #14 Tests E2E    |                  | #1 Setup repo    |
| #16 Dark mode    |   Pol · Media    |                  |   Gerard         |
|   Pol · Baja     |   ⚑ 30 may      |                  |                  |
+------------------+------------------+------------------+------------------+
```

- Drag-and-drop entre columnas con @dnd-kit (el mismo que el kanban de leads).
- Al mover a 'done': se registra completed_at, se recalcula completion_percentage del milestone.
- Al mover a 'in_review': si hay PR vinculado, aparece el badge con link al PR.
- Click en la tarjeta: panel lateral (sheet) con todos los detalles, sin navegar a nueva página.

#### Vista Lista

Tabla sortable por: prioridad, fecha límite, asignado, estado. Con filtros rápidos:
- Asignado a mí / Sin asignar / Todos
- Prioridad: Urgente / Alta / Media / Baja
- Hito (milestone)
- Tiene PR / Tiene issue GitHub / Sin vinculo

Subtareas: en la vista lista las subtareas aparecen indentadas bajo la tarea padre.
Toggle para expandir/colapsar.

#### Vista Gantt — Phase 2 (diferida)

El Gantt visual tiene ROI bajo en proyectos de agencia cortos (1-3 meses) y añade complejidad
de rendering significativa. Se difiere hasta validar que el equipo lo necesita activamente.

**MVP**: la vista Kanban + Lista cubre el 95% de los casos de uso. El campo `milestone.start_date`
y `milestone.color` están en el schema y son suficientes para mostrar los hitos en la vista Lista.

**Phase 2**: si el equipo pide Gantt, implementar con `@dnd-kit` + CSS Grid + `date-fns`.
Solo lectura en Phase 2; edición drag-and-drop en Phase 3 si procede.

### 18.2 Panel lateral de tarea (TaskSheet)

Al hacer click en cualquier tarea se abre un `<Sheet>` de shadcn desde la derecha con:

```
┌─────────────────────────────────────────────────────┐
│  [← Volver]   #15 Navbar responsive        [···]   │
├─────────────────────────────────────────────────────┤
│  Estado:   [In Progress ▼]  Prioridad: [Alta ▼]    │
│  Asignado: [Pol ▼]          Milestone:  [Sprint 1]  │
│  Inicio:   [25 may]         Límite:     [28 may]    │
│  Estimado: [4h]             Tags:       [design]    │
├─────────────────────────────────────────────────────┤
│  Descripción                                        │
│  [Textarea Markdown + preview toggle + @menciones]  │
│  (react-markdown para preview; sin Tiptap en MVP)   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  GitHub                                             │
│  Issue: #42 "Add responsive navbar"  [Abrir ↗]     │
│  PR:    #61 "feat: responsive navbar" [Abrir ↗]     │
├─────────────────────────────────────────────────────┤
│  Subtareas  [+ Añadir]                              │
│  ☑ Diseño mobile                                   │
│  ☐ Breakpoints tablet                              │
│  ☐ Tests visuales                                  │
├─────────────────────────────────────────────────────┤
│  Comentarios                                        │
│  [Pol] hace 1h                                      │
│  "He vinculado el PR. @Gerard revisa el CSS"        │
│                                                     │
│  [Escribe un comentario... @menciones soportadas]   │
│                                              [Send] │
└─────────────────────────────────────────────────────┘
```

### 18.3 Quick-add de tarea

Desde cualquier columna del kanban: clic en `[+ Nueva tarea]` abre un inline input.
Solo requiere título; el resto de campos se completan después en el panel lateral.
Al guardar: INSERT en tasks con status = columna actual, project_id = proyecto activo, kanban_order = max + 1000.

### 18.4 Menciones (@) y notificaciones

Cuando un comentario contiene `@nombre`:
1. El frontend parsea las menciones y rellena el array `mentions[]` con los UUIDs.
2. Al INSERT de `task_comments`: trigger DB llama a `pg_notify('mention', payload)`.
3. El servidor escucha via Supabase Realtime y envía email con template `task-mention.tsx` si el mencionado no ha tenido actividad en los últimos 5 minutos (evitar spam en conversaciones activas).
4. Badge de notificaciones en la sidebar muestra el conteo de menciones no leídas.

### 18.5 Progress automático de milestones

Trigger DB en `tasks` que recalcula `milestones.completion_percentage` en cada UPDATE de status:

```sql
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  total_tasks int;
  done_tasks  int;
BEGIN
  IF NEW.milestone_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO total_tasks, done_tasks
  FROM tasks
  WHERE milestone_id = NEW.milestone_id AND status != 'cancelled';

  UPDATE milestones
  SET completion_percentage = CASE WHEN total_tasks = 0 THEN 0
                                   ELSE ROUND((done_tasks::numeric / total_tasks) * 100)
                              END,
      -- Si llega al 100% y es un payment_milestone: marcar como 'completed'
      status = CASE WHEN total_tasks > 0 AND done_tasks = total_tasks THEN 'completed'
                    ELSE status
               END,
      completed_at = CASE WHEN total_tasks > 0 AND done_tasks = total_tasks THEN now()
                          ELSE completed_at
                     END
  WHERE id = NEW.milestone_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_milestone_progress
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_milestone_progress();
```

Cuando un `is_payment_milestone=true` pasa a `completed`: se registra en activities y
aparece un banner en la ficha del proyecto sugiriendo generar la factura del hito.

---

## 19. Integracion GitHub bidireccional

### 19.1 Modelo de integracion

El CRM se vincula a uno o varios repositorios GitHub de la organización a través de una
**GitHub App** instalada en la organización. Cada proyecto en el CRM puede estar asociado
a un repositorio concreto.

```sql
-- Columnas nuevas en projects:
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS github_repo_owner text,         -- ej: 'doscientos-dev'
  ADD COLUMN IF NOT EXISTS github_repo_name  text,         -- ej: 'cliente-web'
  ADD COLUMN IF NOT EXISTS github_repo_url   text;         -- URL completa al repo
```

Variable de entorno necesaria (GitHub App):
```env
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY_BASE64=    # clave privada de la GitHub App en base64
GITHUB_WEBHOOK_SECRET=            # secret para validar los webhooks entrantes
```

### 19.2 Sincronizacion CRM → GitHub

**Crear issue desde tarea:**
Cuando el equipo hace clic en "Crear issue en GitHub" desde el panel de tarea:
1. `POST /api/github/create-issue` con `task_id`.
2. La API route crea el issue en el repo vinculado al proyecto via GitHub REST API.
3. Se guarda `github_issue_number` y `github_issue_url` en la tarea.
4. El issue se crea con: título = task.title, body = task.description, labels = task.tags,
   assignees = handle de GitHub del team_member (configurado en team_members.github_handle).
5. Se registra en activities: "Issue #N creado en GitHub".

**Crear milestone en GitHub:**
Cuando se crea un milestone en el CRM con `github_milestone_number IS NULL`:
- Botón "Sincronizar con GitHub" en la UI del milestone.
- Crea el milestone en GitHub con la misma fecha límite.
- Guarda el `github_milestone_number` en la tabla.

### 19.3 Sincronizacion GitHub → CRM (webhooks)

Endpoint: `POST /api/github/webhook` — valida el header `X-Hub-Signature-256` con
`GITHUB_WEBHOOK_SECRET` antes de procesar.

Eventos que procesa:

| Evento GitHub | Acción en el CRM |
|---|---|
| `issues.opened` | Si la URL del issue contiene el prefijo del CRM (creado desde CRM), no hace nada. Si es un issue nuevo creado directo en GitHub, crea tarea en el proyecto vinculado con `status='todo'`, `source='github'`. |
| `issues.closed` | UPDATE task.status = 'done', task.completed_at = now() |
| `issues.reopened` | UPDATE task.status = 'todo', task.completed_at = null |
| `issues.assigned` | UPDATE task.assignee_id según github_handle del team_member |
| `issues.labeled` | Sincroniza task.tags con los labels del issue |
| `issue_comment.created` | INSERT task_comment con source='github', github_comment_id, body del comentario, author mapeado por github_handle |
| `pull_request.opened` | UPDATE task.github_pr_number, github_pr_url. El parser de `Closes #N` en el body del PR es frágil y se omite en MVP: el equipo vincula la tarea manualmente desde el TaskSheet si el PR no viene de CRM. |
| `pull_request.closed` + merged=true | UPDATE task.status='done' (si no lo estaba ya) |
| `pull_request.closed` + merged=false | UPDATE task.status='todo' (PR rechazado) |
| `milestone.created` | Si no existe en CRM: crear milestone en el proyecto vinculado |
| `milestone.closed` | UPDATE milestone.status='completed' |

### 19.4 Mapeo de usuarios GitHub ↔ team_members

Añadir campo `github_handle` a team_members:
```sql
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS github_handle text UNIQUE;
```

Cada miembro del equipo configura su handle de GitHub en `/settings/profile`.
El webhook usa este mapeo para asignar tareas y comentarios al miembro correcto.
Si un handle de GitHub no tiene correspondencia en team_members, los eventos se ignoran
(no se crean usuarios fantasma).

### 19.5 Vista "GitHub" en el panel de tarea

En el TaskSheet (panel lateral de tarea):
- Si `github_issue_url IS NOT NULL`: botón "Ver issue #N" que abre en nueva pestaña.
  Badge de estado del issue (open/closed) obtenido via GitHub API con cache de 5 min (SWR).
- Si `github_pr_url IS NOT NULL`: badge "PR #N" con estado (open/merged/closed) y link.
- Si no hay issue vinculado: botón "Crear issue en GitHub" (llama al endpoint 19.2).
- Sección "Commits" (opcional fase 2): lista de commits que referencian la tarea con `#task-uuid`.

---

## 20. Integracion con la landing (doscientos.es)

Cambio minimo en src/actions/index.ts de la landing:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // la landing necesita la service_role key
)

// Anadir dentro del handler de sendContact, tras el envio de email:
await supabaseAdmin.from('leads').insert({
  name, email, phone, company, budget, message,
  source: 'landing', status: 'new',
  utm_source, utm_medium, utm_campaign,
  referrer, ip, device, browser, language
})
// Notion y Google Sheets: deprecar gradualmente tras validar que Supabase funciona
```

El CRM usa Supabase Realtime para mostrar notificacion instantanea cuando llega un lead:
```typescript
supabase.channel('leads').on('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'leads' },
  (payload) => showToast('Nuevo lead: ' + payload.new.name)
).subscribe()
```

---

## 21. Automatizaciones

La tabla `activities` es el **audit log central** de la aplicación. Toda mutación significativa
(lead creado/convertido, propuesta enviada/aceptada, factura emitida/pagada, tarea completada,
issue GitHub sincronizado) debe insertar una fila en `activities`. Esto permite:
- Historial completo auditable en la ficha de cada entidad.
- Dashboard de actividad del equipo.
- Detectar anomalías (ej: muchas facturas emitidas en poco tiempo → posible bug).

**Idempotency en mutaciones críticas de facturación:**
Los endpoints `POST /api/crm/invoices` y `RPC create_recurring_invoice` aceptan el header
`Idempotency-Key: <uuid>`. Si ya existe una factura con esa key (campo `idempotency_key` en
`invoices`), la API devuelve la factura existente con HTTP 200 sin crear duplicado.
Crítico para evitar doble facturación si Vercel reintenta la request o el cron se ejecuta dos veces.

| Trigger | Accion automatica |
|---|---|
| Lead nuevo desde landing | Supabase Realtime notifica al CRM + email al equipo |
| Interaccion registrada | Trigger DB: actualiza last_interaction_at, incrementa interactions_count |
| Reminder creado | Trigger DB: actualiza next_followup_at del lead |
| Cada dia a las 8:00 (cron) | Email a cada miembro con sus recordatorios del dia |
| Reminder vencido sin resolver | Aparece resaltado en rojo en /reminders |
| Email enviado desde CRM | Registra en lead_interactions con resend_email_id |
| Propuesta enviada | Email al cliente con el link. Registra en activities. |
| Cliente abre propuesta | Incrementa view_count, registra 'viewed' en activities |
| Cliente acepta propuesta | Email al equipo. Proyecto pasa a 'active'. Registra en activities. |
| Cliente rechaza propuesta | Email al equipo con motivo. Registra en activities. |
| Factura creada desde propuesta | Pre-rellena line items, cliente, totales. Asigna invoice_number. |
| Factura enviada | Email al cliente con link. Registra en activities. |
| Factura vencida (cron 8:00) | UPDATE status = 'overdue'. Email recordatorio al cliente. |
| Subscription activa con next_invoice_date <= hoy (cron 06:00) | Crea invoice + line_item, recalcula next_invoice_date. Email al cliente o al equipo segun auto_send_email. |
| Subscription cancelada | UPDATE status='cancelled', cancelled_at=now(). No genera mas facturas. Registra en activities. |
| Subscription end_date a 15 dias | Email al equipo (subscription-ending.tsx) para renovar o avisar al cliente. |
| Factura emitida (sale de draft) | Calcula current_hash, inserta chain_sequence, verifactu_status='pending'. INSERT invoice_events 'issued'. |
| Cron verifactu-send (cada 15 min) | Envia facturas pending a AEAT. UPDATE a 'accepted' o 'rejected'. INSERT invoice_events con resultado. |
| Factura rechazada por AEAT | Badge rojo en dashboard. Email de alerta al equipo (verifactu-alert.tsx). |
| verifactu_retry_count >= 5 | Email de alerta critica al equipo. Requiere intervencion manual. |
| Emision de factura rectificativa | Crea invoice con is_rectification=true. UPDATE factura original a status='rectified'. Envia ambas a AEAT. |
| Certificado a 30 dias de caducar | Email de alerta al equipo para renovar el certificado digital en la FNMT. |
| Tarea movida a 'done' | Trigger: recalcula milestone.completion_percentage. Si llega al 100% y is_payment_milestone: banner en proyecto. |
| Comentario con @mencion | Trigger DB -> pg_notify -> email task-mention.tsx al mencionado (si inactivo >5 min). |
| GitHub issue cerrado (webhook) | UPDATE task.status = 'done', completed_at = now(). Registra en activities. |
| PR merged (webhook GitHub) | UPDATE task.status = 'done'. Si tarea no tenia PR vinculado: vincula PR. Registra en activities. |
| PR abierto con 'Closes #N' (webhook GitHub) | UPDATE task.status = 'in_review', github_pr_number, github_pr_url. |
| Issue nuevo en GitHub (no creado desde CRM) | INSERT tarea en proyecto vinculado con source='github', status='todo'. |
| Milestone 100% completo con is_payment_milestone | Banner en /projects/[id] sugiriendo generar factura del hito. Registra en activities. |
| Timer de tiempo iniciado | INSERT time_entry con ended_at=null. Valida que no haya otro timer abierto para el mismo miembro. |
| Timer detenido | UPDATE time_entry.ended_at=now(). duration_minutes calculado por columna GENERATED. |
| Botón "Importar horas no facturadas" | Lee time_entries WHERE invoiced_at IS NULL, genera line_items, UPDATE invoiced_at+invoice_id. Registra en activities. |
| Notificación enviada (email/in_app) | Solo si notification_preferences.enabled=true para ese member+event_type+channel. |

---

## 22. IA - Asistente de leads

### 22.1 Resumen de lead (POST /api/crm/ai/summarize-lead)

Input que se envia al modelo:
```
Eres un asistente de CRM para una agencia de desarrollo web.
Analiza la siguiente informacion sobre un lead y devuelve un JSON.

Lead: {nombre}, empresa: {empresa}, presupuesto: {budget}
Mensaje original: {message}
Interacciones (cronologico):
  - {fecha} | {tipo} | {outcome} | "{notas}"
  ...

Responde SOLO con este JSON sin markdown:
{
  "summary": "resumen en 2-3 frases",
  "suggested_next_step": "accion concreta recomendada",
  "temperature": "hot|warm|cold",
  "confidence": 0.0-1.0
}
```

Modelo: gpt-4o-mini (coste bajo, suficiente para texto corto).
Resultado guardado en leads.ai_summary, ai_suggested_next_step, ai_temperature, ai_confidence, ai_updated_at.

### 22.2 Borrador de email (POST /api/crm/ai/draft-email)

Input: lead info + ultimas 5 interacciones + tipo de email deseado.
Output: { subject: string, body: string }
Modelo: gpt-4o.
El equipo SIEMPRE revisa y edita antes de enviar. Nunca envio automatico.

### 22.3 Configuracion

Todas las llamadas a OpenAI desde API Routes de Next.js, nunca desde el cliente.
Timeout: 30 segundos. Si falla: devolver error al usuario, no bloquear el flujo.

---

## 23. Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hola@doscientos.es

# OpenAI
OPENAI_API_KEY=

# Cron security
CRON_SECRET=

# Verifactu / SIF (RD 1007/2023)
# Certificado digital de representante de persona juridica (.p12 en base64)
# Obtener de FNMT (https://www.fnmt.es) o Camerfirma
# Convertir: base64 -i cert.p12 | tr -d '\n'
VERIFACTU_CERT_P12_BASE64=
# Contrasena del certificado .p12
VERIFACTU_CERT_PASSWORD=
# 'test' = endpoint de homologacion AEAT | 'prod' = produccion AEAT
# Empezar siempre en 'test'. Cambiar a 'prod' tras validar con Hacienda.
VERIFACTU_ENV=test
# NIF del emisor (debe coincidir con el certificado digital)
VERIFACTU_NIF_EMISOR=

# GitHub App (integracion bidireccional tareas <-> issues)
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY_BASE64=    # clave privada de la GitHub App en base64
GITHUB_WEBHOOK_SECRET=            # secret para validar firma de webhooks entrantes

# Observabilidad
SENTRY_DSN=
SENTRY_AUTH_TOKEN=                # para source maps en CI
AXIOM_DATASET=crm-doscientos
AXIOM_TOKEN=
BETTERSTACK_HEARTBEAT_URL=        # ping desde cada cron para confirmar ejecución

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App URLs
NEXT_PUBLIC_APP_URL=https://crm.doscientos.es
NEXT_PUBLIC_LANDING_URL=https://doscientos.es
```

---

## 24. Observabilidad

### 24.1 Errores — Sentry

```typescript
// sentry.server.config.ts + sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,  // 20% de trazas en producción
  // Ignorar errores esperados del cliente:
  ignoreErrors: ['AbortError', 'ResizeObserver loop limit exceeded'],
})
```

Capturar con contexto de usuario autenticado:
```typescript
Sentry.setUser({ id: user.id, email: user.email, role })
```

### 24.2 Logs estructurados — Axiom + Pino

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: 'info',
  transport: {
    target: '@axiomhq/pino',
    options: { dataset: process.env.AXIOM_DATASET, token: process.env.AXIOM_TOKEN },
  },
})

// Uso en API routes:
logger.info({ action: 'invoice.issued', invoiceId, userId }, 'Factura emitida')
logger.error({ action: 'verifactu.send', error: err.message }, 'Error AEAT')
```

### 24.3 Heartbeat de crons — BetterStack

Cada cron route, al completar sin error, hace:
```typescript
await fetch(process.env.BETTERSTACK_HEARTBEAT_URL!)
```
Si BetterStack no recibe el ping en el intervalo esperado, envía alerta al equipo.
Configurar un heartbeat monitor por cron (daily-reminders, overdue-invoices, generate-recurring, verifactu-send).
Sin heartbeat externo, Vercel puede silenciar fallos de cron sin notificar.

### 24.4 Backup verificado — cron mensual

```typescript
// app/api/cron/verify-backup/route.ts
// Schedule: 0 10 1 * * (día 1 de cada mes a las 10:00)
export async function GET() {
  // 1. Conectar a Supabase Management API con SUPABASE_ACCESS_TOKEN
  // 2. Obtener ultimo backup: GET /v1/projects/{ref}/database/backups
  // 3. Verificar que created_at < 24h
  // 4. Consultar conteo de filas críticas con service_role
  const counts = await Promise.all([
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
  ])
  // 5. Email al owner con resumen: fecha backup + conteos
  await sendBackupReport(counts)
}
```

---

## 25. GDPR y soft delete

### 25.1 Principios

- `leads`, `clients`, `team_members` y `tasks` tienen `deleted_at timestamptz`.
- Todas las queries de aplicación añaden `WHERE deleted_at IS NULL` (via helper `activeQuery()`).
- Las facturas y `invoice_events` **nunca** se borran (obligación fiscal 6 años, RD 1619/2012 art.19).
- Los time_entries de facturas emitidas tampoco se borran (trazabilidad).

### 25.2 Endpoints GDPR

```
POST /api/gdpr/leads/[id]/erase
  → Anonimiza: name, email, phone, ip, message, company → valores neutros
  → Mantiene: status, source, created_at (datos estadísticos sin PII)
  → Solo accessible por role='owner' o role='admin'

POST /api/gdpr/clients/[id]/erase
  → Requiere que no haya facturas pendientes de pago
  → Anonimiza PII del cliente
  → Facturas quedan con datos anonimizados pero invoice_number intacto (legal)

GET /api/gdpr/clients/[id]/export
  → ZIP con: datos del cliente en JSON + PDFs de todas sus facturas
  → Solo accessible por role='owner' o role='admin'
```

### 25.3 Retention policy

Cron mensual `data-retention` que hard-delete filas con `deleted_at < now() - interval '2 years'`
excepto las que tengan facturas asociadas (las conserva 6 años).

---

## 26. Rate limiting

Implementado con Upstash Redis + `@upstash/ratelimit` en `middleware.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 req/min por IP autenticada
})

// En middleware:
const identifier = user?.id ?? ip  // autenticado: por user; anónimo: por IP
const { success } = await ratelimit.limit(identifier)
if (!success) return new Response('Too Many Requests', { status: 429 })
```

Límites específicos por ruta:
| Ruta | Límite |
|---|---|
| `/api/crm/*` | 100 req/min por usuario |
| `/api/portal/*` | 30 req/min por IP |
| `/api/github/webhook` | Sin límite (fuente de confianza, valida por firma) |
| `/api/cron/*` | Solo desde Vercel (valida `Authorization: Bearer CRON_SECRET`) |
| `/api/gdpr/*` | 5 req/min por usuario (operaciones pesadas) |

---

## 27. Calendar ICS

Endpoint que expone tareas con `due_date` y recordatorios como feed de calendario estándar.
Suscribible desde Google Calendar, Apple Calendar, Outlook.

```
GET /api/calendar/[memberId]/feed.ics?token=[calendar_token]
```

- `calendar_token`: campo adicional en `team_members`, UUID random, diferente al session token.
  Permite suscribirse sin exponer credenciales de sesión.
- Incluye: tareas asignadas al miembro con `due_date IS NOT NULL` + reminders del miembro.
- Formato: iCal RFC 5545. Librería: `ical-generator` (npm).
- Actualización: sin cache en Vercel (header `Cache-Control: no-store`), el cliente de calendario
  hace polling cada 15-60 min por su cuenta.

---

## 28. Template renderer

Renderer unificado para todas las plantillas con variables (propuestas, facturas, emails):

```typescript
// lib/templates/render.ts
export type TemplateContext = {
  client: Pick<Client, 'name' | 'company' | 'email'>
  project?: Pick<Project, 'name'>
  proposal?: Pick<Proposal, 'public_token' | 'total'>
  invoice?: Pick<Invoice, 'invoice_number' | 'total' | 'due_date'>
  member?: Pick<TeamMember, 'name'>
}

const VARIABLES: Record<string, (ctx: TemplateContext) => string> = {
  '{{client.name}}':       ctx => ctx.client.name,
  '{{client.company}}':   ctx => ctx.client.company,
  '{{client.email}}':     ctx => ctx.client.email,
  '{{project.name}}':     ctx => ctx.project?.name ?? '',
  '{{proposal.link}}':    ctx => `${APP_URL}/p/proposal/${ctx.proposal?.public_token}`,
  '{{invoice.number}}':   ctx => ctx.invoice?.invoice_number ?? '',
  '{{invoice.total}}':    ctx => formatCurrency(ctx.invoice?.total ?? 0),
  '{{invoice.due_date}}': ctx => formatDate(ctx.invoice?.due_date),
  '{{member.name}}':      ctx => ctx.member?.name ?? '',
}

export function renderTemplate(template: string, ctx: TemplateContext): string {
  return Object.entries(VARIABLES).reduce(
    (text, [key, fn]) => text.replaceAll(key, fn(ctx)),
    template
  )
}
```

Usado en: `email_templates.body`, `proposals.body_md`, subject de emails transaccionales.
Las variables disponibles se muestran en el editor de `email_templates` como chips clicables.

---

## 29. Implementation Steps

Orden sugerido para hacer el proyecto del tirón. Cada step es un bloque coherente de
funcionalidad que puede desplegarse y usarse en producción de forma independiente.

---

### Step 1 — Infraestructura y auth
- Repo Next.js 15 App Router, Tailwind, shadcn/ui, Sentry, Pino + Axiom
- Supabase: proyecto, tablas team_members + settings, RLS con `current_member_role()`
- Supabase Auth: email/password, 2FA TOTP para owner/admin (sec. 6.1.1)
- Middleware: protección de rutas, rate limiting (Upstash), validación de rol
- Vercel: deploy, env vars, dominio crm.doscientos.es, BetterStack heartbeats vacíos
- `lib/logger.ts` (Pino + Axiom), `lib/templates/render.ts` (sec. 28)

### Step 2 — Leads y pipeline
- Tablas: leads (con deleted_at), lead_interactions, reminders, activities
- Triggers DB: interactions_count, last_interaction_at, next_followup_at
- UI: kanban de leads (4 columnas, drag-and-drop @dnd-kit), ficha de lead, timeline
- Quick-add popover: llamada, email, WhatsApp, nota
- Vista /reminders con filtros y badges de urgencia
- Cron `daily-reminders` (07:00 L-V) + BetterStack heartbeat
- Integración landing → Supabase (reemplaza Notion/Google Sheets)
- Supabase Realtime: toast "Nuevo lead" en dashboard

### Step 3 — Clientes, proyectos y presupuestos
- Tablas: clients (con deleted_at), projects (con github_repo_owner/name), services_catalog
- Tablas: email_templates, proposals, line_items, proposal_items
- `lib/templates/render.ts`: interpolación de variables en subject/body
- Editor de propuesta: line items con drag-and-drop, totales automáticos con IVA
- Portal público `/p/proposal/[token]`: aceptar/rechazar con motivo
- Tracking de apertura: view_count, activities
- Preview interna idéntica a la vista del cliente
- notification_preferences: defaults por rol al crear team_member

### Step 4 — Facturas y suscripciones
- Tablas: invoices (todos los campos verifactu_* ya en schema), line_items, invoice_events
- Secuencia PostgreSQL para invoice_number (F-YYYY-NNN / R-YYYY-NNN)
- Generación de factura desde propuesta aceptada (pre-relleno)
- Milestones: pagos parciales, `is_payment_milestone`, trigger de progreso
- Portal público `/p/invoice/[token]`, CSS @media print, descarga PDF
- Cron `overdue-invoices` (08:00 L-V) + heartbeat
- Tabla subscriptions, RPC `create_recurring_invoice` (transacción atómica)
- Cron `generate-recurring-invoices` (06:00 UTC diario) + heartbeat
- Templates: recurring-invoice-ready, recurring-invoice-sent, subscription-ending
- Idempotency key en `POST /api/crm/invoices` (header `Idempotency-Key`)

### Step 5 — Verifactu / SIF
- `lib/verifactu/`: hash.ts (SHA-256 chain), xml.ts, sign.ts, client.ts, qr.ts, utils.ts
- Trigger DB: inmutabilidad de `current_hash` y `chain_sequence` tras emisión
- Flujo de emisión: SELECT FOR UPDATE → computeHash → INSERT invoice_events 'issued'
- Cron `verifactu-send` (cada 15 min): envío a AEAT, reintentos exponenciales, alerta 5 fallos
- QR PNG en Supabase Storage bucket `invoices-qr` (público) + QR en portal e impresión
- Flujo UI: factura rectificativa (botón, modal, serie R-YYYY-NNN)
- Templates verifactu-alert.tsx, verifactu-cert-expiry.tsx
- Cron `verify-backup` (día 1 de cada mes) + cron `data-retention` (mensual)
- Toggle VERIFACTU_ENV test/prod en settings de la app
- Endpoints GDPR: `/api/gdpr/*/erase`, `/api/gdpr/*/export` (sec. 25.2)

### Step 6 — IA y dashboard
- API route `summarize-lead` (GPT-4o-mini): resumen + temperatura hot/warm/cold
- API route `draft-email` (GPT-4o): borrador en modal de email con contexto del lead
- KPI cards: leads activos, propuestas pendientes, facturación mensual, vencidas
- Gráficos recharts: bar (facturación por mes), donut (estado de leads), línea (nuevos leads)
- Buscador global Cmd+K (shadcn Command): leads, clientes, proyectos, facturas
- Filtros avanzados en todas las vistas, paginación en tablas grandes
- Responsive + dark/light mode

### Step 7 — Tasks y time tracking
- Tablas: tasks (project_id nullable, lead_id, LexoRank), task_comments, task_tags,
  task_tag_assignments, time_entries, notification_preferences
- ALTER milestones: start_date, completion_percentage, color, github_milestone_number, is_payment_milestone
- Trigger `update_milestone_progress()`
- RLS: todas las tablas nuevas con `current_member_role()`
- Vista Kanban por proyecto (4 columnas, @dnd-kit, fractional indexing)
- Vista Lista con subtareas indentadas, filtros, ordenación multi-columna
- TaskSheet: campos, markdown textarea + preview, subtareas, tags, timer de tiempo
- Quick-add inline de tareas en columna Kanban
- Time tracker: ▶ Iniciar / ⏹ Parar, badge en sidebar, validación 1 timer activo por miembro
- Botón "Importar horas no facturadas" en /projects/[id]/invoices (sec. 5.23 flujo)
- Menciones @handle: parseo en textarea, notify Realtime, email si inactivo >5 min
- Calendar ICS endpoint `/api/calendar/[memberId]/feed.ics` (sec. 27)
- Banner "Milestone 100% completado" con CTA si `is_payment_milestone`

### Step 8 — GitHub integration
- GitHub App: instalación en org, configurar repos por proyecto (github_repo_owner/name)
- Webhook `/api/github/webhook`: validar X-Hub-Signature-256, procesar eventos (sec. 19.3)
- API route `/api/github/create-issue`: crear issue desde tarea CRM
- Sync: issue closed → task done; PR opened → task github_pr_number; PR merged → task done
- github_handle en settings/profile de cada miembro
- Phase 2 (si se valida uso): Gantt visual, task_attachments UI, commits referenciando tareas

---

> **Dependencias entre steps**: cada step asume que el anterior está desplegado y funcionando.
> Los steps 5 (Verifactu) y 8 (GitHub) son independientes entre sí y pueden hacerse en paralelo
> si hay dos personas trabajando.

---

*Equipo: Pol (Frontend y Design) - Gerard (Backend y DevOps)*
*Stack: Next.js 15 + Supabase + shadcn/ui + Resend + OpenAI + Vercel + Upstash + Sentry + Axiom + BetterStack*
*Referencia fiscal: Real Decreto 1619/2012 (facturacion) + RD 1007/2023 + Orden HAC/1177/2024 (Verifactu/SIF)*
*Última revisión: mayo 2026 — spec completa lista para implementación del tirón*
