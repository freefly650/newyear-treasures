"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => setEmailConfigured(!!data?.emailConfigured))
      .catch(() => setEmailConfigured(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не вдалося увійти.");
        setLoading(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Сталася помилка.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
      <h1 className="font-display text-2xl text-ink">Новорічні Скарби</h1>
      <p className="mt-1 text-sm text-mauve">
        Увійдіть, щоб переглянути свою колекцію.
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
          <div className="flex justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-mauve">
              Пароль
            </label>
            {emailConfigured && (
              <Link href="/forgot-password" className="text-xs text-mauve hover:text-rose">
                Забули пароль?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-3 text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
            placeholder="Введіть пароль"
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
          className="w-full min-h-[48px] rounded-xl bg-rose px-4 py-3 text-sm font-medium text-white touch-manipulation hover:bg-rose/90 disabled:opacity-50"
        >
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-mauve">
        Немає облікового запису?{" "}
        <Link href="/register" className="text-rose underline hover:no-underline">
          Зареєструватися
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <Suspense fallback={<div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm text-mauve">Завантаження...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
