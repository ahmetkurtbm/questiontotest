"use client";

import { useId, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { approximateSizeKb, cropImageElement, readFileAsDataUrl, shrinkDataUrl } from "@/lib/image";

/**
 * Fotograf sec -> (istege bagli) kirp -> base64 dondur.
 * Kirpma orani sabit degil: eski surumde 4/3'e zorlandigi icin sorularin
 * kenarlari kesiliyordu.
 */
export default function PhotoField({
  label,
  hint,
  value,
  onChange,
  optional = false,
  onError,
}) {
  const inputId = useId();
  const [draft, setDraft] = useState(null);
  const [crop, setCrop] = useState();
  const [busy, setBusy] = useState(false);
  const imageRef = useRef(null);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  const fail = (message) => (onError ? onError(message) : console.error(message));

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const raw = await readFileAsDataUrl(file);
      setDraft(await shrinkDataUrl(raw));
      setCrop(undefined);
    } catch (error) {
      fail(error.message);
    } finally {
      setBusy(false);
    }
  };

  const useWholeImage = () => {
    onChange(draft);
    setDraft(null);
  };

  const useCropped = () => {
    if (!crop || !crop.width || !crop.height || !imageRef.current) return;
    onChange(cropImageElement(imageRef.current, crop));
    setDraft(null);
  };

  if (draft) {
    return (
      <div className="photo-field">
        <div className="row-between">
          <span className="label">{label} — alanı seçin</span>
          <span className="card-hint">Sürükleyerek kırpın</span>
        </div>
        <div className="crop-stage">
          <ReactCrop crop={crop} onChange={(pixelCrop) => setCrop(pixelCrop)}>
            <img ref={imageRef} src={draft} alt="Kırpılacak görsel" />
          </ReactCrop>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={useCropped}
            disabled={!crop || !crop.width}
          >
            Kırp ve kullan
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={useWholeImage}>
            Kırpmadan kullan
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-field">
      <div className="row-between">
        <span className="label">
          {label} {optional && <span className="text-xs muted">(isteğe bağlı)</span>}
        </span>
        {value && <span className="badge">{approximateSizeKb(value)} KB</span>}
      </div>

      <input
        ref={galleryRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="visually-hidden-input"
        onChange={handleFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden-input"
        onChange={handleFile}
      />

      {value ? (
        <div className="photo-preview">
          <img src={value} alt={label} />
          <div className="row">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => galleryRef.current.click()}
            >
              Değiştir
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
              Kaldır
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-drop">
          {busy ? (
            <span className="row" style={{ justifyContent: "center" }}>
              <span className="spinner spinner-dark" /> Görsel hazırlanıyor…
            </span>
          ) : (
            <>
              <span className="photo-drop-icon" aria-hidden="true">
                📷
              </span>
              <span className="text-sm muted">{hint}</span>
              <div className="row" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => galleryRef.current.click()}
                >
                  Galeriden seç
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => cameraRef.current.click()}
                >
                  Fotoğraf çek
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
