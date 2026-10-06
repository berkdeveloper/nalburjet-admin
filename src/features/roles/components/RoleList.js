"use client";

import {
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
    createRole,
    deleteRole,
    getRoleById,
    getRoles,
    updateRole,
} from "@/features/roles/services/roleService";

const PAGE_SIZE = 10;

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        "Bir hata oluştu."
    );
}

export default function RoleList() {
    const [roles, setRoles] = useState([]);
    const [roleName, setRoleName] = useState("");
    const [appliedRoleName, setAppliedRoleName] = useState("");
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

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isLoadingRole, setIsLoadingRole] = useState(false);
    const [isRoleEditing, setIsRoleEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const [formData, setFormData] = useState({
        roleName: "",
        description: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    const [deleteModalRole, setDeleteModalRole] = useState(null);
    const [deletingRoleId, setDeletingRoleId] = useState(null);

    useEffect(() => {
        async function loadRoles() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await getRoles({
                    params: {
                        ...(appliedRoleName && { RoleName: appliedRoleName }),
                        "PageRequest.PageIndex": pageIndex,
                        "PageRequest.PageSize": PAGE_SIZE,
                    },
                });

                setRoles(response?.items ?? []);
                setPagination({
                    size: response?.size ?? PAGE_SIZE,
                    index: response?.index ?? pageIndex,
                    count: response?.count ?? 0,
                    pages: response?.pages ?? 0,
                    hasPrevious: response?.hasPrevious ?? false,
                    hasNext: response?.hasNext ?? false,
                });
            } catch (requestError) {
                setRoles([]);
                setError(getErrorMessage(requestError));
            } finally {
                setIsLoading(false);
            }
        }

        loadRoles();
    }, [pageIndex, appliedRoleName, refreshKey]);

    function handleSearch(event) {
        event.preventDefault();
        setPageIndex(0);
        setAppliedRoleName(roleName.trim());
    }

    function handleClearFilters() {
        setRoleName("");
        setAppliedRoleName("");
        setPageIndex(0);
    }

    function resetRoleModal() {
        setIsRoleModalOpen(false);
        setIsLoadingRole(false);
        setIsRoleEditing(false);
        setSelectedRole(null);
        setFormData({
            roleName: "",
            description: "",
        });
        setFormError(null);
    }

    function handleOpenCreateModal() {
        setSelectedRole(null);
        setIsRoleEditing(true);
        setIsLoadingRole(false);
        setFormData({
            roleName: "",
            description: "",
        });
        setFormError(null);
        setIsRoleModalOpen(true);
    }

    async function handleOpenRole(roleId, editMode = false) {
        setIsRoleModalOpen(true);
        setIsLoadingRole(true);
        setSelectedRole(null);
        setIsRoleEditing(editMode);
        setFormData({
            roleName: "",
            description: "",
        });
        setFormError(null);

        try {
            const response = await getRoleById(roleId);
            const role = response?.data ?? null;

            setSelectedRole(role);
            setFormData({
                roleName: role?.roleName ?? "",
                description: role?.description ?? "",
            });
        } catch (requestError) {
            setFormError(getErrorMessage(requestError));
        } finally {
            setIsLoadingRole(false);
        }
    }

    function handleFormChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleCancelEditing() {
        if (!selectedRole) {
            resetRoleModal();
            return;
        }

        setFormData({
            roleName: selectedRole.roleName ?? "",
            description: selectedRole.description ?? "",
        });
        setIsRoleEditing(false);
        setFormError(null);
    }

    async function handleSaveRole(event) {
        event.preventDefault();

        const trimmedRoleName = formData.roleName.trim();
        const trimmedDescription = formData.description.trim();

        if (!trimmedRoleName) {
            setFormError("Rol adı zorunludur.");
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            if (selectedRole) {
                const response = await updateRole({
                    id: selectedRole.roleId,
                    roleName: trimmedRoleName,
                    description: trimmedDescription,
                });

                const updatedRole = response?.data ?? null;

                if (updatedRole) {
                    setSelectedRole(updatedRole);
                    setFormData({
                        roleName: updatedRole.roleName ?? "",
                        description: updatedRole.description ?? "",
                    });
                }

                setIsRoleEditing(false);
            } else {
                const response = await createRole({
                    roleName: trimmedRoleName,
                    description: trimmedDescription,
                });

                const createdRole = response?.data ?? null;

                resetRoleModal();

                if (createdRole) {
                    setPageIndex(0);
                    setAppliedRoleName("");
                    setRoleName("");
                }
            }

            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setFormError(getErrorMessage(requestError));
        } finally {
            setIsSaving(false);
        }
    }

    function handleOpenDeleteModal(role) {
        setDeleteModalRole(role);
    }

    async function handleDeleteRole() {
        if (!deleteModalRole) {
            return;
        }

        const role = deleteModalRole;

        setDeletingRoleId(role.roleId);
        setError(null);

        try {
            await deleteRole(role.roleId);

            setDeleteModalRole(null);

            if (selectedRole?.roleId === role.roleId) {
                resetRoleModal();
            }

            if (roles.length === 1 && pageIndex > 0) {
                setPageIndex((current) => current - 1);
            } else {
                setRefreshKey((current) => current + 1);
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setDeleteModalRole(null);
        } finally {
            setDeletingRoleId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Roller</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Sistem rollerini yönetin.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EE7402] px-4 text-sm font-medium text-white transition hover:bg-[#d96700]"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Rol
                </button>
            </div>

            <form
                onSubmit={handleSearch}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="flex-1">
                        <label
                            htmlFor="roleName"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Rol Adı
                        </label>

                        <input
                            id="roleName"
                            type="text"
                            value={roleName}
                            onChange={(event) => setRoleName(event.target.value)}
                            placeholder="Rol adı ara..."
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10"
                        />
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
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Rol Adı
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Açıklama
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center">
                                        <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#EE7402]" />
                                    </td>
                                </tr>
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center">
                                        <p className="text-sm text-gray-500">
                                            Kayıtlı rol bulunamadı.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr
                                        key={role.roleId}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-gray-900">
                                                {role.roleName}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {role.description || "-"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenRole(role.roleId, false)
                                                    }
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Görüntüle
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenRole(role.roleId, true)
                                                    }
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Düzenle
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDeleteModal(role)}
                                                    disabled={deletingRoleId === role.roleId}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingRoleId === role.roleId ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
                        rol
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPageIndex((current) => current - 1)}
                            disabled={!pagination.hasPrevious || isLoading}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </button>

                        <span className="px-2 text-sm text-gray-600">
                            {pagination.pages > 0 ? pagination.index + 1 : 0} /{" "}
                            {pagination.pages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPageIndex((current) => current + 1)}
                            disabled={!pagination.hasNext || isLoading}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {selectedRole
                                        ? isRoleEditing
                                            ? "Rolü Düzenle"
                                            : "Rol Detayı"
                                        : "Yeni Rol"}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedRole
                                        ? isRoleEditing
                                            ? "Rol bilgilerini güncelleyin."
                                            : "Rol bilgilerini görüntüleyin."
                                        : "Yeni bir sistem rolü oluşturun."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetRoleModal}
                                disabled={isSaving}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {isLoadingRole ? (
                            <div className="px-6 py-12 text-center">
                                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#EE7402]" />
                            </div>
                        ) : (
                            <form onSubmit={handleSaveRole}>
                                <div className="space-y-5 px-6 py-6">
                                    {formError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {formError}
                                        </div>
                                    )}

                                    <div>
                                        <label
                                            htmlFor="modalRoleName"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Rol Adı
                                        </label>

                                        <input
                                            id="modalRoleName"
                                            name="roleName"
                                            type="text"
                                            value={formData.roleName}
                                            onChange={handleFormChange}
                                            disabled={!isRoleEditing || isSaving}
                                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="modalRoleDescription"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Açıklama
                                        </label>

                                        <textarea
                                            id="modalRoleDescription"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleFormChange}
                                            disabled={!isRoleEditing || isSaving}
                                            rows={4}
                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>

                                    {selectedRole && !isRoleEditing && (
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                Rol ID
                                            </label>

                                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                                                {selectedRole.roleId}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                                    {selectedRole && !isRoleEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={resetRoleModal}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                Kapat
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsRoleEditing(true)}
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
                                                    selectedRole
                                                        ? handleCancelEditing
                                                        : resetRoleModal
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
                                                {selectedRole ? "Kaydet" : "Oluştur"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {deleteModalRole && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 px-6 py-5">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Rolü Sil
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Bu işlem geri alınamaz.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm leading-6 text-gray-700">
                                <span className="font-semibold text-gray-900">
                                    {deleteModalRole.roleName}
                                </span>{" "}
                                rolünü silmek istediğinize emin misiniz?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setDeleteModalRole(null)}
                                disabled={
                                    deletingRoleId === deleteModalRole.roleId
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteRole}
                                disabled={
                                    deletingRoleId === deleteModalRole.roleId
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingRoleId === deleteModalRole.roleId && (
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