"use client";

import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    activateShippingMethod,
    createShippingMethod,
    deactivateShippingMethod,
    deleteShippingMethod,
    getShippingMethodById,
    getShippingMethods,
    updateShippingMethod,
} from "@/features/shippingMethods/services/shippingMethodService";

const PAGE_SIZE = 10;

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        "Bir hata oluştu."
    );
}

export default function ShippingMethodList() {
    const [shippingMethods, setShippingMethods] = useState([]);
    const [name, setName] = useState("");
    const [isActive, setIsActive] = useState("");
    const [appliedName, setAppliedName] = useState("");
    const [appliedIsActive, setAppliedIsActive] = useState("");

    const [pageIndex, setPageIndex] = useState(0);

    const [pagination, setPagination] = useState({
        size: PAGE_SIZE,
        index: 0,
        count: 0,
        pages: 0,
        hasPrevious: false,
        hasNext: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingShippingMethod, setIsLoadingShippingMethod] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        displayOrder: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const [deleteModalShippingMethod, setDeleteModalShippingMethod] =
        useState(null);
    const [deletingShippingMethodId, setDeletingShippingMethodId] =
        useState(null);

    const [changingStatusId, setChangingStatusId] = useState(null);
    const [movingShippingMethodId, setMovingShippingMethodId] = useState(null);

    useEffect(() => {
        async function loadShippingMethods() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await getShippingMethods({
                    params: {
                        ...(appliedName && { Name: appliedName }),
                        ...(appliedIsActive !== "" && {
                            IsActive: appliedIsActive === "true",
                        }),
                        "PageRequest.PageIndex": pageIndex,
                        "PageRequest.PageSize": PAGE_SIZE,
                    },
                });

                const items = [...(response?.items ?? [])].sort(
                    (first, second) =>
                        (first.displayOrder ?? 0) - (second.displayOrder ?? 0)
                );

                setShippingMethods(items);

                setPagination({
                    size: response?.size ?? PAGE_SIZE,
                    index: response?.index ?? pageIndex,
                    count: response?.count ?? 0,
                    pages: response?.pages ?? 0,
                    hasPrevious: response?.hasPrevious ?? false,
                    hasNext: response?.hasNext ?? false,
                });
            } catch (requestError) {
                setShippingMethods([]);
                setError(getErrorMessage(requestError));
            } finally {
                setIsLoading(false);
            }
        }

        loadShippingMethods();
    }, [pageIndex, appliedName, appliedIsActive, refreshKey]);

    function handleSearch(event) {
        event.preventDefault();

        setPageIndex(0);
        setAppliedName(name.trim());
        setAppliedIsActive(isActive);
    }

    function handleClearFilters() {
        setName("");
        setIsActive("");
        setAppliedName("");
        setAppliedIsActive("");
        setPageIndex(0);
    }

    function resetModal() {
        setIsModalOpen(false);
        setIsLoadingShippingMethod(false);
        setIsEditing(false);
        setSelectedShippingMethod(null);
        setFormData({
            name: "",
            price: "",
            displayOrder: "",
        });
        setFormError(null);
    }

    async function loadAllShippingMethods() {
        const response = await getShippingMethods({
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1000,
            },
        });

        return [...(response?.items ?? [])].sort(
            (first, second) =>
                (first.displayOrder ?? 0) - (second.displayOrder ?? 0)
        );
    }

    function handleOpenCreateModal() {
        setSelectedShippingMethod(null);
        setIsEditing(true);
        setIsLoadingShippingMethod(false);
        setFormError(null);
        setFormData({
            name: "",
            price: "",
            displayOrder: "",
        });
        setIsModalOpen(true);
    }

    async function handleOpenShippingMethod(shippingMethodId, editMode = false) {
        setIsModalOpen(true);
        setIsLoadingShippingMethod(true);
        setSelectedShippingMethod(null);
        setIsEditing(editMode);
        setFormError(null);
        setFormData({
            name: "",
            price: "",
            displayOrder: "",
        });

        try {
            const response = await getShippingMethodById(shippingMethodId);
            const shippingMethod = response?.data ?? null;

            setSelectedShippingMethod(shippingMethod);
            setFormData({
                name: shippingMethod?.name ?? "",
                price:
                    shippingMethod?.price !== null &&
                        shippingMethod?.price !== undefined
                        ? String(shippingMethod.price)
                        : "",
                displayOrder:
                    shippingMethod?.displayOrder !== null &&
                        shippingMethod?.displayOrder !== undefined
                        ? String(shippingMethod.displayOrder)
                        : "",
            });
        } catch (requestError) {
            setFormError(getErrorMessage(requestError));
        } finally {
            setIsLoadingShippingMethod(false);
        }
    }

    function handleFormChange(event) {
        const { name: fieldName, value } = event.target;

        setFormData((current) => ({
            ...current,
            [fieldName]: value,
        }));
    }

    function handleCancelEditing() {
        if (!selectedShippingMethod) {
            resetModal();
            return;
        }

        setFormData({
            name: selectedShippingMethod.name ?? "",
            price:
                selectedShippingMethod.price !== null &&
                    selectedShippingMethod.price !== undefined
                    ? String(selectedShippingMethod.price)
                    : "",
            displayOrder:
                selectedShippingMethod.displayOrder !== null &&
                    selectedShippingMethod.displayOrder !== undefined
                    ? String(selectedShippingMethod.displayOrder)
                    : "",
        });

        setIsEditing(false);
        setFormError(null);
    }

    async function updateShippingMethodDirect(shippingMethod, displayOrder) {
        return updateShippingMethod({
            id: shippingMethod.shippingMethodId,
            name: shippingMethod.name,
            price: shippingMethod.price,
            displayOrder,
        });
    }

    async function swapShippingMethodOrder(
        currentShippingMethod,
        targetDisplayOrder
    ) {
        const allShippingMethods = await loadAllShippingMethods();

        const targetShippingMethod = allShippingMethods.find(
            (shippingMethod) =>
                shippingMethod.displayOrder === targetDisplayOrder
        );

        if (!targetShippingMethod) {
            return false;
        }

        if (
            targetShippingMethod.shippingMethodId ===
            currentShippingMethod.shippingMethodId
        ) {
            return true;
        }

        const temporaryDisplayOrder =
            Math.max(
                ...allShippingMethods.map(
                    (shippingMethod) => shippingMethod.displayOrder ?? 0
                )
            ) + 1;

        await updateShippingMethodDirect(
            currentShippingMethod,
            temporaryDisplayOrder
        );

        await updateShippingMethodDirect(
            targetShippingMethod,
            currentShippingMethod.displayOrder
        );

        await updateShippingMethodDirect(
            currentShippingMethod,
            targetDisplayOrder
        );

        return true;
    }

    async function handleSaveShippingMethod(event) {
        event.preventDefault();

        const trimmedName = formData.name.trim();
        const parsedPrice = Number(formData.price);
        const parsedDisplayOrder = Number(formData.displayOrder);

        if (!trimmedName) {
            setFormError("Kargo yöntemi adı zorunludur.");
            return;
        }

        if (
            formData.price === "" ||
            Number.isNaN(parsedPrice) ||
            parsedPrice < 0
        ) {
            setFormError("Geçerli bir kargo ücreti giriniz.");
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            if (!selectedShippingMethod) {
                const allShippingMethods = await loadAllShippingMethods();

                const maxDisplayOrder =
                    allShippingMethods.length > 0
                        ? Math.max(
                            ...allShippingMethods.map(
                                (shippingMethod) =>
                                    shippingMethod.displayOrder ?? 0
                            )
                        )
                        : 0;

                await createShippingMethod({
                    name: trimmedName,
                    price: parsedPrice,
                    displayOrder: maxDisplayOrder + 1,
                });

                resetModal();
                setPageIndex(0);
                setAppliedName("");
                setAppliedIsActive("");
                setName("");
                setIsActive("");
                setRefreshKey((current) => current + 1);

                return;
            }

            const currentDisplayOrder = selectedShippingMethod.displayOrder;

            if (
                Number.isNaN(parsedDisplayOrder) ||
                parsedDisplayOrder < 1
            ) {
                setFormError("Geçerli bir sıra numarası giriniz.");
                setIsSaving(false);
                return;
            }

            const allShippingMethods = await loadAllShippingMethods();

            const targetShippingMethod = allShippingMethods.find(
                (shippingMethod) =>
                    shippingMethod.displayOrder === parsedDisplayOrder &&
                    shippingMethod.shippingMethodId !==
                    selectedShippingMethod.shippingMethodId
            );

            if (
                parsedDisplayOrder !== currentDisplayOrder &&
                targetShippingMethod
            ) {
                await swapShippingMethodOrder(
                    selectedShippingMethod,
                    parsedDisplayOrder
                );
            }

            const response = await updateShippingMethod({
                id: selectedShippingMethod.shippingMethodId,
                name: trimmedName,
                price: parsedPrice,
                displayOrder: parsedDisplayOrder,
            });

            const updatedShippingMethod = response?.data ?? null;

            if (updatedShippingMethod) {
                setSelectedShippingMethod(updatedShippingMethod);
                setFormData({
                    name: updatedShippingMethod.name ?? "",
                    price:
                        updatedShippingMethod.price !== null &&
                            updatedShippingMethod.price !== undefined
                            ? String(updatedShippingMethod.price)
                            : "",
                    displayOrder:
                        updatedShippingMethod.displayOrder !== null &&
                            updatedShippingMethod.displayOrder !== undefined
                            ? String(updatedShippingMethod.displayOrder)
                            : "",
                });
            }

            setIsEditing(false);
            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setFormError(getErrorMessage(requestError));
        } finally {
            setIsSaving(false);
        }
    }

    async function moveShippingMethod(shippingMethod, direction) {
        if (movingShippingMethodId) {
            return;
        }

        setMovingShippingMethodId(shippingMethod.shippingMethodId);
        setError(null);

        try {
            const allShippingMethods = await loadAllShippingMethods();

            const currentIndex = allShippingMethods.findIndex(
                (item) =>
                    item.shippingMethodId === shippingMethod.shippingMethodId
            );

            if (currentIndex === -1) {
                return;
            }

            const targetIndex =
                direction === "up" ? currentIndex - 1 : currentIndex + 1;

            if (
                targetIndex < 0 ||
                targetIndex >= allShippingMethods.length
            ) {
                return;
            }

            const targetShippingMethod = allShippingMethods[targetIndex];

            await swapShippingMethodOrder(
                shippingMethod,
                targetShippingMethod.displayOrder
            );

            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setMovingShippingMethodId(null);
        }
    }

    async function handleChangeStatus(shippingMethod) {
        if (changingStatusId) {
            return;
        }

        setChangingStatusId(shippingMethod.shippingMethodId);
        setError(null);

        try {
            if (shippingMethod.isActive) {
                await deactivateShippingMethod(shippingMethod.shippingMethodId);
            } else {
                await activateShippingMethod(shippingMethod.shippingMethodId);
            }

            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setChangingStatusId(null);
        }
    }

    function handleOpenDeleteModal(shippingMethod) {
        setDeleteModalShippingMethod(shippingMethod);
    }

    async function handleDeleteShippingMethod() {
        if (!deleteModalShippingMethod) {
            return;
        }

        const shippingMethod = deleteModalShippingMethod;

        setDeletingShippingMethodId(shippingMethod.shippingMethodId);
        setError(null);

        try {
            const allShippingMethods = await loadAllShippingMethods();

            await deleteShippingMethod(shippingMethod.shippingMethodId);

            const remainingShippingMethods = allShippingMethods
                .filter(
                    (item) =>
                        item.shippingMethodId !==
                        shippingMethod.shippingMethodId
                )
                .sort(
                    (first, second) =>
                        (first.displayOrder ?? 0) -
                        (second.displayOrder ?? 0)
                );

            for (let index = 0; index < remainingShippingMethods.length; index += 1) {
                const remainingShippingMethod = remainingShippingMethods[index];
                const desiredDisplayOrder = index + 1;

                if (
                    remainingShippingMethod.displayOrder !==
                    desiredDisplayOrder
                ) {
                    const temporaryDisplayOrder =
                        remainingShippingMethods.length + index + 100;

                    await updateShippingMethodDirect(
                        remainingShippingMethod,
                        temporaryDisplayOrder
                    );
                }
            }

            for (let index = 0; index < remainingShippingMethods.length; index += 1) {
                const remainingShippingMethod = remainingShippingMethods[index];
                const desiredDisplayOrder = index + 1;

                if (
                    remainingShippingMethod.displayOrder !==
                    desiredDisplayOrder
                ) {
                    await updateShippingMethodDirect(
                        remainingShippingMethod,
                        desiredDisplayOrder
                    );
                }
            }

            setDeleteModalShippingMethod(null);

            if (
                shippingMethods.length === 1 &&
                pageIndex > 0
            ) {
                setPageIndex((current) => current - 1);
            } else {
                setRefreshKey((current) => current + 1);
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setDeleteModalShippingMethod(null);
        } finally {
            setDeletingShippingMethodId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Kargo Yöntemleri
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kargo yöntemlerini ve sıralamalarını yönetin.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EE7402] px-4 text-sm font-medium text-white transition hover:bg-[#d96700]"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Kargo Yöntemi
                </button>
            </div>

            <form
                onSubmit={handleSearch}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
                    <div>
                        <label
                            htmlFor="shippingMethodName"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Kargo Yöntemi
                        </label>

                        <input
                            id="shippingMethodName"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Kargo yöntemi ara..."
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="shippingMethodStatus"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Durum
                        </label>

                        <select
                            id="shippingMethodStatus"
                            value={isActive}
                            onChange={(event) => setIsActive(event.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10"
                        >
                            <option value="">Tümü</option>
                            <option value="true">Aktif</option>
                            <option value="false">Pasif</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                            <Search className="h-4 w-4" />
                            Ara
                        </button>

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Temizle
                        </button>
                    </div>
                </div>
            </form>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="w-24 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Sıra
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Kargo Yöntemi
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Ücret
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Durum
                                </th>

                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#EE7402]" />
                                    </td>
                                </tr>
                            ) : shippingMethods.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <p className="text-sm text-gray-500">
                                            Kayıtlı kargo yöntemi bulunamadı.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                shippingMethods.map((shippingMethod, index) => {
                                    const isFirst =
                                        index === 0 && !pagination.hasPrevious;
                                    const isLast =
                                        index === shippingMethods.length - 1 &&
                                        !pagination.hasNext;

                                    const isMoving =
                                        movingShippingMethodId ===
                                        shippingMethod.shippingMethodId;

                                    const isChangingStatus =
                                        changingStatusId ===
                                        shippingMethod.shippingMethodId;

                                    return (
                                        <tr
                                            key={shippingMethod.shippingMethodId}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-700">
                                                        {shippingMethod.displayOrder}
                                                    </span>

                                                    <div className="flex flex-col">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveShippingMethod(
                                                                    shippingMethod,
                                                                    "up"
                                                                )
                                                            }
                                                            disabled={
                                                                isFirst ||
                                                                isMoving ||
                                                                Boolean(
                                                                    movingShippingMethodId
                                                                )
                                                            }
                                                            className="rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                            title="Yukarı taşı"
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                moveShippingMethod(
                                                                    shippingMethod,
                                                                    "down"
                                                                )
                                                            }
                                                            disabled={
                                                                isLast ||
                                                                isMoving ||
                                                                Boolean(
                                                                    movingShippingMethodId
                                                                )
                                                            }
                                                            className="rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                            title="Aşağı taşı"
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-medium text-gray-900">
                                                    {shippingMethod.name}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {Number(
                                                    shippingMethod.price ?? 0
                                                ).toLocaleString("tr-TR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}{" "}
                                                TL
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${shippingMethod.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {shippingMethod.isActive ? "Aktif" : "Pasif"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenShippingMethod(
                                                                shippingMethod.shippingMethodId,
                                                                false
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Görüntüle
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenShippingMethod(
                                                                shippingMethod.shippingMethodId,
                                                                true
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Düzenle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChangeStatus(shippingMethod)}
                                                        disabled={isChangingStatus}
                                                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${shippingMethod.isActive
                                                            ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                                            : "border-green-200 text-green-600 hover:bg-green-50"
                                                            }`}
                                                    >
                                                        {isChangingStatus && (
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        )}

                                                        {shippingMethod.isActive ? "Pasifleştir" : "Aktif Et"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenDeleteModal(
                                                                shippingMethod
                                                            )
                                                        }
                                                        disabled={
                                                            deletingShippingMethodId ===
                                                            shippingMethod.shippingMethodId
                                                        }
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingShippingMethodId ===
                                                            shippingMethod.shippingMethodId ? (
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                        Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                        Toplam{" "}
                        <span className="font-medium text-gray-700">
                            {pagination.count}
                        </span>{" "}
                        kargo yöntemi
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setPageIndex((current) => current - 1)
                            }
                            disabled={
                                !pagination.hasPrevious || isLoading
                            }
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </button>

                        <span className="px-2 text-sm text-gray-600">
                            {pagination.pages > 0
                                ? pagination.index + 1
                                : 0}{" "}
                            / {pagination.pages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPageIndex((current) => current + 1)
                            }
                            disabled={!pagination.hasNext || isLoading}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {selectedShippingMethod
                                        ? isEditing
                                            ? "Kargo Yöntemini Düzenle"
                                            : "Kargo Yöntemi Detayı"
                                        : "Yeni Kargo Yöntemi"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedShippingMethod
                                        ? isEditing
                                            ? "Kargo yöntemi bilgilerini güncelleyin."
                                            : "Kargo yöntemi bilgilerini görüntüleyin."
                                        : "Yeni bir kargo yöntemi oluşturun."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetModal}
                                disabled={isSaving}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {isLoadingShippingMethod ? (
                            <div className="px-6 py-12 text-center">
                                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#EE7402]" />
                            </div>
                        ) : (
                            <form onSubmit={handleSaveShippingMethod}>
                                <div className="space-y-5 px-6 py-6">
                                    {formError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {formError}
                                        </div>
                                    )}

                                    <div>
                                        <label
                                            htmlFor="shippingMethodModalName"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Kargo Yöntemi
                                        </label>

                                        <input
                                            id="shippingMethodModalName"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            disabled={!isEditing || isSaving}
                                            placeholder="Örn. Yurtiçi Kargo"
                                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="shippingMethodModalPrice"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Kargo Ücreti
                                        </label>

                                        <div className="relative">
                                            <input
                                                id="shippingMethodModalPrice"
                                                name="price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={handleFormChange}
                                                disabled={
                                                    !isEditing || isSaving
                                                }
                                                placeholder="0.00"
                                                className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                            />

                                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
                                                TL
                                            </span>
                                        </div>
                                    </div>

                                    {selectedShippingMethod && (
                                        <div>
                                            <label
                                                htmlFor="shippingMethodModalDisplayOrder"
                                                className="mb-1.5 block text-sm font-medium text-gray-700"
                                            >
                                                Sıra
                                            </label>

                                            <input
                                                id="shippingMethodModalDisplayOrder"
                                                name="displayOrder"
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={formData.displayOrder}
                                                onChange={handleFormChange}
                                                disabled={
                                                    !isEditing || isSaving
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                            />

                                            <p className="mt-1.5 text-xs text-gray-400">
                                                Mevcut başka bir sıraya taşırsanız
                                                ilgili kargo yöntemiyle yer
                                                değiştirilir.
                                            </p>
                                        </div>
                                    )}

                                    {!selectedShippingMethod && (
                                        <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                                            Yeni kargo yöntemi otomatik olarak
                                            listenin son sırasına eklenir.
                                        </div>
                                    )}

                                    {selectedShippingMethod &&
                                        !isEditing && (
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                    Kargo Yöntemi ID
                                                </label>

                                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                                                    {
                                                        selectedShippingMethod.shippingMethodId
                                                    }
                                                </div>
                                            </div>
                                        )}
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                                    {selectedShippingMethod &&
                                        !isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={resetModal}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Kapat
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#EE7402] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#d96700]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Düzenle
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={
                                                    selectedShippingMethod
                                                        ? handleCancelEditing
                                                        : resetModal
                                                }
                                                disabled={isSaving}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Vazgeç
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#EE7402] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#d96700] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isSaving && (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                )}

                                                {selectedShippingMethod
                                                    ? "Kaydet"
                                                    : "Oluştur"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {deleteModalShippingMethod && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 px-6 py-5">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Kargo Yöntemini Sil
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Bu işlem geri alınamaz.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm leading-6 text-gray-700">
                                <span className="font-semibold text-gray-900">
                                    {deleteModalShippingMethod.name}
                                </span>{" "}
                                kargo yöntemini silmek istediğinize emin
                                misiniz?
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                                Silme sonrasında diğer kargo yöntemlerinin sıra
                                numaraları yeniden düzenlenecektir.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteModalShippingMethod(null)
                                }
                                disabled={
                                    deletingShippingMethodId ===
                                    deleteModalShippingMethod.shippingMethodId
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteShippingMethod}
                                disabled={
                                    deletingShippingMethodId ===
                                    deleteModalShippingMethod.shippingMethodId
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingShippingMethodId ===
                                    deleteModalShippingMethod.shippingMethodId && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}

                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}