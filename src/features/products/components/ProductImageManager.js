"use client";

import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  addProductImage,
  deleteProductImage,
  updateProductImage,
} from "@/features/products/services/productService";
import { getProductImageUrl } from "@/lib/api/image";

export default function ProductImageManager({
  product,
  onProductChange,
  mode = "edit",
  selectedImages = [],
  onSelectedImagesChange,
  disabled = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [processingImageId, setProcessingImageId] = useState(null);
  const [error, setError] = useState(null);

  const addInputRef = useRef(null);
  const replaceInputRefs = useRef({});
  const previewUrlsRef = useRef(new Set());
  const isCreateMode = mode === "create";

  const images = [...(isCreateMode ? selectedImages : product?.images ?? [])].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );

  useEffect(() => {
    const activeUrls = new Set(selectedImages.map((image) => image.previewUrl));
    for (const url of previewUrlsRef.current) {
      if (!activeUrls.has(url)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(url);
      }
    }
  }, [selectedImages]);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function createLocalPreview(file) {
    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.add(previewUrl);
    return { file, fileName: file.name, previewUrl };
  }

  async function handleAddImage(event) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (files.length === 0 || disabled) {
      return;
    }

    if (isCreateMode) {
      const additions = files.map((file, index) => ({
        ...createLocalPreview(file),
        productImageId: crypto.randomUUID(),
        sortOrder: selectedImages.length + index,
      }));
      onSelectedImagesChange([...selectedImages, ...additions]);
      setError(null);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const response = await addProductImage(
        product.productId,
        files[0],
      );

      const newImage = response?.data;

      if (newImage) {
        onProductChange({
          ...product,
          images: [...images, newImage],
        });
      }
    } catch (error) {
      console.error("Ürün görseli eklenemedi:", error);
      setError(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleReplaceImage(image, event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || disabled) {
      return;
    }

    if (isCreateMode) {
      const replacement = createLocalPreview(file);
      onSelectedImagesChange(selectedImages.map((item) =>
        item.productImageId === image.productImageId ? { ...item, ...replacement } : item,
      ));
      setError(null);
      return;
    }

    try {
      setProcessingImageId(image.productImageId);
      setError(null);

      const response = await updateProductImage(
        product.productId,
        image.productImageId,
        file,
      );

      const updatedImage = response?.data;

      if (updatedImage) {
        onProductChange({
          ...product,
          images: images.map((item) =>
            item.productImageId === image.productImageId
              ? updatedImage
              : item,
          ),
        });
      }
    } catch (error) {
      console.error("Ürün görseli güncellenemedi:", error);
      setError(error);
    } finally {
      setProcessingImageId(null);
    }
  }

  async function handleDeleteImage(image) {
    if (disabled) return;
    if (isCreateMode) {
      onSelectedImagesChange(selectedImages
        .filter((item) => item.productImageId !== image.productImageId)
        .map((item, index) => ({ ...item, sortOrder: index })));
      setError(null);
      return;
    }

    const confirmed = window.confirm(
      "Bu ürün görselini silmek istediğinize emin misiniz?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingImageId(image.productImageId);
      setError(null);

      await deleteProductImage(
        product.productId,
        image.productImageId,
      );

      onProductChange({
        ...product,
        images: images.filter(
          (item) => item.productImageId !== image.productImageId,
        ),
      });
    } catch (error) {
      console.error("Ürün görseli silinemedi:", error);
      setError(error);
    } finally {
      setProcessingImageId(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">
            Ürün Görselleri
          </h4>

          <p className="mt-0.5 text-xs text-text-secondary">
            {isCreateMode
              ? "Görselleri seçip önizleyebilir, değiştirebilir veya kaldırabilirsiniz. Görseller ürün oluşturulduğunda kaydedilir."
              : "Görsel ekleyebilir, mevcut görselleri değiştirebilir veya silebilirsiniz."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Görsel Ekle
        </button>

        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple={isCreateMode}
          disabled={disabled || isUploading}
          onChange={handleAddImage}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message || "Görsel işlemi sırasında hata oluştu."}
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-text-secondary">
            {isCreateMode ? "Henüz ürün görseli seçilmedi." : "Henüz ürün görseli bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((image) => {
            const imageUrl = isCreateMode ? image.previewUrl : getProductImageUrl(image.storageKey);
            const isProcessing =
              processingImageId === image.productImageId;

            return (
              <div
                key={image.productImageId}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                <div className="relative aspect-square bg-background-soft">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={image.fileName || "Ürün görseli"}
                      fill
                      sizes="180px"
                      className="object-contain p-3"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-secondary">
                      Görsel yok
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="border-t border-border p-2">
                  <p className="truncate text-[11px] text-text-secondary">
                    {image.fileName || "Görsel"}
                  </p>

                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={disabled || isProcessing}
                      onClick={() => {
                        replaceInputRefs.current[
                          image.productImageId
                        ]?.click();
                      }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-text-primary hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <Pencil className="h-3 w-3" />
                      Değiştir
                    </button>

                    <button
                      type="button"
                      disabled={disabled || isProcessing}
                      aria-label={`${isCreateMode ? "Seçilen görseli kaldır" : "Görseli sil"}: ${image.fileName || "Ürün görseli"}`}
                      title={isCreateMode ? "Kaldır" : "Sil"}
                      onClick={() => handleDeleteImage(image)}
                      className="flex items-center justify-center rounded-md border border-border px-2 py-1.5 text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <input
                      ref={(element) => {
                        replaceInputRefs.current[
                          image.productImageId
                        ] = element;
                      }}
                      type="file"
                      accept="image/*"
                      disabled={disabled || isProcessing}
                      onChange={(event) =>
                        handleReplaceImage(image, event)
                      }
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
