import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { Permohonan } from "@/types/database";

const FONT = "Arial";
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const CONTENT_WIDTH = 9360;
const BODY_INDENT = 360;
const TABLE_WIDTH = 8060;
const BODY_SIZE = 22;
const SMALL_SIZE = 16;
const LINE_15 = 360;

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const gridBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function run(text: string, opts: { bold?: boolean; size?: number } = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? BODY_SIZE,
    bold: opts.bold,
  });
}

function para(
  children: TextRun[],
  opts: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    line?: number;
    indent?: { left?: number; hanging?: number; firstLine?: number };
  } = {}
) {
  return new Paragraph({
    alignment: opts.alignment,
    indent: opts.indent,
    spacing: {
      before: opts.before ?? 0,
      after: opts.after ?? 0,
      line: opts.line,
      lineRule: opts.line ? LineRuleType.AUTO : undefined,
    },
    children,
  });
}

function empty(after = 0) {
  return para([run("")], { after });
}

function formatTanggal(dateValue?: string | Date | null) {
  if (!dateValue || dateValue === "-") return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function borderlessCell(children: Paragraph[], width: number) {
  return new TableCell({
    borders: noBorder,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 60 },
    verticalAlign: VerticalAlign.TOP,
    children,
  });
}

function metaRow(label: string, value: string) {
  return new TableRow({
    children: [
      borderlessCell([para([run(label)])], 980),
      borderlessCell([para([run(":")])], 220),
      borderlessCell([para([run(value)])], CONTENT_WIDTH - 1200),
    ],
  });
}

function gridCell(
  text: string,
  width: number,
  opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}
) {
  return new TableCell({
    borders: gridBorders,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: [
      para([run(text, { bold: opts.bold })], {
        alignment: opts.align,
        line: LINE_15,
      }),
    ],
  });
}

function dataCell(text: string, width: number) {
  return new TableCell({
    borders: noBorder,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 0, bottom: 0, left: 0, right: 80 },
    children: [para([run(text)], { line: LINE_15 })],
  });
}

function numbered(text: string, number: number) {
  return para([run(`${number}.\t${text}`)], {
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 360, hanging: 360 },
    line: LINE_15,
    after: 200,
  });
}

function bodyIndented(text: string, opts: { after?: number } = {}) {
  return para([run(text)], {
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 720 },
    line: LINE_15,
    after: opts.after ?? 160,
  });
}

