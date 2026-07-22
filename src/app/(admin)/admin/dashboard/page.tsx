import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import type { Permohonan } from "@/types/database";
import DashboardTable from "@/components/admin/DashboardTable";
import PageThemeToggle from "@/components/theme/PageThemeToggle";
import Link from "next/link";
import { Settings } from "lucide-react";

export default async function AdminDashboardPage() {
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

  const { data: permohonanList } = await supabase
    .from("permohonan")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Permohonan[]>();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard Permohonan
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Tinjau dokumen pendukung dan proses permohonan perubahan data yang masuk.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              Pengaturan
            </Link>
            <PageThemeToggle />
          </div>
        </div>

        <div className="mt-6">
          <DashboardTable initialData={permohonanList ?? []} />
        </div>
      </div>
    </main>
  );
}
