import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import type { Permohonan } from "@/types/database";
import DashboardTable from "@/components/admin/DashboardTable";
import PageThemeToggle from "@/components/theme/PageThemeToggle";

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
          <PageThemeToggle />
        </div>

        <div className="mt-6">
          <DashboardTable initialData={permohonanList ?? []} />
        </div>
      </div>
    </main>
  );
}
