"use client";

import { useState } from "react";
import type { Permohonan, StatusPermohonan } from "@/types/database";

const STATUS_LABEL: Record<StatusPermohonan, { text: string; className: string }> = {
  pending: { text: "Menunggu", className: "bg-amber-100 text-amber-700" },
  diproses: { text: "Diproses", className: "bg-blue-100 text-blue-700" },
  disetujui: { text: "Disetujui", className: "bg-green-100 text-green-700" },
  ditolak: { text: "Ditolak", className: "bg-red-100 text-red-700" },
};

export default function DashboardTable({
  initialData,
}: {
  initialData: Permohonan[];
}) {
  const [data, setData] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "disetujui" } : p))
        );
      } else {
        const json = await res.json();
        alert(json.error ?? "Gagal menyetujui permohonan");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    const catatan = prompt("Alasan penolakan:");
    if (!catatan) return;

    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, catatan }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "ditolak", catatan_admin: catatan } : p
          )
        );
      } else {
        const json = await res.json();
        alert(json.error ?? "Gagal menolak permohonan");
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Belum ada permohonan masuk.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Kode</th>
            <th className="px-4 py-3 font-medium">Perusahaan</th>
            <th className="px-4 py-3 font-medium">Jenis</th>
            <th className="px-4 py-3 font-medium">Ringkasan Perubahan</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-xs">{p.kode_tracking}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{p.nama_perusahaan}</div>
                <div className="text-xs text-slate-500">{p.email_perusahaan}</div>
              </td>
              <td className="px-4 py-3">{p.jenis_perubahan_data}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {p.detail_perubahan.length} baris data diubah
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_LABEL[p.status].className}`}
                >
                  {STATUS_LABEL[p.status].text}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                {p.status === "pending" || p.status === "diproses" ? (
                  <>
                    <button
                      onClick={() => handleApprove(p.id)}
                      disabled={loadingId === p.id}
                      className="rounded-md bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      disabled={loadingId === p.id}
                      className="rounded-md bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                    >
                      Tolak
                    </button>
                  </>
                ) : p.surat_persetujuan_url ? (
                  <a
                    href={p.surat_persetujuan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Lihat Surat
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}