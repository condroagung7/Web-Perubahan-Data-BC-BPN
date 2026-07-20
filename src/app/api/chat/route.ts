import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/types/database";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_CHAT } from "@/lib/security/rate-limit";
import { sanitizeString } from "@/lib/security/sanitize";

const SYSTEM_PROMPT = `
Kamu adalah asisten virtual untuk layanan "Permohonan Perubahan Data" di Kantor Bea Cukai Balikpapan.
Tugasmu membantu pengguna memahami:
- Cara mengajukan permohonan perubahan data (nama consignee, alamat consignee, NPWP)
- Dokumen pendukung apa saja yang sebaiknya disiapkan
- Cara mengecek status permohonan menggunakan kode tracking
- Estimasi proses (permohonan diproses oleh admin, lalu disetujui/ditolak)
- untuk perubahan NPWP membutuhkan waktu 1 hari
- untuk perubahan consignee membutuhkan waktu 3 hari

Jawab singkat, jelas, sopan, dan dalam Bahasa Indonesia. Jika ditanya hal di luar topik ini,
arahkan kembali pengguna untuk menghubungi kantor terkait secara langsung.
`.trim();

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

export const POST = secureHandler(
  async (request: NextRequest) => {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    // Limit number of messages to prevent abuse
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: "Terlalu banyak pesan dalam satu sesi" },
        { status: 400 }
      );
    }

    // Validate and sanitize each message
    for (const msg of messages) {
      if (!msg.role || !msg.text || typeof msg.text !== "string") {
        return NextResponse.json(
          { error: "Format pesan tidak valid" },
          { status: 400 }
        );
      }
      if (!["user", "model"].includes(msg.role)) {
        return NextResponse.json(
          { error: "Role pesan tidak valid" },
          { status: 400 }
        );
      }
      if (msg.text.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: "Pesan terlalu panjang" },
          { status: 400 }
        );
      }
    }

    // Sanitize message content
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === "model" ? ("assistant" as const) : ("user" as const),
        content: sanitizeString(m.text).substring(0, MAX_MESSAGE_LENGTH),
      })),
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Groq API error:", res.status, errorBody);
      return NextResponse.json(
        { error: "Gagal mendapatkan respons dari asisten" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const text =
      data.choices?.[0]?.message?.content ?? "Maaf, tidak ada respons.";

    return NextResponse.json({ reply: text });
  },
  {
    rateLimit: RATE_LIMIT_CHAT,
    csrf: true,
    maxBodySize: 256_000, // 256KB max for chat
  }
);