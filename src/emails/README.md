# Email Templates - doscientos

Sistema de emails profesionales para la landing de doscientos.

## 📧 Templates Disponibles

### 1. ContactEmail

Email que recibe el equipo cuando alguien contacta.

**Características:**

- ✅ Diseño profesional y limpio
- ✅ Información del contacto destacada
- ✅ CTA para responder directamente
- ✅ Responsive (mobile-friendly)

### 2. ConfirmationEmail

Email de confirmación que recibe el cliente.

**Características:**

- ✅ Mensaje de agradecimiento
- ✅ Tiempo de respuesta (24h)
- ✅ Links a proyectos y blog
- ✅ Stats de la empresa
- ✅ Firma profesional

## 🚀 Uso con Resend

### Instalación

```bash
npm install resend
```

### Configuración

```typescript
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
  phone?: string;
  company?: string;
}) {
  // Email al equipo
  await resend.emails.send({
    from: "Contacto <contacto@doscientos.es>",
    to: "hola@doscientos.es",
    subject: `Nuevo contacto de ${data.name}`,
    html: ContactEmail(data),
  });

  // Email de confirmación al cliente
  await resend.emails.send({
    from: "doscientos <hola@doscientos.es>",
    to: data.email,
    subject: "Gracias por contactarnos - doscientos",
    html: ConfirmationEmail({ name: data.name }),
  });
}
```

### Uso en API Route

```typescript
// src/pages/api/contact.ts
import type { APIRoute } from "astro";
import { sendContactEmail } from "~/lib/email";

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  try {
    await sendContactEmail(data);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error sending email" }), {
      status: 500,
    });
  }
};
```

## 🎨 Personalización

### Colores

Los emails usan la paleta de doscientos:

- **Primary:** `#000000` (Negro)
- **Background:** `#ffffff` (Blanco)
- **Muted:** `#666666` (Gris)
- **Accent:** `#f8f9fa` (Gris claro)

### Modificar Templates

Edita los archivos en `src/emails/templates/`:

- `ContactEmail.tsx` - Email al equipo
- `ConfirmationEmail.tsx` - Email al cliente

## 📱 Testing

### Preview en Navegador

```typescript
// src/pages/email-preview.astro
---
import ContactEmail from '~/emails/templates/ContactEmail';

const html = ContactEmail({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hola, me gustaría trabajar con vosotros...',
  phone: '+34 600 000 000',
  company: 'Acme Inc',
});
---

<div set:html={html} />
```

### Testing con Resend

Resend tiene un modo de testing que no envía emails reales:

```typescript
const resend = new Resend(import.meta.env.RESEND_API_KEY);

// En desarrollo, los emails se envían a tu email de testing
await resend.emails.send({
  from: "test@resend.dev",
  to: "tu-email@example.com",
  subject: "Test",
  html: ContactEmail(data),
});
```

## 🔒 Variables de Entorno

Crea un archivo `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## 📊 Métricas

Con Resend puedes trackear:

- ✅ Emails enviados
- ✅ Emails abiertos
- ✅ Clicks en links
- ✅ Bounces

## 🎯 Best Practices

1. **Siempre envía confirmación al cliente**
   - Mejora la experiencia
   - Reduce ansiedad

2. **Responde en menos de 24h**
   - Aumenta conversión
   - Genera confianza

3. **Personaliza los emails**
   - Usa el nombre del cliente
   - Menciona detalles específicos

4. **Incluye CTAs claros**
   - "Responder a [nombre]"
   - Links a proyectos relevantes

## 🚀 Próximos Pasos

1. Configurar Resend
2. Agregar API route para contacto
3. Conectar formulario de contacto
4. Testear envío de emails
5. Monitorizar métricas

## 📝 Notas

- Los emails son HTML puro (no React components)
- Compatible con todos los clientes de email
- Responsive y mobile-friendly
- Probado en Gmail, Outlook, Apple Mail
