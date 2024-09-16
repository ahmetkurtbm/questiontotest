import React from "react";
import Logo from "../assets/icons/TahsinAslan.png";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFDownloadLink,
  Image,
} from "@react-pdf/renderer";

// PDF için stil ayarları
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    border: "1 solid black",
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  middleLine: {
    borderLeft: "1 solid black",
    height: "95%",
  },
  question: {
    fontSize: 8,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "20vh",
  },
  logo: {
    width: "40px",
    height: "40px",
  },
  anserKey: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: "5px",
  },
});

// PDF içeriği oluşturulacak Document bileşeni
const MyDocument = ({ questions }) => {
  // Soruları sağ ve sol sütunlara bölme
  const half = Math.ceil(questions.length / 2);
  const leftQuestions = questions.slice(0, half);
  const rightQuestions = questions.slice(half);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.title}>Tahsin Aslan</Text>
          </View>
          <Text style={styles.title}>Kazanim Kavrama Testi</Text>
          <Text style={styles.title}>Puan:</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.column}>
            {leftQuestions.map((question, index) => (
              <View key={index} style={styles.question}>
                <Text>Soru {2 * (index + 1) - 1}</Text>
                {question.fileQuestion && (
                  <Image src={question.fileQuestion} style={styles.image} />
                )}
                {/* <Text>Cevap {2 * (index + 1) - 1}</Text>
                {question.fileAnswer && (
                  <Image src={question.fileAnswer} style={styles.image} />
                )} */}
              </View>
            ))}
          </View>
          <View style={styles.middleLine}></View>
          <View style={styles.column}>
            {rightQuestions.map((question, index) => (
              <View key={index} style={styles.question}>
                <Text>Soru {2 * (index + 1)}</Text>
                {question.fileQuestion && (
                  <Image src={question.fileQuestion} style={styles.image} />
                )}
                {/* <Text>Cevap {2 * (index + 1)}</Text>
                {question.fileAnswer && (
                  <Image src={question.fileAnswer} style={styles.image} />
                )} */}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.anserKey}>
          <Text style={styles.title}> Cevap Anahtari: </Text>
          {questions.map((question, i) => (
            <Text key={i} style={styles.title}>
              {question.answer}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// PDF linkini oluşturan bileşen
const CreateTestPdf = ({ questions }) => (
  <PDFDownloadLink
    document={<MyDocument questions={questions} />}
    fileName="Sorular.pdf"
  >
    {({ loading }) => (loading ? "Yükleniyor..." : "Soru PDF'ini İndir")}
  </PDFDownloadLink>
);

export default CreateTestPdf;
