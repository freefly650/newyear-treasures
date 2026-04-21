/**
 * Server-only email sending via Resend.
 * Set RESEND_API_KEY and APP_URL (e.g. https://yourapp.com or http://localhost:3000).
 */
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function isEmailConfigured(): boolean {
  return !!resendApiKey && !!appUrl;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  if (!resend) {
    console.warn("[email] Resend not configured. Verification link:", verifyUrl);
    return;
  }
  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Підтвердження пошти - Новорічні Скарби",
    html: `
      <p>Дякуємо за реєстрацію. Підтвердіть пошту за посиланням:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Посилання дійсне 24 години. Якщо це були не ви, просто ігноруйте лист.</p>
    `,
  });
  if (error) {
    console.error("[email] Resend verification send failed:", error);
    throw new Error(error.message || "Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  if (!resend) {
    console.warn("[email] Resend not configured. Reset link:", resetUrl);
    return;
  }
  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Скидання пароля - Новорічні Скарби",
    html: `
      <p>Ви запросили скидання пароля. Перейдіть за посиланням:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Посилання дійсне 1 годину. Якщо це були не ви, ігноруйте цей лист.</p>
    `,
  });
  if (error) {
    console.error("[email] Resend password-reset send failed:", error);
    throw new Error(error.message || "Failed to send password reset email");
  }
}
