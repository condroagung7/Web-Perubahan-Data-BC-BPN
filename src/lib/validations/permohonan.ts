import { z } from "zod";

export const detailPerubahanSchema = z.object({
  data_yang_dirubah: z.string().min(1, "Wajib diisi").max(200),
  data_semula: z.string().min(1, "Wajib diisi").max(500),
  data_seharusnya: z.string().min(1, "Wajib diisi").max(500),
});

export const permohonanSchema = z.object({
  nama_perusahaan: z.string().min(3, "Nama perusahaan minimal 3 karakter").max(150),
  kota: z.string().min(2, "Kota wajib diisi").max(100),
  nomor_surat_permohonan: z.string().min(1, "Nomor surat wajib diisi").max(100),
  tanggal_surat_permohonan: z.string().min(1, "Tanggal surat wajib diisi"),
  perihal: z.string().min(3, "Perihal wajib diisi").max(300),
  jenis_perubahan_data: z.enum(["RKSP", "INWARD", "OUTWARD"], {
    message: "Pilih jenis perubahan data",
  }),
  pihak_pengaju: z.enum(["NVOCC", "Operator Sarana Pengangkut"], {
    message: "Pilih pihak yang mengajukan",
  }),
  nomor_aju_manifes: z.string().min(1, "Nomor aju manifes wajib diisi").max(100),
  alasan_perubahan: z
    .string()
    .min(10, "Jelaskan alasan minimal 10 karakter")
    .max(1000),
  nomor_pendaftaran_bc11: z.string().min(1, "Nomor pendaftaran BC 1.1 wajib diisi").max(200),
  nama_penandatangan: z.string().min(3, "Nama penandatangan wajib diisi").max(100),
  jabatan_penandatangan: z.string().min(2, "Jabatan wajib diisi").max(100),
  logo_perusahaan_url: z.string().optional().nullable(),
  email_perusahaan: z.string().email("Format email tidak valid"),
  alamat_perusahaan: z.string().min(10, "Alamat wajib diisi").max(500),
  detail_perubahan: z
    .array(detailPerubahanSchema)
    .min(1, "Minimal 1 baris data perubahan"),
});

export type PermohonanFormData = z.infer<typeof permohonanSchema>;
export type DetailPerubahan = z.infer<typeof detailPerubahanSchema>;