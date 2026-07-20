import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Clock3,
  Eye,
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ChatOpenButton from "@/components/chat/ChatOpenButton";

const HERO_IMAGE = "/images/landing-option-7-hero.png";

const NAV = [
  { label: "Beranda", href: "#beranda" },
  { label: "Ajukan Permohonan", href: "/permohonan" },
  { label: "Cek Status", href: "/status" },
  { label: "Panduan", href: "#panduan" },
];

const ACTIONS = [
  {
    title: "Ajukan Permohonan",
    desc: "Ajukan perubahan data manifes dengan mudah dan cepat.",
    href: "/permohonan",
    icon: UploadCloud,
    cta: "Ajukan Sekarang",
  },
  {
    title: "Cek Status Permohonan",
    desc: "Pantau status permohonan Anda secara real-time.",
    href: "/status",
    icon: Search,
    cta: "Cek Status",
  },
  {
    title: "Bantuan AI",
    desc: "Dapatkan panduan dan jawaban instan dari asisten AI BERIMAN.",
    href: "",
    icon: Bot,
    cta: "Tanya AI",
    chat: true,
  },
];

const FEATURES = [
  { label: "Terintegrasi", desc: "Ekosistem Yang Saling Terhubung", icon: Ship },
  { label: "Aman", desc: "Kerahasiaan Data Terjaga", icon: Lock },
  { label: "Cepat", desc: "Efektif dan Efisien", icon: Clock3 },
  { label: "Terlacak", desc: "Monitor real-time", icon: Eye },
];

const STEPS = [
  "Siapkan surat permohonan dan dokumen pendukung.",
  "Isi formulir perubahan data BC 1.1.",
  "Petugas meninjau kelengkapan dokumen.",
  "Surat persetujuan akan dikirim via email.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#071525] text-white">
      <section id="beranda" className="relative min-h-screen overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#071525]/96 via-[#071525]/54 to-[#071525]/20" />
        <div className="absolute inset-0 bg-linear-to-t from-[#071525] via-transparent to-[#071525]/35" />

        <header className="relative z-10 mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#E8A83C] ring-1 ring-white/15 backdrop-blur">
              <Ship size={20} />
            </div>
            <div>
              <p className="text-xl font-black leading-none tracking-[0.16em]">BERIMAN</p>
              <p className="mt-1 text-[11px] font-medium text-blue-100">
                Benar, Rapi dan Aman
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-xs font-semibold text-blue-100 lg:flex">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-[#E8A83C]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              <LogIn size={14} />
              Login Admin
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 pb-10 pt-10 lg:grid-cols-[1fr_400px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8A83C]/35 bg-[#E8A83C]/10 px-3 py-1 text-xs font-bold text-[#F6C96D] backdrop-blur">
              <Sparkles size={13} />
              Layanan digital perubahan data manifes
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Portal Perubahan Data Manifes  
              <span className="block">Bea Cukai Balikpapan.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-[15px]">
              Digital, terintegrasi, dan didukung AI untuk proses yang lebih cepat
              dan akurat.
            </p>

            <Link
              href="#panduan"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-100 transition hover:text-[#E8A83C]"
            >
              
            </Link>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/permohonan"
                className="inline-flex items-center gap-2 rounded-md bg-[#E8A83C] px-4 py-2.5 text-sm font-black text-[#0B2545] transition hover:bg-[#f3ba5c]"
              >
                Ajukan Permohonan
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/status"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                Cek Status Permohonan
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className="group block rounded-xl border border-white/18 bg-[#0B2545]/55 p-4 shadow-2xl backdrop-blur-md transition hover:-translate-y-1 hover:border-[#E8A83C]/60 hover:bg-[#0B2545]/70"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-400/15 text-[#E8A83C] ring-1 ring-white/10">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-black">{action.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-blue-100">{action.desc}</p>
                      {action.chat ? (
                        <ChatOpenButton label={action.cta} />
                      ) : (
                        <Link
                          href={action.href}
                          className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs font-black text-white transition group-hover:border-[#E8A83C] group-hover:text-[#E8A83C]"
                        >
                          {action.cta}
                          <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/32 p-3 backdrop-blur-md md:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex gap-3 rounded-xl px-3 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#E8A83C]">
                    <Icon size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">{feature.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-blue-100">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="panduan" className="bg-[#071525] px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#E8A83C]">
              Alur Pengajuan
            </p>
            <h2 className="mt-3 text-3xl font-black">Dari dokumen sampai surat terbit.</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Ikuti langkah pengajuan secara digital dan pantau status permohonan
              kapan saja.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <div key={step} className="rounded-xl border border-white/10 bg-white/6 p-5">
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-[#E8A83C] text-sm font-black text-[#0B2545]">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold leading-6 text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="bantuan" className="border-y border-white/10 bg-[#0B2545] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#E8A83C] text-[#0B2545]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Siap mengurus perubahan data manifes?</h2>
              <p className="mt-1 text-sm text-blue-100">
                Mulai permohonan baru atau cek status permohonan yang sudah diajukan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/permohonan"
              className="inline-flex items-center gap-2 rounded-md bg-[#E8A83C] px-5 py-3 text-sm font-black text-[#0B2545] transition hover:bg-[#f3ba5c]"
            >
              Ajukan Permohonan
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/status"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Search size={16} />
              Cek Status
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#071525] px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs font-semibold text-blue-100 sm:flex-row sm:items-center sm:justify-between">
          <p>BERIMAN - Sistem Perubahan Data Manifes </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/permohonan" className="hover:text-[#E8A83C]">Ajukan Permohonan</Link>
            <Link href="/status" className="hover:text-[#E8A83C]">Cek Status</Link>
            <Link href="/admin/login" className="hover:text-[#E8A83C]">Login Admin</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
