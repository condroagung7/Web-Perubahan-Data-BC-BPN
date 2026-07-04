import Link from "next/link";
import {
  FileEdit,
  Search,
  ShieldCheck,
  UserCheck,
  Building2,
  Bot,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const PERAN = [
  { label: "Pemohon", icon: UserCheck },
  { label: "Verifikator", icon: ShieldCheck },
  { label: "Admin", icon: Building2 },
  { label: "Asisten AI", icon: Bot },
];

const MENU_STRIP = ["Ajukan Permohonan", "Cek Status", "Riwayat Perubahan", "Bantuan"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <header className="bg-[#0B2545] text-white">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-[#E8A83C]">
              <FileEdit size={18} className="text-[#0B2545]" />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-sm tracking-wide">
                Siap Landing
              </p>
              <p className="text-[11px] text-white/60 -mt-0.5">Gawi Tuntas</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-white/85">
            <a href="#beranda" className="hover:text-white transition">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-white transition">
              Layanan
            </a>
            <a href="#peran" className="hover:text-white transition">
              Peran
            </a>
            <Link href="/status" className="hover:text-white transition">
              Lacak Permohonan
            </Link>
          </nav>

          <Link
            href="/permohonan"
            className="rounded-md bg-[#E8A83C] text-[#0B2545] text-sm font-semibold px-4 py-2 hover:bg-[#f3ba5c] transition whitespace-nowrap"
          >
            Ajukan Sekarang
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        id="beranda"
        className="bg-gradient-to-b from-[#EAF4FC] to-white px-6 pt-16 pb-20"
      >
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2545] bg-[#E8A83C]/20 px-3 py-1 rounded-full">
              Layanan Digital Resmi
            </p>
            <h1 className="font-display font-extrabold text-[#0B2545] text-4xl sm:text-5xl leading-tight mt-4">
              Ajukan Perubahan
              <br />
              Data Anda, <span className="text-[#E8A83C]">dimana saja</span>
            </h1>
            <p className="text-slate-600 mt-4 text-base max-w-md">
              Dari data yang salah menjadi data yang seharusnya — diajukan,
              diverifikasi, dan disetujui secara digital dengan kode tracking
              yang bisa dipantau kapan saja.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/permohonan"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B2545] text-white px-6 py-3 font-semibold text-sm hover:bg-[#123564] transition"
              >
                Ajukan Permohonan <ArrowRight size={16} />
              </Link>
              <Link
                href="/status"
                className="inline-flex items-center gap-2 rounded-lg border border-[#0B2545]/20 text-[#0B2545] px-6 py-3 font-semibold text-sm hover:bg-[#0B2545]/5 transition"
              >
                <Search size={16} /> Cek Status
              </Link>
            </div>
          </div>

          {/* Signature illustration: document transforming into approval letter */}
          <div className="relative flex justify-center">
            <svg
              viewBox="0 0 420 340"
              className="w-full max-w-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="210" cy="300" rx="150" ry="18" fill="#0B2545" opacity="0.06" />

              {/* Data lama - kartu miring, memudar */}
              <g transform="translate(30,70) rotate(-8)">
                <rect width="150" height="190" rx="14" fill="#CBD5E1" opacity="0.5" />
                <rect x="18" y="26" width="90" height="10" rx="5" fill="#94A3B8" />
                <rect x="18" y="50" width="114" height="8" rx="4" fill="#CBD5E1" />
                <rect x="18" y="66" width="114" height="8" rx="4" fill="#CBD5E1" />
                <rect x="18" y="82" width="70" height="8" rx="4" fill="#CBD5E1" />
              </g>

              {/* Arrow */}
              <path
                d="M170 160 L220 160"
                stroke="#E8A83C"
                strokeWidth="4"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="6"
                  refY="5"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 Z" fill="#E8A83C" />
                </marker>
              </defs>

              {/* Surat persetujuan - kartu utama */}
              <g transform="translate(230,40)">
                <rect width="165" height="220" rx="16" fill="#0B2545" />
                <rect x="20" y="28" width="100" height="12" rx="6" fill="#E8A83C" />
                <rect x="20" y="56" width="125" height="8" rx="4" fill="#ffffff" opacity="0.3" />
                <rect x="20" y="72" width="125" height="8" rx="4" fill="#ffffff" opacity="0.3" />
                <rect x="20" y="88" width="90" height="8" rx="4" fill="#ffffff" opacity="0.3" />
                <circle cx="82" cy="160" r="34" fill="#E8A83C" />
              </g>

              {/* Check icon di atas lingkaran gold */}
              <g transform="translate(285,177)">
                <path
                  d="M0 8 L8 16 L24 -4"
                  stroke="#0B2545"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* PERAN / ROLE BADGES */}
      <section id="peran" className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display font-bold text-[#0B2545] text-2xl text-center">
            Empat Peran, Satu Alur yang Jelas
          </h2>
          <p className="text-slate-500 text-sm text-center mt-2 max-w-lg mx-auto">
            Setiap permohonan melewati tahapan yang sama, dari pengajuan hingga
            surat persetujuan terbit.
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {PERAN.map(({ label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-[#0B2545] grid place-items-center ring-4 ring-[#E8A83C]/30">
                  <Icon size={30} className="text-[#E8A83C]" />
                </div>
                <span className="font-semibold text-sm text-[#0B2545]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      <section id="layanan" className="px-6 py-16 bg-[#F7FAFD]">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-3 gap-6">
          <FiturCard
            icon={ShieldCheck}
            title="Aman & Tercatat"
            desc="Setiap permohonan tersimpan dengan kode tracking unik dan riwayat status lengkap."
          />
          <FiturCard
            icon={FileEdit}
            title="Proses Cepat"
            desc="Surat persetujuan diterbitkan otomatis begitu admin menyetujui permohonan."
          />
          <FiturCard
            icon={CheckCircle2}
            title="Transparan"
            desc="Pantau status permohonan kapan saja hanya dengan kode tracking Anda."
          />
        </div>
      </section>

      {/* BOTTOM MENU STRIP */}
      <section className="px-6 py-6 bg-[#0B2545]">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-white/90">
          {MENU_STRIP.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {item}
              {i < MENU_STRIP.length - 1 && (
                <span className="text-[#E8A83C]">|</span>
              )}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

function FiturCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="h-10 w-10 rounded-lg bg-[#0B2545] grid place-items-center mb-4">
        <Icon size={18} className="text-[#E8A83C]" />
      </div>
      <h3 className="font-display font-bold text-[#0B2545]">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5">{desc}</p>
    </div>
  );
}