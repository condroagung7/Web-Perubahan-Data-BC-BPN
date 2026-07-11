"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  HardDrive,
  Inbox,
  Loader2,
  RefreshCw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DokumenPendukung, Permohonan, StatusPermohonan } from "@/types/database";

const STATUS_LABEL: Record<StatusPermohonan, { text: string; className: string }> = {
  pending: { text: "Menunggu", className: "bg-amber-100 text-amber-700" },
  diproses: { text: "Diproses", className: "bg-blue-100 text-blue-700" },
  disetujui: { text: "Diterima Lengkap", className: "bg-green-100 text-green-700" },
  ditolak: { text: "Kekurangan Dokumen", className: "bg-red-100 text-red-700" },
};

type StorageUsage = {
  limitMb: number;
  usedMb: number;
  remainingMb: number;
  usedPercent: number;
  remainingPercent: number;
};

type PreviewDokumen = DokumenPendukung & {
  signedUrl: string;
};

function getDokumenList(permohonan: Permohonan) {
  return Array.isArray(permohonan.dokumen_pendukung) ? permohonan.dokumen_pendukung : [];
}

function isSuratPermohonan(dokumen: DokumenPendukung) {
  return `${dokumen.nama} ${dokumen.nama_file}`.toLowerCase().includes("surat permohonan");
}

