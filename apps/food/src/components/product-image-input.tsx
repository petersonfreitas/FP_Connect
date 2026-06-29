"use client";

import { useEffect, useState } from "react";

type ProductImageInputProps = {
  imageAlt: string;
  imageUrl: string | null;
};

export function ProductImageInput({ imageAlt, imageUrl }: ProductImageInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [removeCurrent, setRemoveCurrent] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasNewFile = Boolean(selectedFileName);
  const displayUrl = previewUrl ?? imageUrl;

  return (
    <div className="product-image-field">
      <input name="imageUrl" type="hidden" value={imageUrl ?? ""} />
      <div className="product-image-preview">
        {displayUrl ? <img alt={imageAlt} src={displayUrl} /> : <span>Sem imagem</span>}
      </div>
      <div className="product-image-actions">
        <label>
          Imagem do produto
          <input
            accept="image/jpeg,image/png,image/webp"
            name="imageFile"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;

              setRemoveCurrent(false);
              setSelectedFileName(file?.name ?? null);
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
        </label>
        <p className="muted-copy">
          Use JPG, PNG ou WEBP de ate 3 MB. Ao escolher uma nova imagem, a atual
          sera substituida automaticamente ao salvar.
        </p>
        {hasNewFile ? (
          <div className="product-image-replace-hint" aria-live="polite">
            Nova imagem selecionada: {selectedFileName}
          </div>
        ) : null}
        {imageUrl ? (
          <label className="checkbox-field product-remove-image">
            <input
              checked={removeCurrent}
              disabled={hasNewFile}
              name="removeImage"
              onChange={(event) => setRemoveCurrent(event.currentTarget.checked)}
              type="checkbox"
            />
            Deixar produto sem imagem ao salvar
          </label>
        ) : null}
      </div>
    </div>
  );
}
