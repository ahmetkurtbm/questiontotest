import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const SavePdf = () => {
  const [images, setImages] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const pdfData = event.target.result;
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const pageImages = [];

        // Her sayfayı işleyip, canvas olarak çiziyoruz
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          // Canvas ayarları
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Sayfayı canvas'a render et
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Canvas'ı resim URL'sine çevirip array'e ekle
          const imageData = canvas.toDataURL("image/png");
          pageImages.push(imageData);
        }

        setImages(pageImages);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="pdf-reader">
      <h2>PDF Yükleyici - Soruları Resim Olarak Göster</h2>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />

      <div className="images-list">
        <h3>Sayfa Görselleri</h3>
        {images.length > 0 ? (
          images.map((image, index) => (
            <div key={index} className="image-container">
              <h4>Sayfa {index + 1}</h4>
              <img
                src={image}
                alt={`PDF Page ${index + 1}`}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          ))
        ) : (
          <p>Henüz resim yüklenmedi.</p>
        )}
      </div>
    </div>
  );
};

export default SavePdf;
