/**
 * ConfirmationEmail - Email de confirmación para el cliente
 * Se envía automáticamente cuando alguien contacta
 */

interface ConfirmationEmailProps {
  name: string;
}

export const ConfirmationEmail = ({ name }: ConfirmationEmailProps) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gracias por contactarnos - doscientos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                doscientos
              </h1>
              <p style="margin: 12px 0 0; color: #a0a0a0; font-size: 15px;">
                Desarrollo de producto digital
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="width: 64px; height: 64px; background-color: #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <h2 style="margin: 0 0 16px; color: #000000; font-size: 24px; font-weight: 700; text-align: center;">
                ¡Gracias por contactarnos, ${name}!
              </h2>
              
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.7; text-align: center;">
                Hemos recibido tu mensaje y te responderemos en menos de <strong style="color: #000000;">24 horas</strong>.
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; color: #000000; font-size: 15px; font-weight: 600;">
                      Mientras tanto:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Revisa nuestros <a href="https://doscientos.es/projects" style="color: #000000; text-decoration: none; font-weight: 600;">proyectos destacados</a></li>
                      <li style="margin-bottom: 8px;">Revisa nuestros <a href="https://doscientos.es/recursos" style="color: #000000; text-decoration: none; font-weight: 600;">recursos gratis</a> sobre automatizacion y software a medida</li>
                      <li>Síguenos en <a href="https://linkedin.com/company/doscientos" style="color: #000000; text-decoration: none; font-weight: 600;">LinkedIn</a></li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td width="33%" align="center" style="padding: 16px;">
                    <p style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">+21</p>
                    <p style="margin: 4px 0 0; color: #666666; font-size: 13px;">Proyectos</p>
                  </td>
                  <td width="33%" align="center" style="padding: 16px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">5.0</p>
                    <p style="margin: 4px 0 0; color: #666666; font-size: 13px;">Rating</p>
                  </td>
                  <td width="33%" align="center" style="padding: 16px;">
                    <p style="margin: 0; color: #000000; font-size: 28px; font-weight: 700;">6-8</p>
                    <p style="margin: 4px 0 0; color: #666666; font-size: 13px;">Semanas</p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 8px; color: #000000; font-size: 15px; font-weight: 600;">
                  El equipo de doscientos
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  <a href="mailto:hola@doscientos.es" style="color: #000000; text-decoration: none;">hola@doscientos.es</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 12px; color: #000000; font-size: 14px; font-weight: 600;">
                doscientos
              </p>
              <p style="margin: 0 0 16px; color: #666666; font-size: 13px;">
                Barcelona, España
              </p>
              
              <!-- Social Links -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://linkedin.com/company/doscientos" style="display: inline-block; margin: 0 8px;">
                      <img src="https://img.icons8.com/ios-filled/24/000000/linkedin.png" alt="LinkedIn" width="20" height="20" />
                    </a>
                    <a href="https://twitter.com/doscientos" style="display: inline-block; margin: 0 8px;">
                      <img src="https://img.icons8.com/ios-filled/24/000000/twitter.png" alt="Twitter" width="20" height="20" />
                    </a>
                    <a href="https://github.com/doscientos" style="display: inline-block; margin: 0 8px;">
                      <img src="https://img.icons8.com/ios-filled/24/000000/github.png" alt="GitHub" width="20" height="20" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default ConfirmationEmail;
