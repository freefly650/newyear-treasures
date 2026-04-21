"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Запит не виконано.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Сталася помилка.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
        <h1 className="font-display text-2xl text-ink">Скидання пароля</h1>
        <p className="mt-1 text-sm text-mauve">
          Введіть пошту і ми надішлемо посилання для нового пароля.
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-mauve">
                Електронна пошта
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
                placeholder="you@example.com"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-rose" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] rounded-xl bg-rose px-4 py-3 text-sm font-medium text-white hover:bg-rose/90 disabled:opacity-50"
            >
              {loading ? "Надсилання..." : "Надіслати посилання"}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-ink">
            If an account exists with that email, you’ll receive a link to reset your password. Check your inbox and spam folder.
          </p>
        )}
        <p className="mt-6 text-center text-sm text-mauve">
          <Link href="/login" className="text-rose underline hover:no-underline">
            Назад до входу
          </Link>
        </p>
      </div>
    </div>
  );
}
