import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/types/database";

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

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    // Format pesan ke bentuk OpenAI-compatible yang dipakai Groq
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text,
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
    const text = data.choices?.[0]?.message?.content ?? "Maaf, tidak ada respons.";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Gagal mendapatkan respons dari asisten" },
      { status: 500 }
    );
  }
}