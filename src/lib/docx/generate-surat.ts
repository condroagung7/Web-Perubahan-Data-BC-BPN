import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
} from "docx";
import type { Permohonan } from "@/types/database";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function rowLabelValue(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 3200, type: WidthType.DXA },
        shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        borders,
        width: { size: 6160, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun(value)] })],
      }),
    ],
  });
}

function headerCell(text: string) {
  return new TableCell({
    borders,
    shading: { fill: "0B2545", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function dataCell(text: string) {
  return new TableCell({
    borders,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun(text)] })],
  });
}

export async function generateSuratPersetujuan(data: Permohonan): Promise<Buffer> {
  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tanggalSurat = new Date(data.tanggal_surat_permohonan).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const detailRows = data.detail_perubahan.map(
    (d) =>
      new TableRow({
        children: [dataCell(d.data_yang_dirubah), dataCell(d.data_semula), dataCell(d.data_seharusnya)],
      })
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: {
            spacing: { before: 240, after: 240 },
            alignment: AlignmentType.CENTER,
            outlineLevel: 0,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("SURAT PERSETUJUAN PERUBAHAN DATA")],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: `Nomor: ${data.kode_tracking}/SP/${new Date().getFullYear()}`,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun(
                `Sehubungan dengan surat permohonan Nomor ${data.nomor_surat_permohonan} tanggal ${tanggalSurat} perihal "${data.perihal}", dengan ini dinyatakan bahwa permohonan perubahan data berikut telah DISETUJUI:`
              ),
            ],
          }),

          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3200, 6160],
            rows: [
              rowLabelValue("Kode Tracking", data.kode_tracking),
              rowLabelValue("Nama Perusahaan", data.nama_perusahaan),
              rowLabelValue("Kota", data.kota),
              rowLabelValue("Jenis Perubahan Data", data.jenis_perubahan_data),
              rowLabelValue("Pihak Pengaju", data.pihak_pengaju),
              rowLabelValue("Nomor Aju Manifes", data.nomor_aju_manifes),
              rowLabelValue("Nomor Pendaftaran BC 1.1", data.nomor_pendaftaran_bc11),
              rowLabelValue("Alasan Perubahan", data.alasan_perubahan),
            ],
          }),

          new Paragraph({ spacing: { before: 300, after: 150 }, children: [
            new TextRun({ text: "Detail Perubahan Data:", bold: true }),
          ] }),

          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 3120, 3120],
            rows: [
              new TableRow({
                children: [
                  headerCell("Data yang Dirubah"),
                  headerCell("Data Semula"),
                  headerCell("Data Seharusnya"),
                ],
              }),
              ...detailRows,
            ],
          }),

          new Paragraph({ spacing: { before: 360, after: 200 }, children: [
            new TextRun(
              "Demikian surat persetujuan ini dibuat untuk dapat dipergunakan sebagaimana mestinya."
            ),
          ] }),
          new Paragraph({
            spacing: { before: 600 },
            alignment: AlignmentType.RIGHT,
            children: [new TextRun(`${data.kota}, ${tanggal}`)],
          }),
          new Paragraph({
            spacing: { before: 800 },
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: data.nama_penandatangan, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun(data.jabatan_penandatangan)],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}