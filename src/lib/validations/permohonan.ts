import { z } from "zod";

const perubahanDataTerhadapSchema = z
  .string()
  .min(1, "Pilih perubahan data terhadap")
  .refine((value) => value === "Pos/Barang" || value === "Sarana Pengangkut", {
    message: "Pilih perubahan data terhadap",
  });

export const detailPerubahanSchema = z.object({
  data_yang_dirubah: z.string().min(1, "Wajib diisi").max(200),
  data_semula: z.string().min(1, "Wajib diisi").max(500),
  data_seharusnya: z.string().min(1, "Wajib diisi").max(500),
});

const manifestField = z.string().max(500);

export const permohonanSchema = z
  .object({
  nama_perusahaan: z.string().min(3, "Nama perusahaan minimal 3 karakter").max(150),
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
  alasan_perubahan: z.enum(["Pos/Barang", "Sarana Pengangkut"], {
      message: "Pilih perubahan data terhadap",
    }),
  nomor_pendaftaran_bc11: z.string().min(1, "Nomor pendaftaran BC 1.1 wajib diisi").max(200),

  // Data manifes sebelum perubahan (untuk ditampilkan di surat persetujuan)
  nomor_pos: manifestField,
  nama_sarana_pengangkut: manifestField,
  nomor_bl_awb: manifestField,
  tanggal_bl_awb: manifestField,
  jumlah_kemasan: manifestField,
  berat_kotor: manifestField,
  uraian_barang: manifestField,
  nama_shipper: manifestField,
  nama_consignee: manifestField,

  email_perusahaan: z.string().email("Format email tidak valid"),
  alamat_perusahaan: z.string().min(10, "Alamat wajib diisi").max(500),
  detail_perubahan: z
    .array(detailPerubahanSchema)
    .min(1, "Minimal 1 baris data perubahan"),
  dokumen_pendukung: z.array(
    z.object({
      nama: z.string(),
      url: z.string(),
      nama_file: z.string(),
    })
  ),
})
  .superRefine((data, ctx) => {
    if (data.alasan_perubahan !== "Pos/Barang") return;

    const requiredManifestFields: Array<[keyof typeof data, string]> = [
      ["nomor_pos", "Nomor pos wajib diisi"],
      ["nama_sarana_pengangkut", "Nama sarana pengangkut wajib diisi"],
      ["nomor_bl_awb", "Nomor BL/AWB wajib diisi"],
      ["tanggal_bl_awb", "Tanggal BL/AWB wajib diisi"],
      ["jumlah_kemasan", "Jumlah kemasan wajib diisi"],
      ["berat_kotor", "Berat kotor wajib diisi"],
      ["uraian_barang", "Uraian barang wajib diisi"],
      ["nama_shipper", "Nama shipper wajib diisi"],
      ["nama_consignee", "Nama consignee wajib diisi"],
    ];

    for (const [field, message] of requiredManifestFields) {
      if (!String(data[field] ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [field],
        });
      }
    }
  });

export type PermohonanFormData = z.infer<typeof permohonanSchema>;
export type DetailPerubahan = z.infer<typeof detailPerubahanSchema>;
