import type { Permohonan } from "@/types/database";

/**
 * Kirim notifikasi permohonan baru ke Telegram
 */
export async function kirimNotifikasiTelegram(permohonan: Permohonan): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Validasi environment variables
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN belum dikonfigurasi di environment");
    return;
  }

  if (!chatId) {
    console.error("TELEGRAM_CHAT_ID belum dikonfigurasi di environment");
    return;
  }

  // Format pesan Telegram
  const message = formatTelegramMessage(permohonan);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gagal mengirim notifikasi Telegram:", errorText);
      return;
    }

    console.log("Notifikasi Telegram berhasil dikirim");
  } catch (error) {
    console.error("Error saat mengirim notifikasi Telegram:", error);
  }
}

/**
 * Format pesan Telegram dengan HTML
 */
function formatTelegramMessage(permohonan: Permohonan): string {
  const formattedDate = new Date(permohonan.created_at).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<b>📋 PERMOHONAN BARU</b>

• <b>Perusahaan:</b> ${permohonan.nama_perusahaan}
• <b>Email:</b> ${permohonan.email_perusahaan}
• <b>Kode Tracking:</b> <code>${permohonan.kode_tracking}</code>
• <b>Jenis Perubahan:</b> ${permohonan.jenis_perubahan_data}
• <b>Alasan:</b> ${permohonan.alasan_perubahan}
• <b>Tanggal Pengajuan:</b> ${formattedDate}

${
  permohonan.detail_perubahan && permohonan.detail_perubahan.length > 0
    ? `<b>Detail Perubahan:</b>\n${permohonan.detail_perubahan
        .map(
          (d, i) =>
            `${i + 1}. ${d.data_yang_dirubah}: ${d.data_semula} → ${d.data_seharusnya}`
        )
        .join("\n")}`
    : ""
}

🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Login ke Dashboard</a> untuk proses lebih lanjut.
  `.trim();
}

/**
 * Kirim pesan sederhana ke Telegram (untuk testing)
 */
export async function kirimPesanTelegram(pesan: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Konfigurasi Telegram tidak lengkap");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: pesan,
          parse_mode: "HTML",
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error kirim pesan Telegram:", error);
    return false;
  }
}