function notaDinas(data: Permohonan, tanggalSurat: string) {
  const tanggalND = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    ...kopSurat(),

    // Judul NOTA DINAS
    para([run("NOTA DINAS")], {
      alignment: AlignmentType.CENTER,
      after: 20,
      before: 100,
    }),
    para([run(`NOMOR ND-            /KBC.160103/${new Date().getFullYear()}`)], {
      alignment: AlignmentType.CENTER,
      after: 300,
    }),

    // Tabel header Nota Dinas
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: noBorder,
      rows: [
        metaRow("Kepada", "Yth. Kepala Kantor"),
        metaRow("Dari", "Kepala Seksi Perbendaharaan"),
        metaRow("Sifat", "Biasa"),
        metaRow("Lampiran", "Satu berkas"),
        metaRow(
          "Hal",
          `Tindak Lanjut Permohonan Perbaikan Data BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11}`
        ),
        metaRow("Tanggal", tanggalND),
      ],
    }),

    empty(200),

    // Isi surat
    bodyIndented(
      `Sehubungan dengan surat dari ${data.nama_perusahaan} Nomor ${data.nomor_surat_permohonan} tanggal ${tanggalSurat} perihal ${data.perihal} yang berkasnya diterima lengkap pada tanggal ${tanggalSurat}, dengan hormat kami sampaikan hal-hal sebagai berikut:`,
      { after: 200 }
    ),

    bodyIndented(
      `PT. ${data.nama_perusahaan} mengajukan perubahan data pada BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11}, yaitu:`,
      { after: 200 }
    ),

    // Tabel perubahan data
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      indent: { size: BODY_INDENT, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            gridCell("Data BC 1.1 Inward", 2700, {
              bold: true,
              align: AlignmentType.CENTER,
            }),
            gridCell("Semula", 2680, { bold: true, align: AlignmentType.CENTER }),
            gridCell("Menjadi", 2680, { bold: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...data.detail_perubahan.map(
          (item) =>
            new TableRow({
              children: [
                gridCell(item.data_yang_dirubah, 2700),
                gridCell(item.data_semula, 2680),
                gridCell(item.data_seharusnya, 2680),
              ],
            })
        ),
      ],
    }),

    empty(200),

    para([run("a. Sesuai hasil penelitian di dokumen pendukung yang dilampirkan berupa …………………")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: BODY_INDENT },
      line: LINE_15,
      after: 160,
    }),

    para([run("b. Sesuai hasil penelitian Ceisa 4.0 diketahui bahwa…………………")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: BODY_INDENT },
      line: LINE_15,
      after: 220,
    }),

    numbered(
      "Dasar Hukum Perubahan Data RKSP, Inward Manifes dan Outward Manifes:",
      2
    ),

    // PMK
    para([run("• Peraturan Menteri Keuangan RI nomor 158/PMK.04/2017 sebagaimana telah diubah dengan Peraturan Menteri Keuangan Nomor 90/PMK.01/2020:")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 720, hanging: 360 },
      line: LINE_15,
      after: 120,
    }),

    para([run("- Pasal 19 ayat (1) menyebutkan \"Pengangkut sebagaimana dimaksud dalam Pasal 2 ayat (2) dapat melakukan perbaikan data pada RKSP, Inward Manifest atau Outward Manifest sesuai dengan dokumen pengangkutan yang diterbitkannya ke Kantor Pabean tempat pendaftaran\".")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 1080, hanging: 360 },
      line: LINE_15,
      after: 120,
    }),

    para([run("- Pasal 19 ayat (2) menyebutkan \"Perbaikan data RKSP, Inward Manifest, dan Outward Manifest sebagaimana dimaksud pada ayat (1) dengan rincian: a. pemberitahuan pabean pengangkutan; b. Pengangkut; c. jenis perbaikan data; d. waktu pengajuan perbaikan; e. batas waktu perbaikan; f. bentuk persetujuan; dan g. keterangan lainnya, dapat dilakukan sesuai dengan ketentuan dalam lampiran yang merupakan bagian tidak terpisahkan dari Peraturan Menteri ini.\"")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 1080, hanging: 360 },
      line: LINE_15,
      after: 160,
    }),

    // PER-38/BC/2017
    para([run("• Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-38/BC/2017 sebagaimana telah diubah terakhir dengan Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-11/BC/2020:")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 720, hanging: 360 },
      line: LINE_15,
      after: 120,
    }),

    para([run("- Pasal 19 ayat (1) menyebutkan \"Pengangkut sebagaimana pasal 2 ayat (2) dapat melakukan perbaikan data pada RKSP, Inward Manifest atau Outward Manifest sesuai dengan dokumen pengangkutan yang diterbitkannya ke Kantor Pabean Tempat Pendaftaran\".")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 1080, hanging: 360 },
      line: LINE_15,
      after: 120,
    }),

    para([run("- Pasal 19 ayat (2) menyebutkan \"Perbaikan data RKSP, Inward Manifest dan Outward Manifest sebagaimana di maksud pada ayat (1) dapat dilakukan sesuai dengan peraturan perundang-undangan mengenai manifes\".")], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 1080, hanging: 360 },
      line: LINE_15,
      after: 220,
    }),

    bodyIndented(
      `Berdasarkan hal tersebut di atas, kami berpendapat permohonan perubahan data pada ${data.jenis_perubahan_data} manifes yang diajukan oleh ${data.nama_perusahaan} dapat dipertimbangkan untuk disetujui.`,
      { after: 220 }
    ),

    bodyIndented(
      `Demikian disampaikan untuk mendapat keputusan, dan apabila Bapak tidak berpendapat lain, bersama ini dilampirkan konsep surat persetujuan perubahan dimaksud.`,
      { after: 300 }
    ),
  ];
}

function kopSurat() {
  return [
    para([run("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA")], {
      alignment: AlignmentType.CENTER,
      after: 20,
    }),
    para([run("DIREKTORAT JENDERAL BEA DAN CUKAI", { bold: true })], {
      alignment: AlignmentType.CENTER,
      after: 20,
    }),
    para([run("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI KALIMANTAN BAGIAN TIMUR")], {
      alignment: AlignmentType.CENTER,
      after: 20,
    }),
    para(
      [run("KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN B BALIKPAPAN", { bold: true })],
      {
        alignment: AlignmentType.CENTER,
        after: 40,
      }
    ),
    para(
      [
        run(
          "Jalan Yos Sudarso Nomor 9, Balikpapan 76111 Telepon (0542) 423422, 421393; Faksimile (0542) 423951, 731212; Laman www.beacukai.go.id Pusat Kontak Layanan 1500225; Surel bcbalikpapan@kemenkeu.go.id",
          { size: SMALL_SIZE }
        ),
      ],
      {
        alignment: AlignmentType.CENTER,
        after: 60,
      }
    ),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" } },
      spacing: { after: 180 },
      children: [run("")],
    }),
  ];
}

