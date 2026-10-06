"use client";

import { LoaderCircle, X } from "lucide-react";

export default function ProductDeactivateModal({
    isOpen,
    product,
    isDeactivating,
    error,
    onClose,
    onConfirm,
}) {
    if (!isOpen || !product) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">
                            Ürünü Pasifleştir
                        </h3>

                        <p className="mt-0.5 text-xs text-text-secondary">
                            Bu işlem ürünü mağazada pasif hale getirir.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeactivating}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error.message ||
                                "Ürün pasifleştirilirken bir hata oluştu."}
                        </div>
                    )}

                    <p className="text-sm leading-6 text-text-secondary">
                        <span className="font-semibold text-text-primary">
                            {product.name}
                        </span>{" "}
                        ürününü pasifleştirmek istediğinizden emin misiniz?
                    </p>

                    <p className="mt-3 text-xs leading-5 text-text-secondary">
                        Ürün silinmez. Pasif duruma getirilir ve daha sonra
                        tekrar aktifleştirilebilir.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeactivating}
                        className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Vazgeç
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeactivating}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDeactivating && (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}

                        {isDeactivating
                            ? "Pasifleştiriliyor..."
                            : "Pasifleştir"}
                    </button>
                </div>
            </div>
        </div>
    );
}