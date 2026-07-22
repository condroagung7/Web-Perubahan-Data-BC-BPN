import type { Permohonan } from "@/types/database";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Ambil daftar chat ID aktif dari tabel telegram_admins
 */
async function getActiveChatIds(): Promise<string[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("telegram_admins")
      .select("chat_id")
      .eq("is_active", true);

    if (error) {
      console.error("Gagal mengambil daftar telegram admin:", error);
      return [];
    }

    return (data ?? []).map((row: { chat_id: string }) => row.chat_id);
  } catch (err) {
    console.error("Error saat mengambil telegram admin:", err);
    return [];
  }
}

/**
 * Kirim pesan ke satu chat ID
 */
async function kirimKeChat(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gagal kirim notifikasi ke chat_id ${chatId}:`, errorText);
    }
  } catch (error) {
    console.error(`Error kirim notifikasi ke chat_id ${chatId}:`, error);
  }
}

/**
 * Kirim notifikasi permohonan baru ke semua admin Telegram aktif
 */
export async function kirimNotifikasiTelegram(
  permohonan: Permohonan
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN belum dikonfigurasi di environment");
    return;
  }

  const chatIds = await getActiveChatIds();

  if (chatIds.length === 0) {
    console.warn(
      "Tidak ada admin Telegram aktif. Notifikasi tidak dikirim."
    );
    return;
  }

  const message = formatTelegramMessage(permohonan);

  // Kirim ke semua admin aktif secara paralel
  await Promise.all(
    chatIds.map((chatId) => kirimKeChat(botToken, chatId, message))
  );

  console.log(
    `Notifikasi Telegram berhasil dikirim ke ${chatIds.length} admin`
  );
}

/**
 * Format pesan Telegram dengan HTML
 */
function formatTelegramMessage(permohonan: Permohonan): string {
  const formattedDate = new Date(permohonan.created_at).toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    }
  );

  return `
<b>📋 PERMOHONAN BARU</b>

• <b>Perusahaan:</b> ${permohonan.nama_perusahaan}
• <b>Email:</b> ${permohonan.email_perusahaan}
• <b>Kode Tracking:</b> <code>${permohonan.kode_tracking}</code>
• <b>Jenis Perubahan:</b> ${permohonan.jenis_perubahan_data}
• <b>Alasan:</b> ${permohonan.perihal}
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

🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}admin/dashboard/">Login ke Dashboard</a> untuk proses lebih lanjut.
  `.trim();
}

/**
 * Kirim pesan sederhana ke satu chat ID tertentu (untuk testing)
 */
export async function kirimPesanKeChatId(
  chatId: string,
  pesan: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN belum dikonfigurasi");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

/**
 * Kirim pesan sederhana ke semua admin aktif (untuk testing broadcast)
 */
export async function kirimPesanTelegram(pesan: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("Konfigurasi Telegram tidak lengkap");
    return false;
  }

  const chatIds = await getActiveChatIds();
  if (chatIds.length === 0) return false;

  const results = await Promise.all(
    chatIds.map((chatId) => kirimKeChat(botToken, chatId, pesan).then(() => true).catch(() => false))
  );

  return results.some(Boolean);
}