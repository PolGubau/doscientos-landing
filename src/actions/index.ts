import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { Client } from "@notionhq/client";
import { Resend } from "resend";
import { generateContactEmailHTML } from "../shared/lib/email-template";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Inicializar cliente de Notion
const notion = new Client({
	auth: import.meta.env.NOTION_INTEGRATION_SECRET,
});

// Función para parsear User Agent
function parseUserAgent(ua: string) {
	const browser =
		ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/i)?.[0] ||
		"Unknown";
	const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0] || "Unknown";

	// Tablet first: Android tablets omit "Mobile", iPads are explicitly "iPad"
	const isTablet =
		/iPad/i.test(ua) ||
		/Tablet|PlayBook/i.test(ua) ||
		(/Android/i.test(ua) && !/Mobile/i.test(ua));
	const isMobile =
		(!isTablet && /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) ||
		(/Mobile/i.test(ua) && /Android|webOS/i.test(ua));
	const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

	return { browser, os, device };
}

export const server = {
	sendContact: defineAction({
		accept: "form",
		input: z.object({
			name: z.string().min(1, "El nombre es obligatorio"),
			email: z.string().email("Email inválido"),
			phone: z.string().min(1, "El teléfono es obligatorio"),
			company: z.string().optional(),
			budget: z.enum(["<5k", "5k-15k", "15k-40k", ">40k"]).optional(),
			message: z.string().min(1, "El mensaje debe tener al menos 1 carácter"),
			timezone: z.string().optional(),
			utm_source: z.string().optional(),
			utm_medium: z.string().optional(),
			utm_campaign: z.string().optional(),
			subject: z.string().optional(),
			ref: z.string().optional(),
		}),
		handler: async (input, context) => {
			const {
				name,
				email,
				phone,
				company,
				budget,
				message,
				timezone,
				utm_source,
				utm_medium,
				utm_campaign,
				subject,
				ref,
			} = input;

			const budgetLabels: Record<string, string> = {
				"<5k": "Menos de 5.000€",
				"5k-15k": "5.000€ – 15.000€",
				"15k-40k": "15.000€ – 40.000€",
				">40k": "Más de 40.000€",
			};
			const budgetLabel = budget ? budgetLabels[budget] : "No especificado";

			// Obtener datos del request
			const userAgent = context.request.headers.get("user-agent") || "Unknown";
			const { browser, os, device } = parseUserAgent(userAgent);
			const language =
				context.request.headers.get("accept-language")?.split(",")[0] ||
				"Unknown";
			const referrer = context.request.headers.get("referer") || "Direct";

			// IP del cliente
			const forwarded = context.request.headers.get("x-forwarded-for");
			const realIP = context.request.headers.get("x-real-ip");
			const cfConnectingIP = context.request.headers.get("cf-connecting-ip");
			const ip =
				forwarded?.split(",")[0].trim() ||
				realIP ||
				cfConnectingIP ||
				"Unknown";

			const now = new Date();
			const timestamp = now.toLocaleString("es-ES", {
				timeZone: "Europe/Madrid",
			});
			const isoTimestamp = now.toISOString();

			// Preparar datos para Google Sheets
			const sheetData = {
				timestamp,
				name,
				email,
				phone,
				company: company || "",
				message,
				ip,
				userAgent,
				browser,
				os,
				device,
				language,
				timezone: timezone || "Unknown",
				referrer,
				utmSource: utm_source || "",
				utmMedium: utm_medium || "",
				utmCampaign: utm_campaign || "",
				subject: subject || "",
				ref: ref || "",
			};

			try {
				// 1. Enviar email con Resend
				const emailHTML = generateContactEmailHTML({
					name,
					email,
					phone,
					company,
					budget: budgetLabel,
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
				});

				const { data: emailData, error: emailError } = await resend.emails.send(
					{
						from: "Equipo doscientos <hola@doscientos.es>",
						to: ["hola@doscientos.es", "gubaupol@gmail.com"],
						replyTo: email,
						subject: `Nuevo contacto de ${name}${company ? ` (${company})` : ""}`,
						html: emailHTML,
					},
				);

				if (emailError) {
					console.error("Error enviando email:", emailError);
					throw new ActionError({
						code: "INTERNAL_SERVER_ERROR",
						// biome-ignore lint/style/useTemplate: <explanation>
						message: "Error al enviar el email: " + emailError.message,
					});
				}

				// 2. Guardar en Google Sheets
				const GOOGLE_SHEETS_URL = import.meta.env.PUBLIC_GOOGLE_SHEETS_URL;

				console.log("Google Sheets URL:", GOOGLE_SHEETS_URL);
				console.log("Datos a enviar:", sheetData);

				if (GOOGLE_SHEETS_URL) {
					try {
						const sheetResponse = await fetch(GOOGLE_SHEETS_URL, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(sheetData),
						});

						console.log("Google Sheets response status:", sheetResponse.status);
						const sheetResult = await sheetResponse.text();
						console.log("Google Sheets response:", sheetResult);
					} catch (sheetError) {
						console.error("Error guardando en Google Sheets:", sheetError);
						// No lanzar error, continuar aunque falle Google Sheets
					}
				} else {
					console.warn("GOOGLE_SHEETS_URL no está configurada");
				}

				// 3. Guardar en Notion
				const NOTION_DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

				if (NOTION_DATABASE_ID) {
					try {
						await notion.pages.create({
							parent: {
								database_id: NOTION_DATABASE_ID,
							},
							properties: {
								Name: {
									title: [
										{
											text: {
												content: name,
											},
										},
									],
								},
								Email: {
									email: email,
								},
								Phone: {
									phone_number: phone,
								},
								company: {
									rich_text: [
										{
											text: {
												content: company || "",
											},
										},
									],
								},
								budget: {
									select: {
										name: budgetLabel,
									},
								},
								message: {
									rich_text: [
										{
											text: {
												content: message,
											},
										},
									],
								},
								date: {
									date: {
										start: isoTimestamp,
									},
								},
								timezone: {
									rich_text: [
										{
											text: {
												content: timezone || "Unknown",
											},
										},
									],
								},
								language: {
									rich_text: [
										{
											text: {
												content: language,
											},
										},
									],
								},
								ip: {
									rich_text: [
										{
											text: {
												content: ip,
											},
										},
									],
								},
								browser: {
									rich_text: [
										{
											text: {
												content: browser,
											},
										},
									],
								},
								os: {
									rich_text: [
										{
											text: {
												content: os,
											},
										},
									],
								},
								device: {
									rich_text: [
										{
											text: {
												content: device,
											},
										},
									],
								},
								userAgent: {
									rich_text: [
										{
											text: {
												content: userAgent,
											},
										},
									],
								},
								referrer: {
									rich_text: [
										{
											text: {
												content: referrer,
											},
										},
									],
								},
								"utm-source": {
									rich_text: [
										{
											text: {
												content: utm_source || "",
											},
										},
									],
								},
								"utm-medium": {
									rich_text: [
										{
											text: {
												content: utm_medium || "",
											},
										},
									],
								},
								"utm-campaign": {
									rich_text: [
										{
											text: {
												content: utm_campaign || "",
											},
										},
									],
								},
								subject: {
									rich_text: [
										{
											text: {
												content: subject || "",
											},
										},
									],
								},
								ref: {
									rich_text: [
										{
											text: {
												content: ref || "",
											},
										},
									],
								},
							},
						});

						console.log("✅ Lead guardado en Notion");
					} catch (notionError) {
						console.error("Error guardando en Notion:", notionError);
						// No lanzar error, continuar aunque falle Notion
					}
				} else {
					console.warn("NOTION_DATABASE_ID no está configurada");
				}

				// 4. Email de confirmación al lead
				await resend.emails
					.send({
						from: "Equipo doscientos <hola@doscientos.es>",
						to: email,
						replyTo: "hola@doscientos.es",
						subject: `${name}, hemos recibido tu mensaje`,
						html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#111;padding:32px 40px;">
          <p style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">doscientos</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="font-size:18px;font-weight:600;color:#111;margin:0 0 16px;">Hola ${name},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 16px;">
            Hemos recibido tu mensaje y te respondemos <strong>antes de 24 horas</strong> en días laborables.
          </p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 32px;">
            Si necesitas algo urgente, puedes responder directamente a este email o llamarnos al <strong>+34 671 171 525</strong>.
          </p>
          <!-- Summary box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:32px;">
            <tr><td>
              <p style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Tu mensaje</p>
              ${budgetLabel !== "No especificado" ? `<p style="font-size:13px;color:#666;margin:0 0 8px;"><strong>Presupuesto:</strong> ${budgetLabel}</p>` : ""}
              <p style="font-size:14px;color:#444;line-height:1.6;margin:0;border-left:3px solid #111;padding-left:12px;">${message}</p>
            </td></tr>
          </table>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 8px;">Un saludo,</p>
          <p style="font-size:15px;font-weight:600;color:#111;margin:0;">El equipo de doscientos</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#999;margin:0;">
            doscientos · Barcelona · <a href="https://doscientos.es" style="color:#999;">doscientos.es</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
					})
					.catch((err) => {
						// No bloquear el flujo si falla el email de confirmación
						console.error("Error enviando email de confirmación al lead:", err);
					});

				return {
					success: true,
					message: "Mensaje enviado correctamente",
					emailId: emailData?.id,
				};
			} catch (error) {
				console.error("Error en sendContact:", error);
				throw new ActionError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Error desconocido",
				});
			}
		},
	}),
};
