"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Download, FileText } from "lucide-react";
import {
  permohonanSchema,
  type PermohonanFormData,
} from "@/lib/validations/permohonan";
import SearchableCombobox from "@/components/forms/SearchableCombobox";
import DocumentChecklistUpload, {
  type DokumenPendukung,
} from "@/components/forms/DocumentChecklistUpload";
import PageThemeToggle from "@/components/theme/PageThemeToggle";

const JENIS_PERUBAHAN_DATA = ["RKSP", "INWARD", "OUTWARD"] as const;
const PIHAK_PENGAJU = ["NVOCC", "Operator Sarana Pengangkut"] as const;
const PERUBAHAN_DATA_TERHADAP = ["Pos/Barang", "Sarana Pengangkut"] as const;
const OPSI_JUMLAH_BARIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const OPSI_DATA_YANG_DIRUBAH = [
  "Nama Consignee",
  "Nama Shipper",
  "Alamat Consignee",
  "Alamat Shipper",
  "NPWP",
  "Jumlah Kemasan",
  "Berat Brutto",
  "Jenis Pos",
  "Kelompok Pos",
  "Nomor BL/AWB",
  "Tanggal BL/AWB",
  "Pelabuhan Asal",
  "Pelabuhan Tujuan",
  "Pelabuhan Bongkar",
  "Pelabuhan Transit",
  "Waktu Tiba",
  "Waktu Muat",
  "Waktu Bongkar",
  "Uraian Barang",
  "Nomor Voyage / Flight",
  "Tambah Pos Inward",
  "Pembatalan RKSP",
];

