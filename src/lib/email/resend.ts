import { Resend } from "resend";
import type { Permohonan } from "@/types/database";

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi");
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function getSalamWaktu(): string {
  // Asia/Makassar is UTC+8
  const now = new Date();
  const makassarHour = (now.getUTCHours() + 8) % 24;
  const makassarMinutes = makassarHour * 60 + now.getUTCMinutes();

  if (makassarMinutes >= 0 && makassarMinutes < 11 * 60) return "pagi";
  if (makassarMinutes >= 11 * 60 && makassarMinutes < 15 * 60) return "siang";
  if (makassarMinutes >= 15 * 60 && makassarMinutes < 18.5 * 60) return "sore";
  return "malam";
}

function formatTanggalIndonesia(isoDate: string): string {
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  // Asia/Makassar is UTC+8
  const date = new Date(isoDate);
  const makassarDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  const hari = makassarDate.getUTCDate();
  const bulan = namaBulan[makassarDate.getUTCMonth()];
  const tahun = makassarDate.getUTCFullYear();

  return `${hari} ${bulan} ${tahun}`;
}

export async function kirimSuratPersetujuan(data: Permohonan, docxBuffer: Buffer) {
  return getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.email_perusahaan,
    subject: `Surat Persetujuan Perubahan Data - ${data.kode_tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>
          Yth. ${data.nama_perusahaan}<br />
          <span style="color:#475569;">${data.email_perusahaan}</span>
        </p>
        <p>
          Permohonan perubahan data Anda dengan kode tracking
          <strong>${data.kode_tracking}</strong> telah <strong>disetujui</strong>.
          Surat persetujuan resmi terlampir pada email ini.
        </p>
        <p>Terima kasih.</p>
      </div>
    `,
    attachments: [
      {
        filename: `Surat-Persetujuan-${data.kode_tracking}.docx`,
        content: docxBuffer,
      },
    ],
  });
}

export async function kirimDokumenPendukungDiterimaLengkap(
  data: Permohonan,
  attachments: Array<{ filename: string; content: Buffer; contentType?: string }>
) {
  const daftarLampiran = attachments
    .map((attachment) => `<li>${attachment.filename}</li>`)
    .join("");
  const salam = getSalamWaktu();
  const tanggalDiterima = formatTanggalIndonesia(data.created_at);

  return getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TUJUAN_INSTANSI!,
    subject: `Dokumen Pendukung Permohonan Diterima Lengkap - ${data.kode_tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; line-height: 1.6;">
        <p style="margin: 0 0 2px 0;">Selamat ${salam},</p>
        <p style="margin: 0 0 2px 0;"><strong>${data.nama_perusahaan}</strong></p>
        <p style="margin: 0 0 16px 0; color:#475569;">${data.email_perusahaan}</p>

        <p style="margin: 0 0 12px 0;">Kami informasikan bahwa surat yang Saudara ajukan dengan rincian:</p>

        <div style="margin: 12px 0;">
          <p style="margin: 4px 0;"><strong>nomor surat</strong> : ${data.nomor_surat_permohonan}</p>
          <p style="margin: 4px 0;"><strong>tanggal surat</strong> : ${data.tanggal_surat_permohonan}</p>
          <p style="margin: 4px 0;"><strong>hal</strong> : ${data.perihal}</p>
          <p style="margin: 4px 0;"><strong>kode tracking</strong> : ${data.kode_tracking}</p>
          <p style="margin: 4px 0;"><strong>nomor agenda</strong> : </p>
          <p style="margin: 4px 0;"><strong>ID surat</strong> : </p>
        </div>

        <p style="margin: 12px 0;">Telah kami terima pada tanggal <strong>${tanggalDiterima}</strong>, silahkan cek status berkala di beriman.my.id/status</p>

        <p style="margin: 12px 0;">Daftar lampiran:</p>
        <ul style="margin: 12px 0;">${daftarLampiran}</ul>

        <p style="margin: 12px 0;">Terima Kasih.</p>

        <p style="margin-top: 24px; color: #666; font-size: 13px; line-height: 1.5;">
          KPPBC TMP B Balikpapan berkomitmen untuk selalu menjaga integritas dalam pengawasan dan pelayanan yang terbaik kepada seluruh pengguna layanan dan mitra kerja.
        </p>
      </div>
    `,
    attachments,
  });
}

export async function kirimNotifikasiPenolakan(data: Permohonan, catatan: string) {
  return getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.email_perusahaan,
    subject: `Permohonan Perubahan Data Ditolak - ${data.kode_tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>
          Dari. ${data.nama_perusahaan}<br />
          <span style="color:#475569;">${data.email_perusahaan}</span>
        </p>
        <p>
          Mohon maaf, permohonan perubahan data Anda dengan kode tracking
          <strong>${data.kode_tracking}</strong> tidak dapat kami setujui.
        </p>
        <p><strong>Alasan Penolakan:</strong></p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;padding:12px 14px;">
          ${catatan}
        </div>
      </div>
    `,
  });
}
