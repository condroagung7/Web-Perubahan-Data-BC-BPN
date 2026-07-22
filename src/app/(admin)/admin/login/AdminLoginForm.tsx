"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    if (!captchaToken) {
      setErrorMsg("Harap selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // 1. Verify Turnstile token server-side before attempting login
    try {
      const verifyRes = await fetch("/api/auth/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken: captchaToken }),
      });

      if (!verifyRes.ok) {
        const data = (await verifyRes.json()) as { error?: string };
        setErrorMsg(
          data.error ?? "Verifikasi keamanan gagal. Silakan coba lagi."
        );
        // Reset captcha so user must complete it again
        setCaptchaToken(null);
        turnstileRef.current?.reset();
        setLoading(false);
        return;
      }
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server. Silakan coba lagi.");
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }

    // 2. CAPTCHA valid — proceed with Supabase authentication
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Email atau kata sandi salah");
      // Always reset captcha after a failed login so a new challenge is required
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Login Admin
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Khusus untuk petugas yang menangani permohonan perubahan data.
      </p>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {/* Cloudflare Turnstile CAPTCHA */}
        <div>
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => {
              setCaptchaToken(null);
              turnstileRef.current?.reset();
            }}
            onError={() => {
              setCaptchaToken(null);
              setErrorMsg(
                "Widget verifikasi keamanan gagal dimuat. Muat ulang halaman."
              );
            }}
            options={{ theme: "auto", language: "id" }}
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !captchaToken}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}