function formatMb(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function DokumenViewer({
  title,
  dokumen,
  zoom,
}: {
  title: string;
  dokumen: PreviewDokumen | null;
  zoom: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {dokumen?.nama_file ?? "Tidak tersedia"}
          </p>
        </div>
        {dokumen ? (
          <a
            href={dokumen.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ExternalLink size={12} />
            Buka
          </a>
        ) : null}
      </div>

      <div className="min-h-105 flex-1 overflow-auto bg-slate-100 p-3 dark:bg-slate-900">
        {dokumen ? (
          <div
            className="h-225 origin-top-left overflow-hidden rounded-md bg-white shadow-sm"
            style={{
              width: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
            }}
          >
            <iframe
              src={dokumen.signedUrl}
              title={title}
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          <div className="flex h-full min-h-105 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Surat permohonan belum ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardTable({
  initialData,
}: {
  initialData: Permohonan[];
}) {
  const [data, setData] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedPermohonan, setSelectedPermohonan] = useState<Permohonan | null>(null);
  const [previewDokumen, setPreviewDokumen] = useState<PreviewDokumen[]>([]);
  const [activeDokumenPath, setActiveDokumenPath] = useState<string | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [deletingBerkasId, setDeletingBerkasId] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  async function loadStorageUsage() {
    setStorageLoading(true);
    setStorageError(null);

    try {
      const res = await fetch("/api/admin/storage-usage", { cache: "no-store" });
      const json = (await res.json()) as StorageUsage & { error?: string };

      if (!res.ok) {
        setStorageError(json.error ?? "Gagal membaca kapasitas Supabase");
        setStorageUsage(null);
        return;
      }

      setStorageUsage(json);
    } catch {
      setStorageError("Gagal membaca kapasitas Supabase");
      setStorageUsage(null);
    } finally {
      setStorageLoading(false);
    }
  }

  useEffect(() => {
    loadStorageUsage();
  }, []);

  function updatePermohonan(id: string, updater: (permohonan: Permohonan) => Permohonan) {
    setData((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
    setSelectedPermohonan((prev) => (prev?.id === id ? updater(prev) : prev));
  }

  async function getSignedDokumenUrl(permohonanId: string, path: string) {
    const res = await fetch("/api/admin/dokumen-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permohonanId, path }),
    });
    const json = (await res.json()) as { url?: string; error?: string };

    if (!res.ok || !json.url) {
      throw new Error(json.error ?? "Gagal membuka dokumen");
    }

    return json.url;
  }

  async function handleOpenReview(permohonan: Permohonan) {
    const dokumenList = getDokumenList(permohonan);
    if (dokumenList.length === 0) return;

    setReviewLoadingId(permohonan.id);
    try {
      const signedDokumen = await Promise.all(
        dokumenList.map(async (dokumen) => ({
          ...dokumen,
          signedUrl: await getSignedDokumenUrl(permohonan.id, dokumen.url),
        }))
      );

      const suratPermohonan = signedDokumen.find(isSuratPermohonan) ?? signedDokumen[0];
      const firstComparison =
        signedDokumen.find((dokumen) => dokumen.url !== suratPermohonan.url) ?? suratPermohonan;

      setSelectedPermohonan(permohonan);
      setPreviewDokumen(signedDokumen);
      setActiveDokumenPath(firstComparison.url);
      setZoom(1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memuat dokumen");
    } finally {
      setReviewLoadingId(null);
    }
  }

  async function handleDeleteBerkasPermohonan(permohonan: Permohonan) {
    const yakin = confirm(
      "Apakah yakin ingin menghapus surat persetujuan dan dokumen pendukung ?"
    );
    if (!yakin) return;

    setDeletingBerkasId(permohonan.id);
    try {
      const res = await fetch("/api/admin/delete-berkas-permohonan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: permohonan.id }),
      });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        alert(json.error ?? "Gagal menghapus berkas permohonan");
        return;
      }

      updatePermohonan(permohonan.id, (item) => ({
        ...item,
        dokumen_pendukung: [],
        surat_persetujuan_url: null,
      }));
      loadStorageUsage();
    } finally {
      setDeletingBerkasId(null);
    }
  }

  async function handleDiterimaLengkap(id: string) {
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
        setSelectedPermohonan(null);
        setPreviewDokumen([]);
        loadStorageUsage();
      } else {
        const json = await res.json();
        alert(json.error ?? "Gagal menandai dokumen diterima lengkap");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleKekuranganDokumen(id: string) {
    const catatan = prompt("Catatan kekurangan dokumen:");
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
        setSelectedPermohonan(null);
        setPreviewDokumen([]);
      } else {
        const json = await res.json();
        alert(json.error ?? "Gagal menandai kekurangan dokumen");
      }
    } finally {
      setLoadingId(null);
    }
  }

  const suratPermohonan = previewDokumen.find(isSuratPermohonan) ?? previewDokumen[0] ?? null;
  const comparisonDokumen = previewDokumen.filter(
    (dokumen) => dokumen.url !== suratPermohonan?.url
  );
  const activeDokumen =
    previewDokumen.find((dokumen) => dokumen.url === activeDokumenPath) ??
    comparisonDokumen[0] ??
    suratPermohonan;
  const summary = {
    diterima: data.length,
    diterimaLengkap: data.filter((item) => item.status === "disetujui").length,
    kekuranganDokumen: data.filter((item) => item.status === "ditolak").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <HardDrive size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Kapasitas Supabase Storage
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Bucket dokumen pendukung dan surat persetujuan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadStorageUsage}
              disabled={storageLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} className={storageLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-4">
            {storageLoading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Menghitung kapasitas storage...
              </div>
            ) : storageError ? (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {storageError}
              </div>
            ) : storageUsage ? (
              <>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Terpakai {storageUsage.usedPercent}%</span>
                  <span>Sisa {storageUsage.remainingPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${storageUsage.usedPercent}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Terpakai</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatMb(storageUsage.usedMb)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sisa ruang upload</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatMb(storageUsage.remainingMb)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Batas kapasitas</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatMb(storageUsage.limitMb)} MB
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Inbox size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ringkasan Surat Permohonan
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Jumlah data berdasarkan status permohonan.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Inbox size={14} />
                Diterima
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.diterima}
              </p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-950 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-300">
                <CheckCircle2 size={14} />
                Diterima Lengkap
              </div>
              <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-300">
                {summary.diterimaLengkap}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-950 dark:bg-red-950/20">
              <div className="flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300">
                <AlertCircle size={14} />
                Kekurangan Dokumen
              </div>
              <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-300">
                {summary.kekuranganDokumen}
              </p>
            </div>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Belum ada permohonan masuk.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Perusahaan</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Ringkasan Perubahan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((p) => {
                const hasBerkas =
                  getDokumenList(p).length > 0 || Boolean(p.surat_persetujuan_url);

                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">{p.kode_tracking}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {p.nama_perusahaan}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.email_perusahaan}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {p.jenis_perubahan_data}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {p.detail_perubahan.length} baris data diubah
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_LABEL[p.status].className
                        }`}
                      >
                        {STATUS_LABEL[p.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(p)}
                          disabled={getDokumenList(p).length === 0 || reviewLoadingId === p.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {reviewLoadingId === p.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                          Tinjau
                        </button>

                        {p.surat_persetujuan_url ? (
                          <a
                            href={p.surat_persetujuan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Lihat Surat
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleDeleteBerkasPermohonan(p)}
                          disabled={!hasBerkas || deletingBerkasId === p.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingBerkasId === p.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPermohonan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-4">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Perbandingan Surat Permohonan dan Dokumen Pendukung
                </h2>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {selectedPermohonan.kode_tracking} - {selectedPermohonan.nama_perusahaan}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(value - 0.1, 0.6))}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ZoomOut size={14} />
                  Zoom
                </button>
                <span className="w-12 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(value + 0.1, 1.8))}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ZoomIn size={14} />
                  Zoom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPermohonan(null);
                    setPreviewDokumen([]);
                  }}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Tutup perbandingan dokumen"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {comparisonDokumen.length > 0 ? (
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                <div className="flex gap-2 overflow-x-auto">
                  {comparisonDokumen.map((dokumen) => (
                    <button
                      key={dokumen.url}
                      type="button"
                      onClick={() => setActiveDokumenPath(dokumen.url)}
                      className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium ${
                        activeDokumen?.url === dokumen.url
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {dokumen.nama}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-2">
              <DokumenViewer title="Surat Permohonan" dokumen={suratPermohonan} zoom={zoom} />
              <DokumenViewer title="Dokumen Pendukung" dokumen={activeDokumen} zoom={zoom} />
            </div>

            {(selectedPermohonan.status === "pending" ||
              selectedPermohonan.status === "diproses") && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleKekuranganDokumen(selectedPermohonan.id)}
                  disabled={loadingId === selectedPermohonan.id}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Kekurangan Dokumen
                </button>
                <button
                  type="button"
                  onClick={() => handleDiterimaLengkap(selectedPermohonan.id)}
                  disabled={loadingId === selectedPermohonan.id}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Diterima Lengkap
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
