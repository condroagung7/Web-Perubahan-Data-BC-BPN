"use client";

import { useState, type FormEvent } from "react";

interface StatusData {
  kode_tracking: string;
  nama_perusahaan: string;
  jenis_perubahan_data: string;
  status: string;
  created_at: string;
  catatan_admin: string | null;
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: "Menunggu Diproses", className: "bg-amber-100 text-amber-700" },
  diproses: { text: "Sedang Diproses", className: "bg-blue-100 text-blue-700" },
  disetujui: { text: "Diterima Lengkap", className: "bg-green-100 text-green-700" },
  ditolak: { text: "Kekurangan Dokumen", className: "bg-red-100 text-red-700" },
};

export default function StatusPage() {
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StatusData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setData(null);

    try {
      const res = await fetch(`/api/permohonan?kode=${encodeURIComponent(kode)}`);
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Permohonan tidak ditemukan");
        return;
      }

      setData(json.data);
    } catch {
      setErrorMsg("Gagal memuat status. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cek Status Permohonan</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Masukkan kode tracking yang Anda terima saat mengajukan permohonan.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="Contoh: a1b2c3d4"
            className="input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition whitespace-nowrap"
          >
            {loading ? "Mencari..." : "Cek"}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}

        {data && (
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm">
            <Row label="Kode Tracking" value={data.kode_tracking} />
            <Row label="Nama Perusahaan" value={data.nama_perusahaan} />
            <Row label="Jenis Perubahan Data" value={data.jenis_perubahan_data} />
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  STATUS_LABEL[data.status]?.className ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {STATUS_LABEL[data.status]?.text ?? data.status}
              </span>
            </div>
            {data.catatan_admin && (
              <Row label="Catatan Admin" value={data.catatan_admin} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-slate-100 text-right">{value}</span>
    </div>
  );
}