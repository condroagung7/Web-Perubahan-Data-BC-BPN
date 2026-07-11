export const PERSYARATAN_UMUM = [
  "Surat Permohonan",
  "Surat Pernyataan",
  "BL/AWB Asli",
  "BL/AWB Revisi",
];

/**
 * Peta dokumen tambahan yang wajib dilampirkan berdasarkan pilihan
 * "Data yang Dirubah". Persyaratan Umum selalu wajib di luar peta ini.
 */
export const PETA_DOKUMEN_TAMBAHAN: Record<string, string[]> = {
  "Nama Consignee": [
    "Surat Pernyataan Kepemilikan Barang",
    "Surat Pernyataan Bukan Kepemilikan Barang",
    "NPWP",
    "NIB",
    "Invoice",
    "Packing List",
  ],
  "Nama Shipper": ["Invoice", "Packing List"],
  "Alamat Consignee": ["NPWP"],
  "Alamat Shipper": ["NPWP"],
  "NPWP": ["NPWP", "Invoice", "Packing List"],
  "Jumlah Kemasan": ["Laporan Timbang Muat Data Kemasan"],
  "Berat Brutto": [
    "Laporan Hasil Timbang Ulang",
    "Foto Barang saat Ditimbang Ulang",
  ],
  "Jenis Pos": [],
  "Kelompok Pos": [],
  "Nomor BL/AWB": [],
  "Tanggal BL/AWB": [],
  "Pelabuhan Asal": ["Voyage Memo", "Logbook Kapal"],
  "Pelabuhan Tujuan": ["Voyage Memo", "Logbook Kapal"],
  "Pelabuhan Bongkar": ["Voyage Memo", "Logbook Kapal"],
  "Pelabuhan Transit": ["Voyage Memo", "Logbook Kapal"],
  "Waktu Tiba": ["Bukti Waktu Sesuai Lapangan (Foto/Email/Chat WA)"],
  "Waktu Muat": ["Bukti Waktu Sesuai Lapangan (Foto/Email/Chat WA)"],
  "Waktu Bongkar": ["Bukti Waktu Sesuai Lapangan (Foto/Email/Chat WA)"],
  "Uraian Barang": ["Invoice", "Packing List"],
  "Nomor Voyage / Flight": [],
  "Tambah Pos Inward": [
    "Surat Pernyataan Kepemilikan Barang",
    "Purchase Order",
    "Invoice",
    "Packing List",
    "Bukti Bayar ke Shipper/Bukti Komunikasi Pemesanan Barang",
    "Foto Label dan Dokumen pada Kemasan Barang",
  ],
  "Pembatalan RKSP": ["Surat Pernyataan dari Consignee Belum Menerima Barang"],
};

/**
 * Menghitung daftar dokumen wajib (tanpa duplikat) berdasarkan seluruh
 * baris "Data yang Dirubah" yang telah dipilih pengguna di tabel.
 */
export function hitungDokumenWajib(dataYangDirubahList: string[]): string[] {
  const hasil = [...PERSYARATAN_UMUM];

  for (const item of dataYangDirubahList) {
    const tambahan = PETA_DOKUMEN_TAMBAHAN[item];
    if (!tambahan) continue;
    for (const dok of tambahan) {
      if (!hasil.includes(dok)) hasil.push(dok);
    }
  }

  return hasil;
}