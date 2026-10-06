"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";

export default function ProductDeleteModal({
    isOpen,
    product,
    isDeleting,
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
                    <h3 className="text-base font-semibold text-text-primary">
                        Ürünü Sil
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
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
                                "Ürün silinirken bir hata oluştu."}
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <Trash2 className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                Bu ürünü silmek istediğinize emin misiniz?
                            </p>

                            <p className="mt-1 text-sm text-text-secondary">
                                <span className="font-medium text-text-primary">
                                    {product.name}
                                </span>{" "}
                                ürünü kalıcı olarak silinecektir.
                            </p>

                            <p className="mt-2 text-xs leading-5 text-red-600">
                                Ürün ve ürüne ait görseller kalıcı olarak
                                silinecektir. Bu işlem geri alınamaz.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        İptal
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDeleting && (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}

                        {isDeleting ? "Siliniyor..." : "Ürünü Kalıcı Sil"}
                    </button>
                </div>
            </div>
        </div>
    );
}