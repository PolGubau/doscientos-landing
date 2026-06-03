/**
 * Template profesional de email para contactos
 * Branding de doscientos con diseño moderno
 */

interface EmailData {
	name: string;
	email: string;
	phone: string;
	company?: string;
	budget?: string;
	message: string;
	timestamp: string;
	ip: string;
	browser: string;
	os: string;
	device: string;
	referrer: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	subject?: string;
	ref?: string;
}

export function generateContactEmailHTML(data: EmailData): string {
	const {
		name,
		email,
		phone,
		company,
		budget,
		message,
		timestamp,
		ip,
		browser,
		os,
		device,
		referrer,
		utm_source,
		utm_medium,
		utm_campaign,
		subject,
		ref,
	} = data;

	const hasUTM = utm_source || utm_medium || utm_campaign;

	// Sanitizar mensaje para evitar HTML injection
	const sanitizedMessage = message
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\n/g, "<br>");

	return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: #1f2937; 
        background-color: #f3f4f6;
        padding: 20px;
      }
      .email-wrapper { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { 
        background: linear-gradient(135deg, #2A4227 0%, #3d5a37 100%); 
        color: white; 
        padding: 40px 30px; 
        text-align: center;
      }
      .logo { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -1px; }
      .tagline { font-size: 14px; opacity: 0.9; font-weight: 400; }
      .content { padding: 40px 30px; }
      .lead-badge { 
        display: inline-block; 
        background: #dcfce7; 
        color: #166534; 
        padding: 6px 12px; 
        border-radius: 20px; 
        font-size: 12px; 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.5px;
        margin-bottom: 20px;
      }
      .section-title { 
        font-size: 18px; 
        font-weight: 700; 
        color: #111827; 
        margin-bottom: 20px; 
        padding-bottom: 10px; 
        border-bottom: 2px solid #e5e7eb;
      }
      .field { margin-bottom: 24px; }
      .label { 
        font-weight: 600; 
        color: #6b7280; 
        font-size: 11px; 
        text-transform: uppercase; 
        letter-spacing: 0.8px; 
        margin-bottom: 6px;
      }
      .value { 
        font-size: 16px; 
        color: #111827; 
        font-weight: 500;
      }
      .value a { color: #2A4227; text-decoration: none; font-weight: 600; }
      .value a:hover { text-decoration: underline; }
      .message-box { 
        background: #f9fafb; 
        padding: 20px; 
        border-radius: 12px; 
        border-left: 4px solid #2A4227;
        font-size: 15px;
        line-height: 1.7;
      }
      .metadata { 
        background: #f9fafb; 
        padding: 20px; 
        border-radius: 12px; 
        margin-top: 30px;
      }
      .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .metadata-item { }
      .metadata-label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .metadata-value { font-size: 13px; color: #374151; margin-top: 4px; font-weight: 500; }
      .cta-section { 
        background: linear-gradient(135deg, #2A4227 0%, #3d5a37 100%); 
        padding: 30px; 
        text-align: center; 
        margin-top: 30px; 
        border-radius: 12px;
      }
      .cta-text { color: white; font-size: 14px; margin-bottom: 16px; }
      .cta-button { 
        display: inline-block; 
        background: white; 
        color: #2A4227; 
        padding: 14px 32px; 
        border-radius: 8px; 
        text-decoration: none; 
        font-weight: 700; 
        font-size: 15px;
      }
      .footer { 
        text-align: center; 
        padding: 30px; 
        color: #6b7280; 
        font-size: 13px;
      }
      .footer a { color: #2A4227; text-decoration: none; font-weight: 600; }
      @media only screen and (max-width: 600px) {
        .metadata-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <div class="logo">doscientos</div>
        <div class="tagline">Desarrollo de MVPs en 6 semanas</div>
      </div>
      
      <div class="content">
        <span class="lead-badge">Nuevo Lead</span>
        
        <div class="section-title">Información de Contacto</div>
        
        <div class="field">
          <div class="label">Nombre</div>
          <div class="value">${name}</div>
        </div>

        ${
					subject
						? `
        <div class="field">
          <div class="label">Interés / Pack</div>
          <div class="value" style="color: #2A4227; font-weight: 700;">${subject}</div>
        </div>
        `
						: ""
				}

        <div class="field">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${email}">${email}</a></div>
        </div>

        <div class="field">
          <div class="label">Teléfono</div>
          <div class="value"><a href="tel:${phone}">${phone}</a></div>
        </div>

        ${
					company
						? `
        <div class="field">
          <div class="label">Empresa</div>
          <div class="value">${company}</div>
        </div>
        `
						: ""
				}

        ${
					budget
						? `
        <div class="field">
          <div class="label">Presupuesto</div>
          <div class="value" style="color: #166534; font-weight: 700;">${budget}</div>
        </div>
        `
						: ""
				}

        <div class="section-title" style="margin-top: 30px;">Mensaje</div>
        <div class="message-box">${sanitizedMessage}</div>

        <div class="metadata">
          <div class="section-title" style="margin-bottom: 16px; font-size: 14px;">Información Técnica</div>
          <div class="metadata-grid">
            <div class="metadata-item">
              <div class="metadata-label">Fecha/Hora</div>
              <div class="metadata-value">${timestamp}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">IP</div>
              <div class="metadata-value">${ip}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Navegador</div>
              <div class="metadata-value">${browser}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Sistema</div>
              <div class="metadata-value">${os}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Dispositivo</div>
              <div class="metadata-value">${device}</div>
            </div>
            ${
							ref
								? `
            <div class="metadata-item">
              <div class="metadata-label">Referencia</div>
              <div class="metadata-value">${ref}</div>
            </div>
            `
								: ""
						}
            ${
							referrer !== "Direct"
								? `
            <div class="metadata-item">
              <div class="metadata-label">Referrer</div>
              <div class="metadata-value">${referrer}</div>
            </div>
            `
								: ""
						}
          </div>

          ${
						hasUTM
							? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <div class="metadata-label" style="margin-bottom: 12px;">📊 Parámetros UTM</div>
            <div class="metadata-grid">
              ${utm_source ? `<div class="metadata-item"><div class="metadata-label">Source</div><div class="metadata-value">${utm_source}</div></div>` : ""}
              ${utm_medium ? `<div class="metadata-item"><div class="metadata-label">Medium</div><div class="metadata-value">${utm_medium}</div></div>` : ""}
              ${utm_campaign ? `<div class="metadata-item"><div class="metadata-label">Campaign</div><div class="metadata-value">${utm_campaign}</div></div>` : ""}
            </div>
          </div>
          `
							: ""
					}
        </div>

        <div class="cta-section">
          <div class="cta-text">Responde en menos de 24h para maximizar la conversión</div>
          <a href="mailto:${email}" class="cta-button">Responder a ${name}</a>
        </div>
      </div>

      <div class="footer">
        <p>Este email fue enviado desde <a href="https://doscientos.es">doscientos.es</a></p>
        <p style="margin-top: 8px; color: #9ca3af;">Desarrollamos MVPs en 6 semanas</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}
