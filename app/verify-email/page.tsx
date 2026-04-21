"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Відсутнє посилання підтвердження.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified. You can now sign in.");
        } else {
          setStatus("error");
          setMessage(data.error || "Не вдалося підтвердити пошту.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Сталася помилка.");
      });
  }, [token]);

  return (
    <div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm">
      <h1 className="font-display text-2xl text-ink">Підтвердження пошти</h1>
      {status === "loading" && (
        <p className="mt-4 text-mauve">Перевіряємо вашу пошту...</p>
      )}
      {status === "success" && (
        <>
          <p className="mt-4 text-ink">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-block min-h-[48px] rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white hover:bg-rose/90"
          >
            Увійти
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="mt-4 text-rose">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-mauve underline hover:text-ink"
          >
            Назад до входу
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <Suspense fallback={<div className="rounded-2xl border border-blush/40 bg-white/90 p-6 shadow-sm text-mauve">Завантаження...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
