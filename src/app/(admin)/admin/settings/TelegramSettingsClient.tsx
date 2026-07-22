"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  BellRing,
  BellOff,
} from "lucide-react";
import type { TelegramAdmin } from "@/types/database";

type ToastType = "success" | "error";

interface Toast {
  type: ToastType;
  message: string;
}

export default function TelegramSettingsClient() {
  const [admins, setAdmins] = useState<TelegramAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action states per row
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function showToast(type: ToastType, message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/telegram-admins");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = await res.json();
      setAdmins(json.data ?? []);
    } catch {
      showToast("error", "Gagal memuat daftar admin Telegram");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/telegram-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), chat_id: chatId.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Gagal menambah admin");
        return;
      }
      setAdmins((prev) => [...prev, json.data]);
      setName("");
      setChatId("");
      showToast("success", "Admin Telegram berhasil ditambahkan");
    } catch {
      showToast("error", "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(admin: TelegramAdmin) {
    setTogglingId(admin.id);
    try {
      const res = await fetch(`/api/admin/telegram-admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !admin.is_active }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Gagal mengubah status");
        return;
      }
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? json.data : a))
      );
      showToast(
        "success",
        `Admin ${json.data.is_active ? "diaktifkan" : "dinonaktifkan"}`
      );
    } catch {
      showToast("error", "Terjadi kesalahan. Coba lagi.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleTest(admin: TelegramAdmin) {
    setTestingId(admin.id);
    try {
      const res = await fetch(`/api/admin/telegram-admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Gagal mengirim test notifikasi");
        return;
      }
      showToast("success", "Pesan test berhasil dikirim ke Telegram!");
    } catch {
      showToast("error", "Terjadi kesalahan. Coba lagi.");
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(admin: TelegramAdmin) {
    if (
      !confirm(
        `Hapus "${admin.name}" dari daftar admin Telegram? Tindakan ini tidak dapat dibatalkan.`
      )
    )
      return;

    setDeletingId(admin.id);
    try {
      const res = await fetch(`/api/admin/telegram-admins/${admin.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Gagal menghapus admin");
        return;
      }
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      showToast("success", `"${admin.name}" berhasil dihapus`);
    } catch {
      showToast("error", "Terjadi kesalahan. Coba lagi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Section: Notifikasi Telegram */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
            <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Notifikasi Telegram
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admin berikut akan menerima notifikasi ketika ada permohonan baru masuk.
            </p>
          </div>
        </div>

        {/* Info cara mendapatkan chat_id */}
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Cara mendapatkan Chat ID Telegram:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Start bot <span className="font-mono font-semibold">@userinfobot</span> di Telegram
            </li>
            <li>Chat ID Anda akan langsung ditampilkan</li>
            <li>
              Untuk grup: tambahkan bot ke grup, lalu gunakan{" "}
              <span className="font-mono font-semibold">@getidsbot</span>
            </li>
            <li>
              Pastikan Anda sudah pernah mengirim pesan ke bot notifikasi agar
              bot dapat membalas
            </li>
          </ol>
        </div>

        {/* Tambah Admin Form */}
        <form onSubmit={handleAdd} className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Nama Admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
            />
            <input
              type="text"
              placeholder="Chat ID (contoh: 123456789)"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              required
              maxLength={50}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim() || !chatId.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Tambah
            </button>
          </div>
        </form>

        {/* Daftar Admin */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
            <Send className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Belum ada admin Telegram yang ditambahkan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {admin.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        admin.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {admin.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Chat ID: {admin.chat_id}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggle(admin)}
                    disabled={togglingId === admin.id}
                    title={admin.is_active ? "Nonaktifkan" : "Aktifkan"}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      admin.is_active
                        ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                    }`}
                  >
                    {togglingId === admin.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : admin.is_active ? (
                      <BellOff className="h-3.5 w-3.5" />
                    ) : (
                      <BellRing className="h-3.5 w-3.5" />
                    )}
                    {admin.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>

                  {/* Test */}
                  <button
                    onClick={() => handleTest(admin)}
                    disabled={testingId === admin.id}
                    title="Kirim test notifikasi"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                  >
                    {testingId === admin.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Test
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.id}
                    title="Hapus admin ini"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    {deletingId === admin.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}