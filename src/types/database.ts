export type StatusPermohonan = "pending" | "diproses" | "disetujui" | "ditolak";
export type StatusSeksi = "konfirmasi_seksi_terkait" | "proses" | "persetujuan";
export type JenisPerubahanData = "RKSP" | "INWARD" | "OUTWARD";
export type PihakPengaju = "NVOCC" | "Operator Sarana Pengangkut";

export interface DetailPerubahan {
  data_yang_dirubah: string;
  data_semula: string;
  data_seharusnya: string;
}
export interface DokumenPendukung {
  nama: string;
  url: string;
  nama_file: string;
}

export interface Permohonan {
  id: string;
  nama_perusahaan: string;
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

  nomor_pos: string;
  nama_sarana_pengangkut: string;
  nomor_bl_awb: string;
  tanggal_bl_awb: string;
  jumlah_kemasan: string;
  berat_kotor: string;
  uraian_barang: string;
  nama_shipper: string;
  nama_consignee: string;

  email_perusahaan: string;
  alamat_perusahaan: string;
  detail_perubahan: DetailPerubahan[];
  dokumen_pendukung: DokumenPendukung[];
  status: StatusPermohonan;
  status_seksi: StatusSeksi | null;
  id_nadine: string | null;
  pic: string | null;
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

export interface TelegramAdmin {
  id: string;
  name: string;
  chat_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      permohonan: {
        Row: Permohonan;
        Insert: Omit <
          Permohonan,
          | "id"
          | "status"
          | "surat_persetujuan_url"
          | "catatan_admin"
          | "kode_tracking"
          | "created_at"
          | "updated_at"
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
