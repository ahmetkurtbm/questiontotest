"use client";

import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

// Varsayilan Helvetica WinAnsi kodlamasi kullandigi icin s/g/I/i basilmiyordu;
// bu yuzden eski PDF'lerde basliklar "Kazanim Kavrama Testi" diye yaziliydi.
// Fontlar public/ altindan URL ile yukleniyor.
Font.register({
  family: "Liberation",
  fonts: [
    { src: "/fonts/LiberationSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/LiberationSans-Bold.ttf", fontWeight: 700 },
  ],
});

// Uzun konu adlari satir sonunda tasmasin.
Font.registerHyphenationCallback((word) => [word]);

const A4 = { width: 595.28, height: 841.89 };
const PAGE_PADDING = 22;
const HEADER_HEIGHT = 46;
const GAP = 10;
// Hucre yuksekligi kalan alani tam doldurursa yuvarlama farki son satiri
// bir sonraki sayfaya itiyor; kucuk bir pay birakiyoruz.
const SAFETY = 12;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Liberation",
    backgroundColor: "#ffffff",
    padding: PAGE_PADDING,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: HEADER_HEIGHT - 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#0f172a",
    borderRadius: 4,
  },
  brand: {
    fontSize: 11,
    fontWeight: 700,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  headerMeta: {
    fontSize: 8,
    color: "#334155",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    paddingHorizontal: 4,
    paddingBottom: GAP,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 3,
  },
  cellImage: {
    width: "100%",
    objectFit: "contain",
  },
  divider: {
    position: "absolute",
    top: PAGE_PADDING + HEADER_HEIGHT,
    bottom: PAGE_PADDING,
    left: A4.width / 2,
    borderLeftWidth: 0.7,
    borderLeftColor: "#cbd5e1",
  },
  footer: {
    position: "absolute",
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
  },
  keyTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  keyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  keyItem: {
    width: 52,
    marginRight: 4,
    marginBottom: 4,
    paddingVertical: 4,
    borderWidth: 0.7,
    borderColor: "#94a3b8",
    borderRadius: 3,
    fontSize: 9,
    textAlign: "center",
  },
  keyNo: {
    fontWeight: 700,
  },
  sectionNote: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 10,
  },
});

function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

function PageHeader({ title, subtitle }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.brand}>QuestionToTest</Text>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerMeta}>{subtitle}</Text>
    </View>
  );
}

function GridPage({ title, subtitle, entries, perPage, note }) {
  const rows = Math.max(1, Math.ceil(perPage / 2));
  const usableHeight = A4.height - PAGE_PADDING * 2 - HEADER_HEIGHT - SAFETY - (note ? 18 : 0);
  const cellHeight = usableHeight / rows;

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title={title} subtitle={subtitle} />
      <View style={styles.divider} />
      {note && <Text style={styles.sectionNote}>{note}</Text>}
      <View style={styles.grid}>
        {entries.map((entry) => (
          <View key={entry.key} style={[styles.cell, { width: "50%", height: cellHeight }]}>
            <Text style={styles.cellLabel}>{entry.label}</Text>
            <Image src={entry.image} style={[styles.cellImage, { height: cellHeight - 20 }]} />
          </View>
        ))}
      </View>
      <View style={styles.footer} fixed>
        <Text>QuestionToTest</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

export function TestDocument({
  questions,
  title = "Kazanım Kavrama Testi",
  subtitle = "Ad Soyad: ............  Puan: ......",
  perPage = 6,
  includeAnswerKey = true,
  includeSolutions = true,
}) {
  const numbered = questions.map((question, index) => ({ ...question, testNo: index + 1 }));
  const solved = numbered.filter((question) => Boolean(question.solutionUrl));

  const questionPages = chunk(
    numbered.map((question) => ({
      key: question.id,
      label: `${question.testNo}.`,
      image: question.questionUrl,
    })),
    perPage
  );

  const solutionPages = includeSolutions
    ? chunk(
        solved.map((question) => ({
          key: `${question.id}-solution`,
          label: `${question.testNo}. sorunun çözümü`,
          image: question.solutionUrl,
        })),
        perPage
      )
    : [];

  return (
    <Document title={title} author="QuestionToTest">
      {questionPages.map((entries, index) => (
        <GridPage
          key={`q-${index}`}
          title={title}
          subtitle={subtitle}
          entries={entries}
          perPage={perPage}
        />
      ))}

      {includeAnswerKey && (
        <Page size="A4" style={styles.page}>
          <PageHeader title={title} subtitle="Cevap Anahtarı" />
          <Text style={styles.keyTitle}>Cevap Anahtarı</Text>
          <View style={styles.keyGrid}>
            {numbered.map((question) => (
              <Text key={`key-${question.id}`} style={styles.keyItem}>
                <Text style={styles.keyNo}>{question.testNo}.</Text> {question.answer}
              </Text>
            ))}
          </View>
          <View style={styles.footer} fixed>
            <Text>QuestionToTest</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      )}

      {solutionPages.map((entries, index) => (
        <GridPage
          key={`s-${index}`}
          title={title}
          subtitle="Çözümler"
          entries={entries}
          perPage={perPage}
          note={
            index === 0
              ? `Çözümü yüklenmiş ${solved.length} soru aşağıda yer alıyor.`
              : undefined
          }
        />
      ))}
    </Document>
  );
}

export async function downloadTestPdf(options) {
  const blob = await pdf(<TestDocument {...options} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${(options.title || "test").replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Blob URL'i hemen serbest birakmak Safari'de indirmeyi iptal ediyor.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
