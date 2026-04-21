"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Паролі не співпадають.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль має містити щонайменше 6 символів.");
      return;
    }
    if (!token) {
      setError("Невірне посилання для скидання.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Reset failed.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
        <h1 className="font-display text-2xl text-ink">Скидання пароля</h1>
        <p className="mt-4 text-rose">Невірне або відсутнє посилання для скидання.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm text-rose underline hover:no-underline">
          Запросити нове посилання
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
        <h1 className="font-display text-2xl text-ink">Пароль оновлено</h1>
        <p className="mt-4 text-ink">Тепер можна увійти. Переходимо на сторінку входу...</p>
        <Link href="/login" className="mt-6 inline-block text-sm text-rose underline hover:no-underline">
          Увійти
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
      <h1 className="font-display text-2xl text-ink">Новий пароль</h1>
      <p className="mt-1 text-sm text-mauve">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-mauve">
            Новий пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            className="mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
            placeholder="At least 6 characters"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-mauve">
            Підтвердьте пароль
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            className="mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
            placeholder="Repeat password"
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
          {loading ? "Оновлення..." : "Оновити пароль"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-mauve">
        <Link href="/login" className="text-rose underline hover:no-underline">
          Назад до входу
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <Suspense fallback={<div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm text-mauve">Завантаження...</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
