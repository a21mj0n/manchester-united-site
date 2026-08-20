"use client";

import { LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const password = new FormData(e.currentTarget).get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Kirib bo'lmadi.");
        return;
      }

      router.replace(params.get("next") ?? "/admin");
      router.refresh();
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="field">
        <span>Parol</span>
        <input type="password" name="password" autoFocus autoComplete="current-password" />
      </label>
      <button type="submit" className="btn btn--primary btn--full" disabled={pending}>
        <LogIn size={17} aria-hidden="true" />
        {pending ? "Tekshirilmoqda…" : "Kirish"}
      </button>
      {error && <p className="form__msg err">{error}</p>}
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
