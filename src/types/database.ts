export type StatusPermohonan = "pending" | "diproses" | "disetujui" | "ditolak";
export type JenisPerubahanData = "RKSP" | "INWARD" | "OUTWARD";
export type PihakPengaju = "NVOCC" | "Operator Sarana Pengangkut";

export interface DetailPerubahan {
  data_yang_dirubah: string;
  data_semula: string;
  data_seharusnya: string;
}

export interface Permohonan {
  id: string;
  nama_perusahaan: string;
  kota: string;
  nomor_surat_permohonan: string;
  tanggal_surat_permohonan: string;
  perihal: string;
  jenis_perubahan_data: JenisPerubahanData;
  pihak_pengaju: PihakPengaju;
  nomor_aju_manifes: string;
  alasan_perubahan: string;
  nomor_pendaftaran_bc11: string;
  nama_penandatangan: string;
  jabatan_penandatangan: string;
  logo_perusahaan_url: string | null;
  email_perusahaan: string;
  alamat_perusahaan: string;
  detail_perubahan: DetailPerubahan[];
  status: StatusPermohonan;
  surat_persetujuan_url: string | null;
  catatan_admin: string | null;
  kode_tracking: string;
  created_at: string;
  updated_at: string;
}

export interface RiwayatStatus {
  id: string;
  permohonan_id: string;
  status_sebelum: StatusPermohonan | null;
  status_sesudah: StatusPermohonan;
  catatan: string | null;
  diubah_oleh: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface Database {
  public: {
    Tables: {
      permohonan: {
        Row: Permohonan;
        Insert: Omit<
          Permohonan,
          "id" | "status" | "surat_persetujuan_url" | "catatan_admin" | "kode_tracking" | "created_at" | "updated_at"
        >;
        Update: Partial<Permohonan>;
      };
      riwayat_status: {
        Row: RiwayatStatus;
        Insert: Omit<RiwayatStatus, "id" | "created_at">;
        Update: Partial<RiwayatStatus>;
      };
    };
  };
}