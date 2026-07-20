"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, CheckCircle2, Loader2, FileText } from "lucide-react";
import { hitungDokumenWajib } from "@/lib/checklist-dokumen";

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface DokumenPendukung {
  nama: string;
  url: string;
  nama_file: string;
}

interface Props {
  dataYangDirubahList: string[];
  onChange: (dokumen: DokumenPendukung[]) => void;
}

export default function DocumentChecklistUpload({ dataYangDirubahList, onChange }: Props) {
  const daftarDokumen = useMemo(
    () => hitungDokumenWajib(dataYangDirubahList),
    [dataYangDirubahList]
  );

  const [uploaded, setUploaded] = useState<Record<string, DokumenPendukung>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const daftarDokumenKey = daftarDokumen.join("|");
  const uploadedForCurrentDokumen = useMemo(() => {
    const next: Record<string, DokumenPendukung> = {};
    for (const nama of daftarDokumen) {
      if (uploaded[nama]) next[nama] = uploaded[nama];
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daftarDokumenKey, uploaded]);

  useEffect(() => {
    onChange(Object.values(uploadedForCurrentDokumen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedForCurrentDokumen]);

  async function handleUpload(namaDokumen: string, file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setErrorKey(namaDokumen);
      return;
    }

    setErrorKey(null);
    setUploadingKey(namaDokumen);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("namaDokumen", namaDokumen);

      const response = await fetch("/api/dokumen/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { path?: string };
      const uploadedPath = result.path;

      if (!response.ok || !uploadedPath) {
        setErrorKey(namaDokumen);
        return;
      }

      setUploaded((prev) => ({
        ...prev,
        [namaDokumen]: { nama: namaDokumen, url: uploadedPath, nama_file: file.name },
      }));
    } catch {
      setErrorKey(namaDokumen);
    } finally {
      setUploadingKey(null);
    }
  }

  if (daftarDokumen.length === 0) return null;

  return (
    <fieldset className="space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
      <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Upload Dokumen Pendukung
      </legend>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Dokumen wajib berikut menyesuaikan otomatis dengan data yang dipilih pada tabel di atas.
        Ukuran setiap file maksimal {MAX_FILE_SIZE_MB} MB.
      </p>

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {daftarDokumen.map((nama) => {
          const info = uploadedForCurrentDokumen[nama];
          const isUploading = uploadingKey === nama;
          const isError = errorKey === nama;

          return (
            <div key={nama} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={16} className="shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                    {nama}
                  </p>
                  {info && <p className="truncate text-xs text-green-600">{info.nama_file}</p>}
                  {isError && (
                    <p className="text-xs text-red-600">
                      Gagal unggah, ukuran file maksimal {MAX_FILE_SIZE_MB} MB
                    </p>
                  )}
                </div>
              </div>

              <label className="shrink-0 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(nama, e.target.files[0])}
                />
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    info
                      ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                  }`}
                >
                  {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : info ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Upload size={14} />
                  )}
                  {info ? "Ganti File" : "Upload"}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
