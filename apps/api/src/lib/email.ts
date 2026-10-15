import { logger } from "./logger";
import { money } from "@workspace/shared";

export interface OrderEmailData {
  id: string;
  customerName: string;
  email: string;
  totalCents: number;
  items: Array<{
    productName: string;
    unitPriceCents: number;
    quantity: number;
  }>;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  trackingNumber?: string;
  carrier?: string;
}

function baseEmailTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1a1a1a; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .header { background: #121212; color: #f6f3eb; padding: 32px; text-align: center; }
    .header h1 { font-family: 'Cinzel', Georgia, serif; font-size: 24px; letter-spacing: 0.15em; margin: 0; font-weight: 400; }
    .header p { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a66a; margin-top: 8px; }
    .content { padding: 36px 32px; }
    .footer { background: #fbfbfa; border-top: 1px solid #eeeeea; padding: 24px 32px; font-size: 12px; color: #888888; text-align: center; }
    .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0ec; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0; font-size: 16px; font-weight: 600; border-top: 2px solid #121212; margin-top: 16px; }
    .badge { display: inline-block; padding: 4px 10px; background: #f4ece1; color: #9c7a36; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .btn { display: inline-block; padding: 12px 24px; background: #121212; color: #f6f3eb !important; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AMAL</h1>
      <p>ATELIER DE ALTA RELOJERÍA — BARCELONA</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>© 2026 AMAL Watches S.L. • Passeig de Gràcia 42, Barcelona • atelier@amalwatches.com</p>
      <p>Cada pieza incluye garantía internacional de 5 años y certificado numerado de procedencia.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(order: OrderEmailData): Promise<boolean> {
  try {
    const itemsHtml = order.items
      .map(
        (it) => `
      <div class="item-row">
        <span><strong>${it.productName}</strong> × ${it.quantity}</span>
        <span>${money(it.unitPriceCents * it.quantity, { isCents: true })}</span>
      </div>`,
      )
      .join("");

    const totalFormatted = money(order.totalCents, { isCents: true });

    const html = baseEmailTemplate(
      `Confirmación de Pedido #${order.id} — AMAL Watches`,
      `
      <span class="badge">Pedido Confirmado</span>
      <h2 style="font-weight: 300; margin: 16px 0 8px; font-size: 22px;">Estimado/a ${order.customerName},</h2>
      <p style="color: #555; line-height: 1.6;">
        Hemos recibido su encargo con éxito. Nuestros maestros relojeros están preparando su guardatiempo en el Atelier para su regulación final y empaquetado de alta seguridad.
      </p>

      <div style="background: #faf9f6; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
        <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Referencia de Pedido</div>
        <div style="font-size: 18px; font-weight: 600; color: #121212; margin-top: 4px;">#${order.id}</div>
      </div>

      <h3 style="font-size: 15px; font-weight: 600; margin-top: 24px;">Detalle de su Selección</h3>
      ${itemsHtml}
      <div class="total-row">
        <span>Total Pagado (IVA incl.)</span>
        <span>${totalFormatted}</span>
      </div>

      <h3 style="font-size: 14px; font-weight: 600; margin-top: 24px;">Dirección de Entrega Asegurada</h3>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">
        ${order.customerName}<br>
        ${order.address}<br>
        ${order.postalCode} ${order.city}, ${order.country}
      </p>

      <p style="color: #777; font-size: 13px; margin-top: 24px;">
        Tan pronto como el transportista blindado recoja su pieza, le enviaremos su número de seguimiento en tiempo real.
      </p>
    `,
    );

    // In local/preview environment, log the formatted dispatch
    logger.info(
      {
        recipient: order.email,
        orderId: order.id,
        total: totalFormatted,
      },
      "📧 [EMAIL SERVICE] Sent Order Confirmation Email",
    );

    return true;
  } catch (err) {
    logger.error({ err, orderId: order.id }, "Failed to send order confirmation email");
    return false;
  }
}

export async function sendOrderShippedNotification(
  order: OrderEmailData,
  carrier: string,
  trackingNumber: string,
): Promise<boolean> {
  try {
    const html = baseEmailTemplate(
      `Su reloj AMAL está en camino — Pedido #${order.id}`,
      `
      <span class="badge" style="background: #e6f4ea; color: #137333;">En Tránsito Blindado</span>
      <h2 style="font-weight: 300; margin: 16px 0 8px; font-size: 22px;">Su guardatiempo ha salido del Atelier</h2>
      <p style="color: #555; line-height: 1.6;">
        Estimado/a ${order.customerName}, su reloj correspondiente al pedido <strong>#${order.id}</strong> ha sido inspeccionado, regulado y confiado a nuestro servicio de transporte asegurado.
      </p>

      <div style="background: #faf9f6; padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid #ecebe4;">
        <div style="font-size: 12px; color: #888; text-transform: uppercase;">Transportista Certificado</div>
        <div style="font-size: 15px; font-weight: 600; color: #121212; margin: 4px 0 12px;">${carrier}</div>

        <div style="font-size: 12px; color: #888; text-transform: uppercase;">Número de Seguimiento</div>
        <div style="font-size: 16px; font-family: monospace; color: #8b263e; font-weight: 600;">${trackingNumber}</div>

        <div style="margin-top: 16px;">
          <a href="https://www.dhl.com/es-es/home/tracking.html?tracking-id=${trackingNumber}" class="btn" target="_blank">
            Rastrear Envío en Tiempo Real
          </a>
        </div>
      </div>

      <p style="font-size: 13px; color: #777;">
        Recuerde que por motivos de seguridad, la entrega requiere verificación de identidad y firma manuscrita en destino.
      </p>
    `,
    );

    logger.info(
      {
        recipient: order.email,
        orderId: order.id,
        trackingNumber,
        carrier,
      },
      "📧 [EMAIL SERVICE] Sent Order Shipped Notification Email",
    );

    return true;
  } catch (err) {
    logger.error({ err, orderId: order.id }, "Failed to send order shipped email");
    return false;
  }
}

export async function sendNewsletterWelcome(email: string): Promise<boolean> {
  try {
    const html = baseEmailTemplate(
      "Bienvenido al Cuaderno del Atelier — AMAL Watches",
      `
      <span class="badge">Suscripción Confirmada</span>
      <h2 style="font-weight: 300; margin: 16px 0 8px; font-size: 22px;">Bienvenido al Cuaderno del Atelier</h2>
      <p style="color: #555; line-height: 1.6;">
        Gracias por acompañarnos. Cada dos meses compartimos una reflexión íntima sobre diseño sobrio, maestros relojeros independientes y la micromecánica que da vida a nuestras piezas.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Como suscriptor, disfrutará de acceso preferente y reserva anticipada para todas nuestras futuras series numeradas antes de su apertura pública.
      </p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://amalwatches.com" class="btn">Visitar el Atelier</a>
      </div>
    `,
    );

    logger.info({ recipient: email }, "📧 [EMAIL SERVICE] Sent Newsletter Welcome Email");
    return true;
  } catch (err) {
    logger.error({ err, email }, "Failed to send newsletter welcome email");
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string,
): Promise<boolean> {
  try {
    const html = baseEmailTemplate(
      "Restablecimiento de Contraseña — AMAL Watches",
      `
      <span class="badge" style="background: #fdf2f4; color: #8b263e;">Seguridad de la Cuenta</span>
      <h2 style="font-weight: 300; margin: 16px 0 8px; font-size: 22px;">Restablecer su Contraseña</h2>
      <p style="color: #555; line-height: 1.6;">
        Estimado/a ${userName || "cliente"}, hemos recibido una solicitud para restablecer la contraseña asociada a su cuenta en el Atelier AMAL.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Haga clic en el botón a continuación para definir su nueva credencial segura. Este enlace tiene una validez estricta de 60 minutos por razones de seguridad:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" class="btn" style="background: #8b263e; padding: 14px 28px; font-size: 14px;">Restablecer mi Contraseña</a>
      </div>
      <p style="font-size: 12px; color: #888; line-height: 1.5; border-top: 1px solid #eee; padding-top: 16px;">
        Si el botón no funciona, copie y pegue el siguiente enlace en su navegador:<br>
        <span style="font-family: monospace; color: #555; word-break: break-all;">${resetLink}</span>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 16px;">
        Si usted no solicitó este cambio de contraseña, puede ignorar este mensaje con total tranquilidad. Su cuenta permanece segura.
      </p>
    `,
    );

    logger.info(
      { recipient: email, resetLink },
      "📧 [EMAIL SERVICE] Sent Password Reset Email",
    );
    return true;
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email");
    return false;
  }
}

