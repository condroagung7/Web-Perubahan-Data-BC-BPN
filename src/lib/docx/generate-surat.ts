import { readFileSync } from "fs";
import { join } from "path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  ImageRun,
  LevelFormat,
  LevelSuffix,
  LineRuleType,
  PageNumber,
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
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const CONTENT_WIDTH = 9354;
const BODY_FONT_SIZE = 22;
const LINE_SPACING_15 = 360;

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

function text(textValue: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}) {
  return new TextRun({
    text: textValue,
    font: FONT,
    size: opts.size ?? BODY_FONT_SIZE,
    bold: opts.bold,
    italics: opts.italic,
  });
}

function p(
  children: TextRun[],
  opts: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    indent?: { left?: number; firstLine?: number; hanging?: number };
    line?: number;
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

function emptyParagraph(after = 0) {
  return new Paragraph({ spacing: { after }, children: [text("")] });
}

function borderlessCell(children: Paragraph[], width: number, opts: { columnSpan?: number } = {}) {
  return new TableCell({
    borders: noBorder,
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.columnSpan,
    margins: { top: 20, bottom: 20, left: 0, right: 0 },
    verticalAlign: VerticalAlign.TOP,
    children,
  });
}

function metaCell(textValue: string, width: number, opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; columnSpan?: number } = {}) {
  return borderlessCell(
    [p([text(textValue)], { alignment: opts.align })],
    width,
    { columnSpan: opts.columnSpan }
  );
}

function gridCell(textValue: string, width: number, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    borders: gridBorders,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      p([text(textValue, { bold: opts.bold })], {
        alignment: opts.align,
        line: LINE_SPACING_15,
      }),
    ],
  });
}

function multiLineCell(lines: string[], width: number, opts: { bold?: boolean } = {}) {
  return new TableCell({
    borders: gridBorders,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: lines.map((line) => p([text(line, { bold: opts.bold })], { line: LINE_SPACING_15 })),
  });
}

function numberedParagraph(textValue: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: "surat-numbering", level: 0 },
    spacing: { before: 0, after: 0, line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
    children: [text(textValue)],
  });
}

function formatTanggal(dateValue: string | Date) {
  const date = new Date(dateValue);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function createKopHeader() {
  const logoPath = join(process.cwd(), "public", "images", "logo-kemenkeu.png");
  const logo = readFileSync(logoPath);

  return new Header({
    children: [
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        borders: noBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorder,
                width: { size: 1200, type: WidthType.DXA },
                margins: { top: 0, bottom: 0, left: 0, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: "png",
                        data: logo,
                        transformation: { width: 68, height: 58 },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: noBorder,
                width: { size: CONTENT_WIDTH - 1200, type: WidthType.DXA },
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  p([text("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", { size: 20 })], {
                    alignment: AlignmentType.CENTER,
                  }),
                  p([text("DIREKTORAT JENDERAL BEA DAN CUKAI", { bold: true, size: 24 })], {
                    alignment: AlignmentType.CENTER,
                  }),
                  p([text("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI KALIMANTAN BAGIAN TIMUR", { size: 17 })], {
                    alignment: AlignmentType.CENTER,
                  }),
                  p([text("KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN B BALIKPAPAN", { bold: true, size: 18 })], {
                    alignment: AlignmentType.CENTER,
                  }),
                  p([
                    text(
                      "JALAN YOS SUDARSO NOMOR 9, BALIKPAPAN 76111; TELEPON (0542) 423422, 421393; FAKSIMILE (0542) 423951, 731212; LAMAN www.beacukai.go.id",
                      { size: 13 }
                    ),
                  ], { alignment: AlignmentType.CENTER }),
                  p([text("PUSAT KONTAK LAYANAN 1500225; SUREL bcbalikpapan@kemenkeu.go.id", { size: 13 })], {
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: "000000" } },
        spacing: { before: 20, after: 20 },
        children: [text("")],
      }),
    ],
  });
}

function createContinuationHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: BODY_FONT_SIZE,
          }),
        ],
      }),
    ],
  });
}

