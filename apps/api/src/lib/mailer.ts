import nodemailer from "nodemailer";
import { env } from "../env.js";

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    })
  : null;

export const emailDeliveryEnabled = isConfigured;

/**
 * Sends the password reset email. Returns true if a real email was sent, false if no
 * SMTP is configured (the caller should fall back to a dev-mode response in that case).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — password reset link for ${to}: ${resetUrl}`);
    return false;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject: "Redefinir sua senha — Tribuna",
    text: `Recebemos um pedido para redefinir sua senha no Tribuna.\n\nClique no link abaixo para escolher uma nova senha (expira em 1 hora):\n${resetUrl}\n\nSe você não pediu isso, pode ignorar este e-mail.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#08110A;">Redefinir sua senha</h2>
        <p>Recebemos um pedido para redefinir sua senha no <strong>Tribuna</strong>.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block; background:#C6FF3D; color:#08110A; font-weight:600; padding:12px 24px; border-radius:999px; text-decoration:none; margin: 16px 0;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#666; font-size:13px;">Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
      </div>
    `,
  });

  return true;
}