export default function FormPermohonanPage() {
  const [submitting, setSubmitting] = useState(false);
  const [hasil, setHasil] = useState<{ kode_tracking: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [jumlahBaris, setJumlahBaris] = useState(1);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PermohonanFormData>({
    resolver: zodResolver(permohonanSchema),
    defaultValues: {
      alasan_perubahan: "Pos/Barang",
      nomor_pos: "",
      nama_sarana_pengangkut: "",
      nomor_bl_awb: "",
      tanggal_bl_awb: "",
      jumlah_kemasan: "",
      berat_kotor: "",
      uraian_barang: "",
      nama_shipper: "",
      nama_consignee: "",
      detail_perubahan: [
        { data_yang_dirubah: "", data_semula: "", data_seharusnya: "" },
      ],
      dokumen_pendukung: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detail_perubahan",
  });

  const perubahanDataTerhadap = useWatch({
    control,
    name: "alasan_perubahan",
  });

  const detailPerubahan = useWatch({
    control,
    name: "detail_perubahan",
  });

  const tampilkanDataManifesSebelum = perubahanDataTerhadap === "Pos/Barang";

  function handleJumlahBarisChange(value: number) {
    setJumlahBaris(value);
    const selisih = value - fields.length;
    if (selisih > 0) {
      for (let i = 0; i < selisih; i++) {
        append({ data_yang_dirubah: "", data_semula: "", data_seharusnya: "" });
      }
    } else if (selisih < 0) {
      for (let i = 0; i < Math.abs(selisih); i++) {
        remove(fields.length - 1 - i);
      }
    }
  }

  async function onSubmit(data: PermohonanFormData) {
    if (!captchaToken) {
      setCaptchaError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setCaptchaError(null);
    try {
      const res = await fetch("/api/permohonan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken: captchaToken }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Terjadi kesalahan");
        return;
      }

      setHasil({ kode_tracking: json.kode_tracking });
      reset();
      setJumlahBaris(1);
    } catch {
      setErrorMsg("Gagal mengirim permohonan. Coba lagi.");
    } finally {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      setSubmitting(false);
    }
  }

  if (hasil) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Permohonan Berhasil Diajukan
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Simpan kode tracking berikut untuk memantau status:
          </p>
          <p className="mt-4 text-2xl font-mono font-bold text-blue-600">
            {hasil.kode_tracking}
          </p>
          <a
            href="/status"
            className="mt-6 inline-block text-sm text-blue-600 hover:underline"
          >
            Cek status sekarang →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Formulir Permohonan Perubahan Data BC 1.1
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
              Isi data di bawah ini dengan benar. Permohonan akan diteruskan ke
              admin untuk ditinjau.
            </p>
          </div>
          <PageThemeToggle />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Butuh format surat?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Unduh template Word berikut apabila belum memiliki format surat
              permohonan dan pernyataan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/templates/Format-Surat-Permohonan.docx"
                download
                className="inline-flex items-center gap-2 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
              >
                <FileText size={14} />
                Format Surat Permohonan
                <Download size={13} />
              </a>

              <a
                href="/templates/Format-Surat-Pernyataan.docx"
                download
                className="inline-flex items-center gap-2 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
              >
                <FileText size={14} />
                Format Surat Pernyataan
                <Download size={13} />
              </a>
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Data Perusahaan
            </legend>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nama Perusahaan" error={errors.nama_perusahaan?.message}>
                <input {...register("nama_perusahaan")} className="input" />
              </Field>
              <Field
                label="Email Perusahaan"
                error={errors.email_perusahaan?.message}
              >
                <input
                  {...register("email_perusahaan")}
                  type="email"
                  className="input"
                />
              </Field>
            </div>

            <Field
              label="Alamat Perusahaan"
              error={errors.alamat_perusahaan?.message}
            >
              <input {...register("alamat_perusahaan")} className="input" />
            </Field>
          </fieldset>

          <fieldset className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <legend className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Data Surat Permohonan
            </legend>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nomor Surat Permohonan"
                error={errors.nomor_surat_permohonan?.message}
              >
                <input {...register("nomor_surat_permohonan")} className="input" />
              </Field>
              <Field
                label="Tanggal Surat Permohonan"
                error={errors.tanggal_surat_permohonan?.message}
              >
                <input
                  {...register("tanggal_surat_permohonan")}
                  type="date"
                  className="input"
                />
              </Field>
            </div>

            <Field label="Perihal" error={errors.perihal?.message}>
              <input
                {...register("perihal")}
                className="input"
                placeholder="Perihal surat permohonan"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Jenis Perubahan Data"
                error={errors.jenis_perubahan_data?.message}
              >
                <select {...register("jenis_perubahan_data")} className="input">
                  <option value="">Pilih jenis perubahan data</option>
                  {JENIS_PERUBAHAN_DATA.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Pihak yang Mengajukan Perubahan"
                error={errors.pihak_pengaju?.message}
              >
                <select {...register("pihak_pengaju")} className="input">
                  <option value="">Pilih pihak pengaju</option>
                  {PIHAK_PENGAJU.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nomor Aju Manifes"
                error={errors.nomor_aju_manifes?.message}
              >
                <input {...register("nomor_aju_manifes")} className="input" />
              </Field>
              <Field
                label="Nomor Pendaftaran BC 1.1"
                error={errors.nomor_pendaftaran_bc11?.message}
              >
                <input
                  {...register("nomor_pendaftaran_bc11")}
                  className="input"
                  placeholder="001234 tanggal 1 Januari 2026"
                />
              </Field>
            </div>

            <Field
              label="Perubahan Data Terhadap"
              error={errors.alasan_perubahan?.message}
            >
              <select {...register("alasan_perubahan")} className="input">
                <option value="">Pilih perubahan data terhadap</option>
                {PERUBAHAN_DATA_TERHADAP.map((opsi) => (
                  <option key={opsi} value={opsi}>
                    {opsi}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          {tampilkanDataManifesSebelum && (
            <fieldset className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <legend className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Data Manifes Sebelum Perubahan
              </legend>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nomor Pos" error={errors.nomor_pos?.message}>
                  <input {...register("nomor_pos")} className="input" placeholder="0001"/>
                </Field>
                <Field
                  label="Nama Sarana Pengangkut"
                  error={errors.nama_sarana_pengangkut?.message}
                >
                  <input
                    {...register("nama_sarana_pengangkut")}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nomor BL/AWB" error={errors.nomor_bl_awb?.message}>
                  <input {...register("nomor_bl_awb")} className="input" />
                </Field>
                <Field
                  label="Tanggal BL/AWB"
                  error={errors.tanggal_bl_awb?.message}
                >
                  <input
                    {...register("tanggal_bl_awb")}
                    type="date"
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Jumlah Kemasan"
                  error={errors.jumlah_kemasan?.message}
                >
                  <input
                    {...register("jumlah_kemasan")}
                    className="input"
                    placeholder="Contoh: 120 PK"
                  />
                </Field>
                <Field label="Berat Kotor" error={errors.berat_kotor?.message}>
                  <input
                    {...register("berat_kotor")}
                    className="input"
                    placeholder="Contoh: 3500 Kg"
                  />
                </Field>
              </div>

              <Field label="Uraian Barang" error={errors.uraian_barang?.message}>
                <textarea {...register("uraian_barang")} className="input" rows={2} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nama Shipper" error={errors.nama_shipper?.message}>
                  <input {...register("nama_shipper")} className="input" />
                </Field>
                <Field
                  label="Nama Consignee"
                  error={errors.nama_consignee?.message}
                >
                  <input {...register("nama_consignee")} className="input" />
                </Field>
              </div>
            </fieldset>
          )}

          <fieldset className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex items-center justify-between">
              <legend className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Detail Perubahan Data
              </legend>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Jumlah baris:</label>
                <select
                  value={jumlahBaris}
                  onChange={(e) => handleJumlahBarisChange(Number(e.target.value))}
                  className="input w-auto! text-xs py-1"
                >
                  {OPSI_JUMLAH_BARIS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.detail_perubahan?.message && (
              <p className="text-xs text-red-600">
                {errors.detail_perubahan.message}
              </p>
            )}

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 w-1/4">
                      Data yang Dirubah
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                      Data Semula
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                      Data Seharusnya
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="p-2 align-top min-w-45">
                        <Controller
                          control={control}
                          name={`detail_perubahan.${index}.data_yang_dirubah`}
                          render={({ field }) => (
                            <SearchableCombobox
                              value={field.value}
                              onChange={field.onChange}
                              options={OPSI_DATA_YANG_DIRUBAH}
                              placeholder="Pilih data yang dirubah"
                            />
                          )}
                        />
                        {errors.detail_perubahan?.[index]?.data_yang_dirubah && (
                          <p className="text-xs text-red-600 mt-0.5">
                            {errors.detail_perubahan[index]?.data_yang_dirubah?.message}
                          </p>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        <input
                          {...register(`detail_perubahan.${index}.data_semula`)}
                          className="input"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          {...register(`detail_perubahan.${index}.data_seharusnya`)}
                          className="input"
                        />
                      </td>
                      <td className="p-2 align-top">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              remove(index);
                              setJumlahBaris((v) => v - 1);
                            }}
                            className="text-slate-400 hover:text-red-600"
                            aria-label="Hapus baris"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => {
                append({
                  data_yang_dirubah: "",
                  data_semula: "",
                  data_seharusnya: "",
                });
                setJumlahBaris((v) => v + 1);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
            >
              <Plus size={14} /> Tambah baris
            </button>
          </fieldset>

          <DocumentChecklistUpload
            dataYangDirubahList={(detailPerubahan ?? [])
              .map((d) => d.data_yang_dirubah)
              .filter(Boolean)}
            onChange={(dokumen: DokumenPendukung[]) =>
              setValue("dokumen_pendukung", dokumen)
            }
          />

          {turnstileSiteKey ? (
            <div>
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                  setCaptchaError(null);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                  setCaptchaError("Verifikasi keamanan kedaluwarsa. Silakan ulangi.");
                }}
                onError={() => {
                  setCaptchaToken(null);
                  setCaptchaError(
                    "Verifikasi keamanan gagal dimuat. Muat ulang halaman lalu coba lagi."
                  );
                }}
              />
              {captchaError && (
                <p className="mt-2 text-sm text-red-600">{captchaError}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
              Verifikasi keamanan belum dikonfigurasi. Hubungi administrator.
            </p>
          )}

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !captchaToken || !turnstileSiteKey}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition mt-4"
          >
            {submitting ? "Mengirim..." : "Ajukan Permohonan"}
          </button>
        </form>
        </div>
      </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}