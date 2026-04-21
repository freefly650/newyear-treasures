"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (password !== confirmPassword) {
      setError("Паролі не співпадають.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не вдалося зареєструватися.");
        setLoading(false);
        return;
      }
      setSuccessMessage(data.message || "Перевірте пошту для підтвердження акаунта.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
    } catch {
      setError("Сталася помилка.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
        <h1 className="font-display text-2xl text-ink">Створити акаунт</h1>
        <p className="mt-1 text-sm text-mauve">
          Зареєструйтесь, щоб вести колекцію іграшок.
        </p>
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-mauve">
              Ім&apos;я (необов&apos;язково)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-mauve">
              Пароль
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 pr-12 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-mauve hover:text-ink hover:bg-blush/20"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-mauve">
              Підтвердьте пароль
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 pr-12 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
                placeholder="Repeat password"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-mauve hover:text-ink hover:bg-blush/20"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-blush/50 bg-cream/30 p-3 text-xs text-mauve">
            <p className="font-medium text-ink mb-1">Попередній доступ / лише для тестування</p>
            <p>
              This service is provided as preview functionality for testing purposes only. There are no guarantees regarding data confidentiality, availability of the service, or retention of your data. The service may be modified, suspended, or discontinued at any time without notice. By creating an account you use the service at your own risk.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedDisclaimer}
              onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-mauve/50 text-rose focus:ring-rose"
              aria-describedby="disclaimer-desc"
            />
            <span id="disclaimer-desc">
              I have read and accept the above. I understand this is preview functionality for testing only and that there are no guarantees on data confidentiality, service access, or data retention.
            </span>
          </label>
          {error && (
            <p className="text-sm text-rose" role="alert">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-ink" role="status">
              {successMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !acceptedDisclaimer}
            className="w-full min-h-[48px] rounded-xl bg-rose px-4 py-3 text-sm font-medium text-white touch-manipulation hover:bg-rose/90 disabled:opacity-50"
          >
            {loading ? "Створення акаунта..." : "Зареєструватися"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-mauve">
          Вже маєте акаунт?{" "}
          <Link href="/login" className="text-rose underline hover:no-underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
