import { createClient } from "@/lib/supabase/server";
import type { Permohonan } from "@/types/database";
import DashboardTable from "@/components/admin/DashboardTable";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: permohonanList } = await supabase
    .from("permohonan")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Permohonan[]>();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard Permohonan
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Tinjau, setujui, atau tolak permohonan perubahan data yang masuk.
        </p>

        <div className="mt-6">
          <DashboardTable initialData={permohonanList ?? []} />
        </div>
      </div>
    </main>
  );
}
