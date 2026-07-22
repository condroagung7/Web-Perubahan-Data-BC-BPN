import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import TelegramSettingsClient from "./TelegramSettingsClient";
import PageThemeToggle from "@/components/theme/PageThemeToggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Pengaturan
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Kelola admin yang menerima notifikasi Telegram ketika ada permohonan baru.
            </p>
          </div>
          <PageThemeToggle />
        </div>

        <div className="mt-8">
          <TelegramSettingsClient />
        </div>
      </div>
    </main>
  );
}