export async function generateSuratPersetujuan(data: Permohonan): Promise<Buffer> {
  const tanggalSurat = formatTanggal(data.tanggal_surat_permohonan);
  const isPerubahanPosBarang = data.alasan_perubahan === "Pos/Barang";
  const tanggalBlAwb = data.tanggal_bl_awb ? formatTanggal(data.tanggal_bl_awb) : "-";
  const tanggalSuratKeluar = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const detailRows = data.detail_perubahan.map(
    (d) =>
      new TableRow({
        children: [
          gridCell(d.data_yang_dirubah, 3000),
          gridCell(d.data_semula, 3177),
          gridCell(d.data_seharusnya, 3177),
        ],
      })
  );

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "surat-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              suffix: LevelSuffix.TAB,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_FONT_SIZE },
          paragraph: { spacing: { after: 0 } },
        },
      },
    },
    sections: [
      {
        headers: {
          default: createContinuationHeader(),
          first: createKopHeader(),
        },
        properties: {
          titlePage: true,
          page: {
            size: { width: A4_WIDTH, height: A4_HEIGHT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418, header: 720, footer: 720 },
          },
        },
        children: [
          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  metaCell("Nomor", 1337),
                  metaCell(":", 229),
                  metaCell(`${data.kode_tracking}/SP/${new Date().getFullYear()}`, 4356),
                  metaCell(`Balikpapan, ${tanggalSuratKeluar}`, 3432, { align: AlignmentType.RIGHT }),
                ],
              }),
              new TableRow({
                children: [
                  metaCell("Sifat", 1337),
                  metaCell(":", 229),
                  metaCell("Biasa", 4356),
                  metaCell("", 3432),
                ],
              }),
              new TableRow({
                children: [
                  metaCell("Lampiran", 1337),
                  metaCell(":", 229),
                  metaCell("-", 4356),
                  metaCell("", 3432),
                ],
              }),
              new TableRow({
                children: [
                  metaCell("Hal", 1337),
                  metaCell(":", 229),
                  metaCell(
                    `Persetujuan Perubahan Data BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11}`,
                    7788,
                    { columnSpan: 2 }
                  ),
                ],
              }),
            ],
          }),

          emptyParagraph(180),

          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            borders: noBorder,
            rows: [
              new TableRow({
                children: [
                  borderlessCell([p([text("Yth.")])], 500),
                  borderlessCell(
                    [
                      p([text(data.nama_perusahaan, { bold: true })]),
                      p([text(data.alamat_perusahaan)]),
                    ],
                    CONTENT_WIDTH - 500
                  ),
                ],
              }),
            ],
          }),

          emptyParagraph(200),

          numberedParagraph(
            `Sehubungan dengan surat ${data.nama_perusahaan} nomor ${data.nomor_surat_permohonan} tanggal ${tanggalSurat} perihal ${data.perihal} yang berkasnya diterima lengkap pada tanggal ${tanggalSurat}, kami sampaikan hal-hal sebagai berikut:`
          ),

          numberedParagraph(
            `Melalui surat tersebut di atas, ${data.nama_perusahaan} selaku ${data.pihak_pengaju} mengajukan permohonan perubahan data terhadap ${data.alasan_perubahan} pada BC 1.1 ${data.jenis_perubahan_data} nomor ${data.nomor_pendaftaran_bc11}, yaitu:`
          ),

          emptyParagraph(120),

          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            rows: [
              new TableRow({
                children: [
                  gridCell(`Data BC 1.1 ${data.jenis_perubahan_data}`, 3000, {
                    bold: true,
                    align: AlignmentType.CENTER,
                  }),
                  gridCell("Semula", 3177, { bold: true, align: AlignmentType.CENTER }),
                  gridCell("Menjadi", 3177, { bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              ...detailRows,
            ],
          }),

          ...(isPerubahanPosBarang
            ? [
                p([text(`    Data-data pada Aplikasi Manifes ${data.jenis_perubahan_data} sebelum perubahan yaitu:`)], {
                  alignment: AlignmentType.JUSTIFIED,
                  before: 160,
                  after: 100,
                }),

                new Table({
                  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                  layout: TableLayoutType.FIXED,
                  rows: [
                    new TableRow({
                      children: [
                        multiLineCell(
                          [
                            "BC 1.1 nomor",
                            "Nama Sarana Pengangkut",
                            "Nomor B/L / AWB / Tanggal",
                            "Jml. Kemasan/Berat Kotor",
                            "Uraian barang",
                            "Shipper",
                          ],
                          3340
                        ),
                        multiLineCell([":", ":", ":", ":", ":", ":"], 300),
                        multiLineCell(
                          [
                            `${data.nomor_pendaftaran_bc11} Pos ${data.nomor_pos}`,
                            data.nama_sarana_pengangkut,
                            `${data.nomor_bl_awb} / ${tanggalBlAwb}`,
                            `${data.jumlah_kemasan} / ${data.berat_kotor}`,
                            data.uraian_barang,
                            data.nama_shipper,
                          ],
                          CONTENT_WIDTH - 3640
                        ),
                      ],
                    }),
                    new TableRow({
                      children: [
                        gridCell("Consignee", 3340),
                        gridCell(":", 300, { align: AlignmentType.CENTER }),
                        gridCell(data.nama_consignee, CONTENT_WIDTH - 3640),
                      ],
                    }),
                  ],
                }),
              ]
            : []),

          emptyParagraph(200),

          numberedParagraph(
            `Berdasarkan penelitian dokumen serta memperhatikan ketentuan pada Peraturan Menteri Keuangan Nomor 158/PMK.04/2017 sebagaimana telah diubah dengan Peraturan Menteri Keuangan Nomor 90/PMK.01/2020 dan Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-38/BC/2017 sebagaimana telah diubah terakhir dengan Peraturan Direktur Jenderal Bea dan Cukai Nomor PER-11/BC/2020, maka permohonan ${data.nama_perusahaan} tentang perubahan data BC 1.1 ${data.jenis_perubahan_data} dapat disetujui dengan perubahan data sebagaimana tercantum pada butir 1 di atas.`
          ),

          p(
            [
              text(
                "KPPBC TMP B Balikpapan berkomitmen untuk selalu menjaga integritas dalam memberikan pengawasan dan pelayanan yang terbaik kepada seluruh pengguna layanan dan mitra kerja."
              ),
            ],
            {
              alignment: AlignmentType.JUSTIFIED,
              indent: { firstLine: 720 },
              line: LINE_SPACING_15,
            }
          ),

          p([text("Demikian disampaikan untuk diketahui.")], {
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 },
            line: LINE_SPACING_15,
          }),

          emptyParagraph(240),

          p([text("Kepala Kantor,")], {
            alignment: AlignmentType.RIGHT,
            after: 900,
          }),
          p([text("(_______________________)", { bold: true })], {
            alignment: AlignmentType.RIGHT,
          }),
          p([text("NIP. ____________________")], {
            alignment: AlignmentType.RIGHT,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