export async function generateSuratPersetujuan(data: Permohonan): Promise<Buffer> {
  const tanggalSurat = formatTanggal(data.tanggal_surat_permohonan);
  const tanggalBlAwb = formatTanggal(data.tanggal_bl_awb);
  const tanggalKeluar = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isPosBarang = data.alasan_perubahan === "Pos/Barang";

  const detailRows = data.detail_perubahan.map(
    (item) =>
      new TableRow({
        children: [
          gridCell(item.data_yang_dirubah, 2700),
          gridCell(item.data_semula, 2680),
          gridCell(item.data_seharusnya, 2680),
        ],
      })
  );

  const sectionOneChildren = [
    ...kopSurat(),

    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: noBorder,
      rows: [
        metaRow("Nomor", `${data.kode_tracking}/SP/${new Date().getFullYear()}`),
        metaRow("Sifat", "Segera"),
        metaRow("Lampiran", "Satu berkas"),
        metaRow(
          "Hal",
          `Persetujuan Perubahan Data BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11} tanggal ${formatTanggal(data.tanggal_surat_permohonan)}`
        ),
      ],
    }),

    empty(160),
    para([run("Yth.")]),
    para([run(data.nama_perusahaan)]),
    para([run(data.alamat_perusahaan)], { after: 300 }),

    bodyIndented(
      `Sehubungan dengan surat ${data.nama_perusahaan} nomor ${data.nomor_surat_permohonan} tanggal ${tanggalSurat} perihal ${data.perihal} yang berkasnya diterima lengkap pada tanggal ${tanggalSurat}, kami sampaikan hal-hal sebagai berikut:`,
    ),
    numbered(
      `Melalui surat tersebut di atas, ${data.nama_perusahaan} selaku ${data.pihak_pengaju} mengajukan permohonan perubahan data BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11}, yaitu:`,
      1
    ),

    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      indent: { size: BODY_INDENT, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            gridCell(`Data BC 1.1 ${data.jenis_perubahan_data}`, 2700, {
              bold: true,
              align: AlignmentType.CENTER,
            }),
            gridCell("Semula", 2680, { bold: true, align: AlignmentType.CENTER }),
            gridCell("Menjadi", 2680, { bold: true, align: AlignmentType.CENTER }),
          ],
        }),
        ...detailRows,
      ],
    }),

    ...(isPosBarang
      ? [
          para([run(`Data-data pada Aplikasi Manifes ${data.jenis_perubahan_data} sebelum perubahan yaitu:`)], {
            before: 220,
            after: 200,
            indent: { left: BODY_INDENT },
          }),
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            indent: { size: BODY_INDENT, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  dataCell("BC 1.1 nomor", 2800),
                  dataCell(":", 220),
                  dataCell(
                    `${data.nomor_pendaftaran_bc11} tanggal ${tanggalSurat} Pos ${data.nomor_pos}`,
                    TABLE_WIDTH - 3020
                  ),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Nama Sarana Pengangkut", 2800),
                  dataCell(":", 220),
                  dataCell(data.nama_sarana_pengangkut, TABLE_WIDTH - 3020),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Nomor B/L / AWB / Tanggal", 2800),
                  dataCell(":", 220),
                  dataCell(`${data.nomor_bl_awb} / ${tanggalBlAwb}`, TABLE_WIDTH - 3020),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Jml. Kemasan/Berat Kotor", 2800),
                  dataCell(":", 220),
                  dataCell(`${data.jumlah_kemasan} / ${data.berat_kotor}`, TABLE_WIDTH - 3020),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Uraian barang", 2800),
                  dataCell(":", 220),
                  dataCell(data.uraian_barang, TABLE_WIDTH - 3020),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Shipper", 2800),
                  dataCell(":", 220),
                  dataCell(data.nama_shipper, TABLE_WIDTH - 3020),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Consignee", 2800),
                  dataCell(":", 220),
                  dataCell(data.nama_consignee, TABLE_WIDTH - 3020),
                ],
              }),
            ],
          }),
          empty(200),
        ]
      : [empty(200)]),

    numbered(
      `Berdasarkan penelitian dokumen serta memperhatikan ketentuan pada Peraturan Menteri Keuangan Nomor 158/PMK.04/2017 sebagaimana telah diubah dengan Peraturan Menteri Keuangan Nomor 90/PMK.01/2020 dan Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-38/BC/2017 sebagaimana telah diubah terakhir dengan Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-11/BC/2020, maka permohonan ${data.nama_perusahaan} tentang perubahan data BC 1.1 ${data.jenis_perubahan_data} dapat disetujui dengan perubahan data sebagaimana tercantum pada butir 1 di atas.`,
      2
    ),
    bodyIndented(
      "KPPBC TMP B Balikpapan berkomitmen untuk selalu menjaga integritas dalam memberikan pengawasan dan pelayanan yang terbaik kepada seluruh pengguna layanan dan mitra kerja.",
      { after: 220 }
    ),
    bodyIndented("Demikian disampaikan untuk dipergunakan sebagaimana mestinya.", {
      after: 260,
    }),
    para([run(`Balikpapan, ${tanggalKeluar}`)], {
      alignment: AlignmentType.RIGHT,
      before: 0,
    }),
    para([run("Kepala Kantor,")], {
      alignment: AlignmentType.RIGHT,
      before: 80,
      after: 900,
    }),
    para([run("(_______________________)")], {
      alignment: AlignmentType.RIGHT,
    }),
    para([run("NIP. ____________________")], {
      alignment: AlignmentType.RIGHT,
    }),
  ];

  const sectionTwoChildren = notaDinas(data, tanggalSurat);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
          paragraph: { spacing: { after: 0 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: {
              top: 1080,
              right: 1440,
              bottom: 1080,
              left: 1440,
              header: 708,
              footer: 708,
            },
          },
        },
        children: sectionOneChildren,
      },
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: {
              top: 1080,
              right: 1440,
              bottom: 1080,
              left: 1440,
              header: 708,
              footer: 708,
            },
          },
        },
        children: sectionTwoChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}