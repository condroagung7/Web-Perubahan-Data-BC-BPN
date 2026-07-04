import { Resend } from "resend";
import type { Permohonan } from "@/types/database";

const resend = new Resend(process.env.RESEND_API_KEY);

function tabelDetailHtml(data: Permohonan) {
  const rows = data.detail_perubahan
    .map(
      (d) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;">${d.data_yang_dirubah}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;">${d.data_semula}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;">${d.data_seharusnya}</td>
        </tr>`
    )
    .join("");

  return `
    <table style="border-collapse:collapse;width:100%;margin-top:8px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left;">Data yang Dirubah</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left;">Data Semula</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left;">Data Seharusnya</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export async function kirimNotifikasiPermohonanBaru(data: Permohonan) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TUJUAN_INSTANSI!,
    subject: `Permohonan Perubahan Data Baru - ${data.nama_perusahaan} (${data.kode_tracking})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Permohonan Perubahan Data Baru</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0;"><strong>Kode Tracking</strong></td><td>${data.kode_tracking}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Nama Perusahaan</strong></td><td>${data.nama_perusahaan}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Kota</strong></td><td>${data.kota}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Nomor Surat Permohonan</strong></td><td>${data.nomor_surat_permohonan}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Tanggal Surat</strong></td><td>${data.tanggal_surat_permohonan}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Perihal</strong></td><td>${data.perihal}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Jenis Perubahan Data</strong></td><td>${data.jenis_perubahan_data}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Pihak Pengaju</strong></td><td>${data.pihak_pengaju}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Nomor Aju Manifes</strong></td><td>${data.nomor_aju_manifes}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Nomor Pendaftaran BC 1.1</strong></td><td>${data.nomor_pendaftaran_bc11}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Alasan Perubahan</strong></td><td>${data.alasan_perubahan}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Penandatangan</strong></td><td>${data.nama_penandatangan} (${data.jabatan_penandatangan})</td></tr>
        </table>
        <p style="margin-top:16px;"><strong>Detail Perubahan Data:</strong></p>
        ${tabelDetailHtml(data)}
        <p style="margin-top: 16px; color: #666; font-size: 13px;">
          Silakan login ke dashboard admin untuk meninjau dan memproses permohonan ini.
        </p>
      </div>
    `,
  });
}

export async function kirimSuratPersetujuan(data: Permohonan, docxBuffer: Buffer) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.email_perusahaan,
    subject: `Surat Persetujuan Perubahan Data - ${data.kode_tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Yth. ${data.nama_perusahaan},</p>
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

export async function kirimNotifikasiPenolakan(data: Permohonan, catatan: string) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.email_perusahaan,
    subject: `Permohonan Perubahan Data Ditolak - ${data.kode_tracking}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Yth. ${data.nama_perusahaan},</p>
        <p>
          Mohon maaf, permohonan perubahan data Anda dengan kode tracking
          <strong>${data.kode_tracking}</strong> <strong>belum dapat kami setujui</strong>.
        </p>
        <p><strong>Catatan:</strong> ${catatan}</p>
        <p>Silakan ajukan kembali dengan melengkapi data yang diperlukan.</p>
      </div>
    `,
  });
}